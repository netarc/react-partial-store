var React = require('react')
  , _ = require('./utils')
  , Constants = require('./Constants')
  , StackInvoker = require('./StackInvoker')
  , STATUS_STALE = Constants.status.STALE
  , TIMESTAMP_LOADING = Constants.timestamp.loading;


var anyDataset = function(names, predicate) {
  var self = this;

  if (names) {
    names = [].concat(names || []);
  }

  return _.any(this.datasets, function(dataset, key) {
    if (names && names.indexOf(key) === -1) {
      return false;
    }

    return predicate(self[key]);
  });
};

var validateDataset = function(dataset, datasetKey) {
  // support dynamic dataset generators if we find a function
  if (_.isFunction(dataset)) {
    dataset = dataset.call(this);
  }

  if (!dataset) {
    throw new TypeError("validateDataset: expected non-null dataset for `" + datasetKey + "`");
  }
  else if (!dataset.resolve) {
    throw new TypeError("validateDataset: expected MixinResolvable derived dataset for `" + datasetKey + "`");
  }

  return dataset;
};

var MixinStatus = {
  isLoading: function(names) {
    return anyDataset.call(this, names, function(resource) {
      return resource.timestamp === TIMESTAMP_LOADING &&
             resource.status === STATUS_STALE;
    });
  },
  isPending: function(names) {
    return anyDataset.call(this, names, function(resource) {
      return resource.isPending();
    });
  },
  hasData: function(names) {
    return !anyDataset.call(this, names, function(resource) {
      return !resource.data;
    });
  },
  isStale: function(names) {
    return !anyDataset.call(this, names, function(resource) {
      return resource.status !== STATUS_STALE;
    });
  }
};

var createMixinDatasetAccessor = function(dataset, datasetKey) {
  return {
    componentWillMount: function() {
      var self = this
        , accessor = null
        , wrapper = {}
        , mutable = {}
        , validationErrors = {}
        , resourceDescriptor;

      dataset = validateDataset.call(this, dataset, datasetKey);
      // datasetConfig just allows the dataset block to be "clean" by offering
      // a seperate location to create local datasets with custom configurations.
      if (this.datasetConfig && this.datasetConfig[datasetKey]) {
        dataset = dataset.createDataset(this.datasetConfig[datasetKey]);
      }

      // Invoking a stack with no aciton just to get a descriptor of this dataset resource
      // so we know what actions are referenced and what store is used.
      resourceDescriptor = StackInvoker.invoke(dataset.resolve({__params: this.getComponentParams()}));

      // Wrap each allowed action to provide params & the mutable before
      // resolving to our given dataset.
      _.each(resourceDescriptor.actions, function(action, key) {
        var actionWrapper = action.wrap(function(stack) {
          return dataset.resolve([].concat(
            {__params: self.getComponentParams()},
            mutable,
            stack || []
          ));
        }, self);

        actionWrapper.__resolveInvoker = function(stack) {
          // TODO: We only allow one action to process at a time for now?
          if (actionWrapper.isPending) {
            return;
          }
          actionWrapper.isPending = true;

          var promise = StackInvoker.invoke(stack);
          if (!promise.then) {
            return promise;
          }

          promise.then(function() {
            actionWrapper.isPending = false;
          }, function(response) {
            actionWrapper.isPending = false;

            // TODO: Pending json format spec
            if (_.isPlainObject(response.data)) {
              validationErrors = response.data || {};
            }
          });

          return promise;
        };

        wrapper[key] = actionWrapper;
      });

      wrapper.invalidate = function(opts) {
        resourceDescriptor.store.invalidate(opts);
      };

      wrapper.errors = function(attribute) {
        if (attribute) {
          return validationErrors[attribute];
        }
        else {
          return validationErrors;
        }
      };

      wrapper.set = function(attribute, value) {
        mutable[attribute] = value;
        self.forceUpdate();
      };

      wrapper.setter = function(attribute) {
        return function(value) {
          mutable[attribute] = value;
          self.forceUpdate();
        };
      };

      wrapper.unset = function() {
        mutable = {};
      };

      wrapper.isDirty = function(attribute) {
        if (attribute) {
          return mutable[attribute] && mutable[attribute] !== accessor[attribute];
        }
        else {
          return _.any(mutable, function(value, key) {
            return value !== accessor[key];
          });
        }
      };

      wrapper.isPending = function(names) {
        if (names) {
          names = [].concat(names);
        }

        return _.any(resourceDescriptor.actions, function(action, key) {
          return (!names || names.indexOf(key) !== -1) && wrapper[key].isPending;
        });
      };

      Object.defineProperty(this, datasetKey, {
        get: function () {
          if (accessor) {
            return accessor;
          }

          var result = StackInvoker.invoke(dataset.resolve([
            {__params: self.getComponentParams()},
            {__params: {__getable: !!wrapper.get}},  // Sneakily hide in params for Resolver
            {__resolve: "fetch"}
          ]));

          // Mutable data is only merged when we have not yet loaded any data
          // or we know we are a non-collection type.
          if (!result.data || _.isPlainObject(result.data)) {
            result.data = _.extend({}, result.data || {}, mutable);
          }

          accessor = _.extend({}, wrapper, result);
          accessor.validationErrors = validationErrors;
          return accessor;
        }
      });

      // Do we have a store we can subscribe to for component render updates?
      if (resourceDescriptor.store) {
        var localEvent = resourceDescriptor.event
          , globalEvent = resourceDescriptor.type + ":" + localEvent
          , subscriptions = this.subscriptions = this.subscriptions || {};

        if (!subscriptions[globalEvent]) {
          // TODO: Switch this to throttle/debounce
          // TODO: We could also override render in the given component and toggle
          // a render flag
          subscriptions[globalEvent] = resourceDescriptor.store.subscribe(localEvent, function() {
            _.nextTick(function() {
              // We double check subscription status before invoking incase we were just unmounted
              if (self.subscriptions) {
                accessor = null;
                self.forceUpdate();
              }
            });
          });
        }
      }
    },

    componentWillUnmount: function() {
      if (this.subscriptions) {
        _.each(this.subscriptions, function(unsubscriber) {
          unsubscriber();
        });
      }
      this.subscriptions = null;
    }
  };
};

/**
 * Via React create a composite component class given a class specification
 * that will have accessors to any given datasets.
 *
 * @param {object} spec Class specification.
 * @return {function} Component constructor function.
 * @public
 */
var createClass = function(component) {
  var mixins = component.mixins || [];

  _.each(component.datasets || {}, function(dataset, datasetKey) {
    mixins.push(createMixinDatasetAccessor(dataset, datasetKey));
  });

  component.mixins = mixins.concat(
    MixinStatus,
    createClass.mixins,
    {
      getComponentParams: createClass.getComponentParams
    }
  );
  return React.createClass(component);
};

// Shim for adding mixins to RPS components
createClass.mixins = [];

// Shim for fetching a components params
createClass.getComponentParams = function() {
  return _.extend({}, this.props);
};

module.exports = createClass;
