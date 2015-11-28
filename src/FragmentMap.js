var RPS = require('./index')
  , _ = require('./utils')
  , Constants = require('./Constants')
  , ACTION_DELETE = Constants.action.delete
  , ACTION_FETCH = Constants.action.fetch
  , ACTION_SAVE = Constants.action.save
  , FRAGMENT_DEFAULT = Constants.defaultFragment
  , FRAGMENT_DEFUALT = Constants.defaultFragment
  , STATUS_ERROR = Constants.status.ERROR
  , STATUS_PARTIAL = Constants.status.PARTIAL
  , STATUS_STALE = Constants.status.STALE
  , STATUS_SUCCESS = Constants.status.SUCCESS
  , TIMESTAMP_LOADING = Constants.timestamp.loading
  , TIMESTAMP_STALE = Constants.timestamp.stale;


/**
 * FragmentMap manages a collection of queries and mutators for a unique model
 * or type of data that might be represented through various fragments in partial
 * or complete form.
 *
 * TODO: Remove the need to understand status/timestamp externally?
 */
var FragmentMap = _.defineClass({
  initialize: function() {
    this.fragments = {};
    this.queries = {};
  },

  /**
   * Return a copy of a resource represented by a given resource descriptor
   */
  fetch: function(resourceDescriptor) {
    console.groupCollapsed("fragment::fetch");
    console.info("has data: %o", _.extend({}, this));

    var fragment = this._getFragment(resourceDescriptor.partial || FRAGMENT_DEFAULT)
      , resourceId = resourceDescriptor.id
      , result = null;

    result = {
      status: STATUS_STALE,
      timestamp: TIMESTAMP_STALE
    };

    if (resourceId) {
      var resource = fragment[resourceId];

      if (resource) {
        result.status = resource.status;
        result.timestamp = resource.timestamp
        result.data = resource.data
      }

      if (!result.data) {
        // Create a new list of fragments with our global default being last at highest priority.
        var fragments = [].concat(resourceDescriptor.fragments, FRAGMENT_DEFUALT);

        for (var i = 0; i < fragments.length; i++) {
          var fragment = fragments[i]
            , fragment_resource = this._getFragment(fragment)[resourceId];

          if (fragment_resource && fragment_resource.data) {
            console.info("using fragment: %O", fragment_resource);

            result.data = _.extend(result.data || {}, fragment_resource.data || {});
            result.status = STATUS_PARTIAL;
          }
        }
      }
    }
    else {
      var resource = this.queries[resourceDescriptor.path];

      if (resource) {
        result.status = resource.status;
        result.timestamp = resource.timestamp

        // Found a collection resource?
        if (_.isArray(resource.data)) {
          var resources = _.map(resource.data, function(id) {
            var resource = fragment[id];

            if (!resource) {
              throw new TypeError(
                "FragmentMap:fetch Unexpected error, failure to find collection entry for `" + id + "`."
              );
            }

            return resource.data;
          });

          result.data = resources;
        }
        // Query was for a non-id resource?
        else {
          result.data = resource.data;
        }
      }
    }

    console.info("result: %O", result);
    console.groupEnd();
    return result;
  },

  /**
   * Given a resourceDescriptor reference, update the root info.
   */
  touch: function(resourceDescriptor, touch) {
    _.log("fragment", "touch");
    var fragment = this._getFragment(resourceDescriptor.partial || FRAGMENT_DEFAULT);

    if (resourceDescriptor.id)
      return (fragment[resourceDescriptor.id] =
        _.extend(fragment[resourceDescriptor.id] || {}, touch));
    else
      return (this.queries[resourceDescriptor.path] =
        _.extend(this.queries[resourceDescriptor.path] || {}, touch));
  },

  /**
   * Given a resourceDescriptor reference, update the contained data.
   *
   * TODO: Maybe split this up instead of specifying action?
   */
  update: function(resourceDescriptor, action, response, status) {
    console.groupCollapsed("fragment::update");
    console.info("  * with descriptor %o", resourceDescriptor);
    var fragment = this._getFragment(resourceDescriptor.partial || FRAGMENT_DEFAULT)
      , resourcePath = resourceDescriptor.path
      , result = {};

    result = {
      status: status,
      timestamp: Date.now()
    }

    if (resourceDescriptor.id) {
      if (action === ACTION_FETCH) {
        fragment[resourceDescriptor.id] = _.extend(result, {data: response});
      }
      else if (action === ACTION_DELETE) {
        fragment[resourceDescriptor.id] = undefined;
        _.each(this.queries, function(resource, uri) {
          if (_.isArray(resource.data)) {
            var i = resource.data.indexOf(resourceDescriptor.id);
            if (i !== -1) {
              resource.data.splice(i, 1);
            }
          }
        });
      }
    }
    else {
      if (action === ACTION_FETCH) {
        if (_.isArray(response)) {
          // normalize set into entries
          response = _.map(response, function(item) {
            if (!_.isPlainObject(item))
              throw new TypeError('expected object, found ' + item + ' instead');

            fragment[item.id] = _.extend({}, result, {data: item});
            return item.id;
          });
        }

        if (resourcePath) {
          this.queries[resourcePath] = _.extend(result, {
            data: response,
            partial: resourceDescriptor.partial
          });
        }
      }
      else if (action === ACTION_SAVE) {
        this.queries[resourcePath] = _.extend(result, {data: response});
      }
      else if (action === ACTION_DELETE) {
        this.queries[resourcePath] = _.extend(result, {data: null});
      }
    }

    console.info("result: %O", result);
    console.groupEnd();
    return result;
  },

  _getFragment: function(fragment) {
    return this.fragments[fragment] ||
          (this.fragments[fragment] = {});
  }
});

module.exports = FragmentMap;
