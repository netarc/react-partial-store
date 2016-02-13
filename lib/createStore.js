var _ = require('./utils')
  , RPS = require('./index')
  , FragmentMap = require('./FragmentMap')
  , MixinResolvable = require('./MixinResolvable')
  , MixinSubscribable = require('./MixinSubscribable')
  , StoreSet = require('./StoreSet');


var validDefinitionKeys = [
  "type",
  "actions",
  "onlyActions"
];

function validateDefinition(definition) {
  if (!_.isPlainObject(definition)) {
    throw new TypeError(
      "createStore: You're attempting to pass an invalid definition of type `" + typeof(definition) + "`. " +
      "A valid definition type is a regular object containing key values or a single string value denoting " +
      "the collection type."
    );
  }

  _.each(definition, function(value, key) {
    if (validDefinitionKeys.indexOf(key) == -1) {
      throw new TypeError(
        "createStore: Invalid definition option `" + key + "`."
      );
    }
  });

  if (definition.type && typeof(definition.type) !== "string") {
    throw new TypeError(
      "createStore: Option `type` can only be of type String but found type `" + typeof(definition.type) + "`."
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
}

/**
 * A store is simply a gateway to a collection of abstract objects via a data
 * store backer to either a named or anonymous collection type/name.
 *
 * Store specific options:
 * @param {String} [optional] type Define the unique name of objects
 *   this Store will manage. If not provided it will use an anonymous name and
 *   will not be able to be "looked up" from a simple string on a dataset.
 */
var Store = _.defineClass(MixinResolvable, MixinSubscribable, {
  initialize: function(definition) {
    this.definition = definition;
    this._scopes = {};
    this.reset();
  },

  reset: function() {
    this.fragmentMap = new FragmentMap();
  },

  createDataset: function() {
    var dataset = RPS.createDataset.apply(null, arguments);
    dataset.parent = this;
    return dataset;
  },

  addScope: function(key, scope) {
    this._scopes[key] = scope;
    this[key] = RPS.createScope.call(this, scope);
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
    if (resourceDescriptor.id) {
      this.trigger(resourceDescriptor.event);
    }
  },

  // Fragment Map is intentionally separate to allow future switching depending
  // on the need; this concept may change.

  fetchResource: function(resourceDescriptor) {
    return this.fragmentMap.fetch(resourceDescriptor);
  },

  touchResource: function(resourceDescriptor, data) {
    this.fragmentMap.touch(resourceDescriptor, data);
  },

  updateResource: function(resourceDescriptor, data, status) {
    this.fragmentMap.update(resourceDescriptor, data, status);
  },

  deleteResource: function(resourceDescriptor) {
    this.fragmentMap.delete(resourceDescriptor);
  }
});

function createStore(definition, dataset) {
  var store
    , type;

  if (typeof(definition) === "string") {
    definition = {type: definition};
  }

  definition = definition || {};
  validateDefinition(definition);

  if ((type = definition.type)) {
    store = StoreSet[type];

    if (store) {
      if (store.definition._shadow) {
        store.definition = definition;
      }
      else {
        throw new TypeError("createStore: Unexpected behavior, found existing Store of " +
        "type `" + type + "` while trying to redefine.");
      }
    }
    else {
      store = StoreSet[type] = new Store(definition);
    }
  }
  else {
    // an anonymous store still has a type for reference
    while (StoreSet[(type = _.randomString(12))]) {}
    definition.type = type;

    store = StoreSet[type] = new Store(definition);
  }

  return dataset ? store.createDataset(dataset) : store;
}
createStore.prototype = Store;

module.exports = createStore;
