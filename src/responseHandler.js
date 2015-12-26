var _ = require("./utils")
  , createStore = require("./createStore")
  , Constants = require("./Constants")
  , StoreSet = require("./StoreSet")
  , STATUS_SUCCESS = Constants.status.SUCCESS
  , Handlers = {};


////////////////////////////////////////////////////////////////////////////////////////////////////
// Handler: embeddableNoContainer
////////////////////////////////////////////////////////////////////////////////////////////////////

var embeddableNoContainer;

function parseObject(object) {
  if (!_.isPlainObject(object)) {
    throw new TypeError(
      "embeddableNoContainer:parseObject: expected object type but found `" + typeof(object) + "`."
    );
  }

  var result = {}
    , data = (result.data = {});

  _.each(object, function(value, key) {
    if (key[0] === '_') {
      if (key === "_type") {
        result.type = value;
      }
      else if (key === "_partial") {
        result.partial = value;
      }
      else {
        console.warn("embeddableNoContainer:parseObject: ignoring unknown object property `" + key + "`");
      }

      return;
    }

    // while parsing an object, any array/object is considered embedded data
    // so we just treat it like the start of a unknown request
    if (_.isArray(value) || _.isPlainObject(value)) {
      embeddableNoContainer(value);
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
  else {
    var resource = parseObject(data);

    result = resource.data;
    descriptor.id = result.id;
    discoveredType = resource.type;
    discoveredPartial = resource.partial;
  }

  var resolvedType = descriptor.type = descriptor.type || discoveredType
    , store = StoreSet[resolvedType];

  descriptor.partial = descriptor.partial ||
                       discoveredPartial ||
                       Constants.defaultFragment;

  if (!resolvedType) {
    throw new TypeError(
      "embeddableNoContainer: Failed to resolve data type."
    );
  }

  if (!store) {
    if (descriptor.isPrefetch) {
      store = createStore(resolvedType, {_shadow: true});
    }
    else {
      throw new TypeError(
        "embeddableNoContainer: Failed to resolve store for data type `" + resolvedType + "`."
      );
    }
  }

  store.updateResource(descriptor, result, STATUS_SUCCESS);
}

Handlers.embeddableNoContainer = embeddableNoContainer;

////////////////////////////////////////////////////////////////////////////////////////////////////

Handlers.default = embeddableNoContainer;

module.exports = Handlers;
