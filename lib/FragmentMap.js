var _ = require('./utils')
  , Constants = require('./Constants')
  , FRAGMENT_DEFAULT = Constants.defaultFragment
  , STATUS_PARTIAL = Constants.status.PARTIAL
  , STATUS_STALE = Constants.status.STALE
  , TIMESTAMP_STALE = Constants.timestamp.stale;


/**
 * FragmentMap is used for a single collection type of resource and manages a
 * collection of queries and fragment entries that represent either the complete
 * representation of a resource or named fragments of it.
 *
 * Each action requires a Resource Descriptor which requires the following data:
 * @param {String} path The end-point URI where this resource is associated.
 * @param {String} [optional] id The unique id for a give resource.
 * @param {String} [optional] partial The fragment to associate the resource with.
 * @param {Array(String)} [optional] fragments A list of fragments we allow a fetch
 *   to use to compose a partial representation of data.
 *
 * TODO: Should we remove the need to understand status/timestamp externally?
 */
var FragmentMap = _.defineClass({
  initialize: function() {
    this.fragments = {};
    this.queries = {};
  },

  /**
   * Will return a Stale resource when a given resource cannot be found by the
   * supplied descriptor.
   */
  fetch: function(descriptor) {
    var fragmentCache = this._getFragment(descriptor.partial || FRAGMENT_DEFAULT)
      , resourceId = descriptor.id
      , result = null
      , resource = null;

    result = {
      status: STATUS_STALE,
      timestamp: TIMESTAMP_STALE
    };

    if (resourceId) {
      resource = fragmentCache[resourceId];

      if (resource) {
        result.status = resource.status;
        result.timestamp = resource.timestamp;
        result.data = resource.data;
      }

      if (!result.data) {
        // Create a new list of fragments with our global default being last at highest priority.
        var fragments = [].concat(descriptor.fragments, FRAGMENT_DEFAULT);

        for (var i = 0; i < fragments.length; i++) {
          fragmentCache = this._getFragment(fragments[i])[resourceId];

          if (fragmentCache && fragmentCache.data) {
            result.data = _.extend(result.data || {}, fragmentCache.data || {});
            result.status = STATUS_PARTIAL;
          }
        }
      }
    }
    else if (descriptor.path) {
      var data;

      resource = this.queries[descriptor.path];
      if (resource) {
        result.status = resource.status;
        result.timestamp = resource.timestamp;
      }

      if (!resource || !(data = resource.data)) {
        return result;
      }

      // Found a collection resource?
      if (_.isArray(data)) {
        var entries = _.map(data, function(id) {
          var entry = fragmentCache[id];

          if (!entry) {
            throw new TypeError(
              "FragmentMap:fetch Unexpected error, failure to find collection entry for `" + id + "`."
            );
          }

          return entry.data;
        });

        result.data = entries;
      }
      else if (typeof(data) !== "object") {
        var entry = fragmentCache[data];
        if (!entry) {
          throw new TypeError(
            "FragmentMap:fetch Unexpected error, failure to find entry for `" + data + "`."
          );
        }

        result.data = entry.data;
      }
      // Query was for a non-id resource?
      else {
        result.data = data;
      }
    }

    return result;
  },

  /**
   * Update the metadata for a given resource.
   *
   * TODO: Maybe guard this more or change where metadata is stored as this method
   * could change the `data` property.
   */
  touch: function(descriptor, touch) {
    var fragmentCache = this._getFragment(descriptor.partial || FRAGMENT_DEFAULT);

    if (!touch) {
      return;
    }

    if (descriptor.id) {
      fragmentCache[descriptor.id] = _.extend(fragmentCache[descriptor.id] || {}, touch);
    }
    else if (descriptor.path) {
      this.queries[descriptor.path] = _.extend(this.queries[descriptor.path] || {}, touch);
    }
  },

  /**
   * Update the content for a given resource.
   */
  update: function(descriptor, data, status) {
    var fragment = descriptor.partial || FRAGMENT_DEFAULT
      , fragmentCache = this._getFragment(fragment)
      , resourcePath = descriptor.path
      , result = {};

    result = {
      status: status,
      timestamp: Date.now()
    };

    if (descriptor.id) {
      fragmentCache[descriptor.id] = _.extend(result, {data: data});
    }
    else {
      if (_.isArray(data)) {
        // normalize set into entries
        data = _.map(data, function(item) {
          if (!_.isPlainObject(item)) {
            throw new TypeError('expected object, found ' + item + ' instead');
          }

          fragmentCache[item.id] = _.extend({}, result, {data: item});
          return item.id;
        });
      }
      // data has an id so lets unload it into fragments
      else if (data.id) {
        fragmentCache[data.id] = _.extend({}, result, {data: data});
        data = data.id;
      }

      if (resourcePath) {
        this.queries[resourcePath] = _.extend(result, {
          data: data,
          partial: fragment
        });
      }
    }

    return result;
  },

  /**
   * Delete the content for a given resource.
   *
   * NOTE: We opt to set value to undefined vs deleting the key itself due to
   * performance reasons (testing shows delete ~98% slower).
   */
  delete: function(descriptor) {
    var fragmentCache = this._getFragment(descriptor.partial || FRAGMENT_DEFAULT)
      , resourcePath = descriptor.path;

    if (descriptor.id) {
      if (!fragmentCache[descriptor.id]) {
        return;
      }

      fragmentCache[descriptor.id] = undefined;
      // Remove our-self from any collection queries we know about
      _.each(this.queries, function(resource) {
        if (_.isArray(resource.data)) {
          var i = resource.data.indexOf(descriptor.id);
          if (i !== -1) {
            resource.data.splice(i, 1);
          }
        }
      });
    }
    else if (resourcePath && this.queries[resourcePath]) {
      this.queries[resourcePath] = undefined;
    }
  },

  _getFragment: function(fragment) {
    return this.fragments[fragment] ||
          (this.fragments[fragment] = {});
  }
});

module.exports = FragmentMap;
