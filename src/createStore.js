var axios = require("axios")
  , Promise = require("es6-promise").Promise
  , RPS = require("./index")
  , _ = require("./utils")
  , StoreSet = require("./StoreSet")
  , MixinResolvable = require("./MixinResolvable")
  , MixinSubscribable = require("./MixinSubscribable")
  , FragmentMap = require("./FragmentMap")
  , Exports = {};

Promise.prototype._onerror = function(err) {
  if (Object.prototype.toString.call(err) == "[object Error]") {
    console.assert(false, err);
  }
}

function validateDefinition(definition) {
  if (!_.isPlainObject(definition)) {
    throw new TypeError(
      "createStore: You're attempting to pass an invalid definition of type `" + typeof(definition) + "`. " +
      "A valid definition type is a regular object containing key values or a single string value denoting " +
      "the collection type."
    );
  }

  if (definition.type && typeof(definition.type) !== "string") {
    throw new TypeError(
      "createStore: Option `type` can only be of type String but found type `" + typeof(definition.type) + "`."
    );
  }

  if (definition.initialParams && !_.isPlainObject(definition.initialParams)) {
    throw new TypeError(
      "createStore: Option `initialParams` can only be of type Object but found " +
      "type `" + typeof(definition.initialParams) + "`."
    );
  }

  if (definition.uri && typeof(definition.uri) !== "string") {
    throw new TypeError(
      "createStore: Option `uri` can only be of type String but found type `" + typeof(definition.uri) + "`."
    );
  }

  if (definition.actions && !_.isPlainObject(definition.actions)) {
    throw new TypeError(
      "createStore: Option `actions` can only be of type Object but found " +
      "type `" + typeof(definition.actions) + "`."
    );
  }

  if (definition.onlyActions && !_.isPlainObject(definition.onlyActions)) {
    throw new TypeError(
      "createStore: Option `onlyActions` can only be of type Object but found " +
      "type `" + typeof(definition.onlyActions) + "`."
    );
  }

  return definition;
};

/**
 * A store is simply a gateway to a collection of abstract objects via a data
 * store backer to either a named or anonymous collection type/name.
 *
 * Store specific options:
 * @param {String} [optional] type Define the unique name of objects
 *   this Store will manage. If not provided it will use an anonymous name andf
 *   will not be able to be "looked up" from a simple string on a dataset.
 * @param {Object} [optional] initialParams Params that will be used as default
 *   params while an object is being fetched.
 *
 * Common options that Actions/Store/Datasets all share:
 * @param {String} [optional] uri A URI that will be resolve and concat with other
 *   URI's in the action chain.
 * @param {...Action} [optional] actions A list of `actions` can be provided
 *   as additional actions to be allowed to perform on data from this store.
 * @param {...Action} [optional] onlyActions A list of `actions` can be provided
 *   as the new base set actions to be allowed in the hierarchy.
 */
var Store = _.defineClass(MixinResolvable, MixinSubscribable, {
  initialize: function(definition) {
    this.definition = definition;
    this.fragmentMap = new FragmentMap();
  },

  createDataset: function() {
    var dataset = RPS.createDataset.apply(null, [].slice.call(arguments));
    dataset.parent = this;
    return dataset;
  },

  // MixinResolvable

  getResolvable: function() {
    return {
      __type: "store",
      __definition: this.definition,
      __reference: this
    };
  },

  //

  notifyChange: function(resourceDescriptor) {
    this.trigger("change");
    if (resourceDescriptor.id)
      this.trigger(resourceDescriptor.event);
  },

  // Fragment Map is intentionally separate to allow future switching depending
  // on the need; this concept may change.

  fetchResource: function(resourceDescriptor) {
    return this.fragmentMap.fetch(resourceDescriptor);
  },

  touchResource: function(resourceDescriptor, action, data) {
    this.fragmentMap.touch(resourceDescriptor, data);
  },

  updateResource: function(resourceDescriptor, action, data, status) {
    this.fragmentMap.update(resourceDescriptor, action, data, status)
  }
});

/**
 *
 */
module.exports = function(type, definition) {
  var store;

  if (typeof(type) !== "string") {
    definition = type;
    type = null;
  }

  definition = definition || {}

  if (type) {
    var store = StoreSet[type];
    if (!store) {
      store = StoreSet[type] = new Store(validateDefinition(definition));
    }
    else if (definition) {
      console.warn("createStore: Unexpected behavior, found existing Store of collection " +
      "type `" + type + "` while trying to redefine.");
    }
  }
  else {
    store = new Store(validateDefinition(definition));
  }

  return store;
};
