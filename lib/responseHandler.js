var Constants = require('./Constants')
  , StackReducer = require('./StackReducer')
  , createStore = require('./createStore')
  , StoreSet = require('./StoreSet')
  , STATUS_SUCCESS = Constants.status.SUCCESS;


function responseHandler(data, descriptor, handler) {
  var result = (handler || responseHandler.defaultHandler)(data, descriptor)
    , type = descriptor && descriptor.type || result.type;

  if (!type) {
    throw new TypeError(
      "responseHandler: Failed to resolve data type."
    );
  }

  var store = StoreSet[type];

  if (!descriptor) {
    descriptor = store ? StackReducer(store.resolve()) : {};
  }
  descriptor.type = type;
  descriptor.partial = descriptor.partial ||
                       result.partial ||
                       Constants.defaultFragment;

  if (!store) {
    if (descriptor.isPrefetch) {
      store = createStore({type: type, _shadow: true});
    }
    else {
      throw new TypeError(
        "responseHandler: Failed to resolve store for data type `" + type + "`."
      );
    }
  }

  store.updateResource(descriptor, result.data, STATUS_SUCCESS);
}

/**
 * responseHandler serves as a collection/object parser for the resulting JSON of
 * a request. This parser will gather objects and send them off the the associated
 * Store for storage.
 *
 * New handlers can be added and the default able to be changed so one can
 * customize how they expect their backend show data and how RPS imports that data.
 */
responseHandler.handlers = {
  containerless_unnested:  require("./handlers/containerless_unnested"),
  containerless_nested: require("./handlers/containerless_nested")
};

responseHandler.defaultHandler = responseHandler.handlers.containerless_nested;

module.exports = responseHandler;
