var _ = require("./utils")
  , createStore = require("./createStore")
  , Constants = require("./Constants")
  , StoreSet = require("./StoreSet")
  , STATUS_SUCCESS = Constants.status.SUCCESS
  , FRAGMENT_DEFAULT = Constants.defaultFragment
  , ACTION_FETCH = Constants.action.fetch
  , Handlers = {};


////////////////////////////////////////////////////////////////////////////////////////////////////
// Handler: embeddableNoContainer
////////////////////////////////////////////////////////////////////////////////////////////////////

var embeddableNoContainer;

function parseObject(object) {
  if (!_.isPlainObject(object)) {
    throw new TypeError(
      "embeddableNoContainer:parseObject expected object type but found `" + typeof(object) + "`."
    );
  }

  var result = {}
    , data = (result.data = {});

  _.each(object, function(value, key) {
    if (key[0] === '_') {
      if (key === "_type")
        result.type = value;
      else if (key === "_partial")
        result.partial = value;
      else
        console.warn("embeddableNoContainer: ignoring unknown object property `" + key + "`");

      return;
    }

    // while parsing an object, any array/object is considered embedded data
    // so we just treat it like the start of a unknown request
    if (_.isArray(value) || _.isPlainObject(value)) {
      embeddableNoContainer(value)
    }
    else {
      data[key] = value;
    }
  });

  return result;
}

function embeddableNoContainer(data, descriptor) {
  var result = null
    , discoveredType = null
    , discoveredPartial = null;

  descriptor = descriptor || {};
  console.info("embeddableNoContainer: %o | %o", data, descriptor);
  // collection
  if (_.isArray(data)) {
    result = [];

    for (var i = 0; i < data.length; i++) {
      var object = data[i]
        , entry = parseObject(object);

      if (entry.type) {
        if (discoveredType && discoveredType !== entry.type) {
          throw new TypeError(
            "embeddableNoContainer: Found conflicting types inside array of `" + discoveredType +
            "` and `" + entry.type + "`."
          );
        }
        discoveredType = entry.type;
      }

      if (entry.partial) {
        if (discoveredPartial && discoveredPartial !== entry.partial) {
          throw new TypeError(
            "embeddableNoContainer: Found conflicting partials inside array of `" + discoveredPartial +
            "` and `" + entry.partial + "`."
          );
        }
        discoveredPartial = entry.partial;
      }

      result.push(entry.data);
    }
  }
  // non-collection
  else if (_.isPlainObject(data)) {
    var resource = parseObject(data);

    result = resource.data
    descriptor.id = result.id;
    discoveredType = resource.type
    discoveredPartial = resource.partial;
  }
  else {
    throw new Error(
      "embeddableNoContainer: encountered an invalid object while " +
      "parsing response of `" + typeof(data) + "`"
    );
  }

  var resolvedType = descriptor.type = descriptor.type || discoveredType
    , resolvedPartial = descriptor.partial = descriptor.partial ||
                                             discoveredPartial ||
                                             Constants.defaultFragment
    , store = StoreSet[resolvedType];

  if (!resolvedType) {
    throw new TypeError(
      "embeddableNoContainer: Failed to resolve data type."
    );
  }

  if (!store) {
    if (options.isPrefetch) {
      store = createStore(resolvedType, {_shadow: true});
    }
    else {
      throw new TypeError(
        "embeddableNoContainer: Failed to resolve store for data type `" + resolvedType + "`."
      );
    }
  }

  store.updateResource(descriptor, ACTION_FETCH, result, STATUS_SUCCESS);
};

Handlers.embeddableNoContainer = embeddableNoContainer;

////////////////////////////////////////////////////////////////////////////////////////////////////

Handlers.default = embeddableNoContainer;

module.exports = Handlers;
