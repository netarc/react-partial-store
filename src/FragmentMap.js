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
    this.data = {};
  },

  /**
   * Return a copy of a resource represented by a given resource descriptor
   */
  fetch: function(resourceDescriptor) {
    console.groupCollapsed("fragment::fetch");

    var fragment = this._getFragment(resourceDescriptor.partial || FRAGMENT_DEFAULT)
      , resourceId = resourceDescriptor.id
      , result = null;

    result = {
      status: STATUS_STALE,
      timestamp: TIMESTAMP_STALE
    };

    if (resourceId) {
      var resource = fragment.entries[resourceId];

      if (resource)
        _.extend(result, resource);

      if (!result.data) {
        // Create a new list of fragments with our global default being last at highest priority.
        var fragments = [].concat(resourceDescriptor.fragments, FRAGMENT_DEFUALT);

        for (var i = 0; i < fragments.length; i++) {
          var fragment = fragments[i]
            , fragment_resource = this._getFragment(fragment).entries[resourceId];

          if (fragment_resource && fragment_resource.data) {
            console.info("using fragment: %O", fragment_resource);

            result.data = _.extend(result.data || {}, fragment_resource.data || {});
            result.status = STATUS_PARTIAL;
          }
        }
      }
    }
    else {
      var query = fragment.queries[resourceDescriptor.path];

      if (query) {
        // Found a colleciton query?
        if (_.isArray(query.data)) {
          var resources = _.map(query.data, function(id) {
            return _.extend({
              status: STATUS_STALE,
              timestamp: TIMESTAMP_STALE
            }, fragment.entries[id] || {});
          });

          _.extend(result, query, {data: resources});
        }
        // Query was for a non-id resource?
        else {
          _.extend(result, query);
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
      return (fragment.entries[resourceDescriptor.id] =
        _.extend(fragment.entries[resourceDescriptor.id] || {}, touch));
    else
      return (fragment.queries[resourceDescriptor.path] =
        _.extend(fragment.queries[resourceDescriptor.path] || {}, touch));
  },

  /**
   * Given a resourceDescriptor reference, update the contained data.
   *
   * TODO: Maybe split this up instead of specifying action?
   */
  update: function(resourceDescriptor, action, response, status) {
    console.groupCollapsed("fragment::update");
    var fragment = this._getFragment(resourceDescriptor.partial || FRAGMENT_DEFAULT)
      , result = {};

    result = {
      status: status,
      timestamp: Date.now()
    }

    if (resourceDescriptor.id) {
      if (action === ACTION_FETCH) {
        fragment.entries[resourceDescriptor.id] = _.extend(result, {data: response.data});
      }
      else if (action === ACTION_DELETE) {
        fragment.entries[resourceDescriptor.id] = undefined;
        _.each(fragment.queries, function(resource, uri) {
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
        if (_.isArray(response.data)) {
          // normalize set into entries
          var ids = _.map(response.data, function(item) {
            if (!_.isPlainObject(item))
              throw new TypeError('expected object, found ' + item + ' instead');

            fragment.entries[item.id] = _.extend({}, result, {data: item});
            return item.id;
          });

          // cache set
          fragment.queries[resourceDescriptor.path] = _.extend(result, {data: ids});
        }
        else {
          fragment.queries[resourceDescriptor.path] = _.extend(result, {data: response.data});
        }
      }
      else if (action === ACTION_SAVE) {
        fragment.queries[resourceDescriptor.path] = _.extend(result, {data: response.data});
      }
      else if (action === ACTION_DELETE) {
        fragment.queries[resourceDescriptor.path] = _.extend(result, {data: []});
      }
    }

    console.info("updated fragment data: %O", this.data);
    console.info("result: %O", result);
    console.groupEnd();
    return result;
  },

  _getFragment: function(fragment) {
    return this.data[fragment] ||
          (this.data[fragment] = {entries: {}, queries: {}});
  }
});

module.exports = FragmentMap;
