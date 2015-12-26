var Promise = require("es6-promise").Promise
  , axios = require("axios")
  , Constants = require("./Constants")
  , StackReducer = require("./StackReducer")
  , RPS = require("./index")
  , STATUS_SUCCESS = Constants.status.SUCCESS
  , STATUS_STALE = Constants.status.STALE
  , TIMESTAMP_LOADING = Constants.timestamp.loading
  , ACTION_FETCH = Constants.action.fetch
  , ACTION_SAVE = Constants.action.save
  , ACTION_DELETE = Constants.action.delete
  , Resolvers = null
  , StackInvoker = {};


Promise.prototype._onerror = function(err) {
  if (Object.prototype.toString.call(err) == "[object Error]") {
    console.assert(false, err);
  }
};

/**
 * Given a known Store update a resource descriptors data and repeat with
 * any embedded data.
 */
function updateStoreResource(store, resourceDescriptor, data, action) {
  if (action == ACTION_FETCH) {
    RPS.responseHandler.default(data, resourceDescriptor);
  }
  else if (action == ACTION_DELETE) {
    store.deleteResource(resourceDescriptor);
  }
  else {
    store.updateResource(resourceDescriptor, data, STATUS_SUCCESS);
  }
}

function hookRequest(promise, resolve, reject, resourceDescriptor, action) {
  var store = resourceDescriptor.store;

  promise
    .then(function(response) {
      var data = response && response.data || {};

      updateStoreResource(store, resourceDescriptor, data, action);
      resolve(response);
      store.notifyChange(resourceDescriptor);
    }, function(response) {
      store.touchResource(resourceDescriptor, action, {timestamp: Date.now()});
      reject(response);
      store.notifyChange(resourceDescriptor);
    });
}

StackInvoker.Resolvers = Resolvers = {
  get: function(resourceDescriptor, stack, noNotify) {
    var store = resourceDescriptor.store;

    return new Promise(function(resolve, reject) {
      store.touchResource(resourceDescriptor, ACTION_FETCH, {status: STATUS_STALE, timestamp: TIMESTAMP_LOADING});
      if (!noNotify) {
        store.notifyChange(resourceDescriptor);
      }

      var promise = axios.get(resourceDescriptor.path);
      hookRequest(promise, resolve, reject, resourceDescriptor, ACTION_FETCH);
    });
  },

  create: function(resourceDescriptor) {
    var store = resourceDescriptor.store;

    return new Promise(function(resolve, reject) {
      store.touchResource(resourceDescriptor, ACTION_SAVE, {timestamp: TIMESTAMP_LOADING});
      store.notifyChange(resourceDescriptor);

      var promise = axios.post(resourceDescriptor.path, resourceDescriptor.payload);
      hookRequest(promise, resolve, reject, resourceDescriptor, ACTION_SAVE);
    });
  },

  update: function(resourceDescriptor) {
    var store = resourceDescriptor.store;

    return new Promise(function(resolve, reject) {
      store.touchResource(resourceDescriptor, ACTION_SAVE, {timestamp: TIMESTAMP_LOADING});
      store.notifyChange(resourceDescriptor);

      var promise = axios.put(resourceDescriptor.path, resourceDescriptor.payload);
      hookRequest(promise, resolve, reject, resourceDescriptor, ACTION_SAVE);
    });
  },

  delete: function(resourceDescriptor) {
    var store = resourceDescriptor.store;

    return new Promise(function(resolve, reject) {
      store.touchResource(resourceDescriptor, ACTION_DELETE, {timestamp: TIMESTAMP_LOADING});
      store.notifyChange(resourceDescriptor);

      var promise = axios.delete(resourceDescriptor.path);
      hookRequest(promise, resolve, reject, resourceDescriptor, ACTION_DELETE);
    });
  },

  // This is used to load our dataset accessor on a component, so this must return
  // a resource object instead of a promise.
  fetch: function(resourceDescriptor, stack) {
    console.info("fetch!");
    var store = resourceDescriptor.store
      , resource = store.fetchResource(resourceDescriptor);

    if (!resource.data || resource.timestamp < TIMESTAMP_LOADING) {
      this.get(resourceDescriptor, stack, true);
      resource = store.fetchResource(resourceDescriptor);
    }

    console.info("resource: %o", resource);
    return resource;
  }

  // invalidate: function(resourceDescriptor) {

  //   var result = this.fragmentMap.touch(resourceDescriptor, ACTION_FETCH, {
  //     status: STATUS_STALE,
  //     timestamp: TIMESTAMP_STALE
  //   });

  //   this._notifyChange(resourceDescriptor);
  //   return result;
  // }
};

StackInvoker.invoke = function(stack) {
  var resolveAction = null;

  // Consume all resolve actions and settle on our final one
  for (var i = 0; i < stack.length; i++) {
    if ((resolveAction = stack[i].__resolve)) {
      stack.splice(i, 1);
    }
  }


  var resourceDescriptor = StackReducer(stack);

  if (!resolveAction || !resourceDescriptor.store) {
    return resourceDescriptor;
  }

  var resolver = Resolvers[resolveAction];
  if (!resolver) {
    throw new Error("Invoker cannot resolve `" + resolveAction + "`");
  }

  var result = resolver.call(Resolvers, resourceDescriptor, stack);
  return result;
};

module.exports = StackInvoker;
