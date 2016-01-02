var React = require("react")
  , Constants = require("./Constants")
  , _ = require('./utils')
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

var MixinStatus = {
  isLoading: function(names) {
    return anyDataset.call(this, names, function(resource) {
      console.info(resource);
      return resource.timestamp === TIMESTAMP_LOADING;
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
        , resource = StackInvoker.invoke(dataset.resolve({__params: this.getComponentParams()}));

      // Wrap each allowed action to provide params & the mutable before
      // resolving to our given dataset.
      _.each(resource.actions, function(action, key) {
        var wrapped = action.wrap(function(stack) {
          return dataset.resolve([].concat(
            {__params: self.getComponentParams()},
            mutable,
            stack || []
          ));
        }, self);

        wrapped.__resolveInvoker = function(stack) {
          var promise = StackInvoker.invoke(stack);

          if (!promise.then) {
            return promise;
          }

          promise.then(undefined, function(response) {
            // TODO: Pending json format spec
            if (_.isPlainObject(response.data)) {
              // validationErrors = response.data.errors || {};
            }
          });

          return promise;
        };

        wrapper[key] = wrapped;
      });

      wrapper.change = function(attribute) {
        return function(value) {
          mutable[attribute] = value;
        };
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
      }

      Object.defineProperty(this, datasetKey, {
        get: function () {
          if (accessor) {
            return accessor;
          }

          var result = StackInvoker.invoke([].concat(
            dataset.resolve({__params: self.getComponentParams()}),
            {__resolve: "fetch"}
          ));

          accessor = _.extend({}, wrapper, result);
          accessor.validationErrors = validationErrors;
          return accessor;
        }
      });

      // Do we have a store we can subscribe to for component render updates?
      if (resource.store) {
        var event = resource.event
          , subscriptions = this.subscriptions = this.subscriptions || {};

        if (!subscriptions[event]) {
          // TODO: Switch this to throttle/debounce
          // TODO: We could also override render in the given component and toggle
          // a render flag
          subscriptions[event] = resource.store.subscribe(event, function() {
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
        _.each(this.subscriptions, function(unsubscriber, event) {
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