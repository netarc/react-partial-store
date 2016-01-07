var Promise = require("es6-promise").Promise
  , axios = require("axios")
  , _ = require("./utils")
  , Constants = require("./Constants")
  , RPS = require("./index")
  , StackReducer = require("./StackReducer")
  , STATUS_SUCCESS = Constants.status.SUCCESS
  , STATUS_STALE = Constants.status.STALE
  , TIMESTAMP_LOADING = Constants.timestamp.loading
  , ACTION_FETCH = Constants.action.fetch
  , ACTION_SAVE = Constants.action.save
  , ACTION_DELETE = Constants.action.delete
  , Resolvers = null
  , StackInvoker = {};


/**
 * Given a known Store update a resource descriptors data and repeat with
 * any embedded data.
 */
function updateStoreResource(store, resourceDescriptor, data, action) {
  if (action == ACTION_FETCH) {
    RPS.responseHandler(data, resourceDescriptor);
  }
  else if (action == ACTION_DELETE) {
    store.deleteResource(resourceDescriptor);
  }
  else {
    store.updateResource(resourceDescriptor, data, STATUS_SUCCESS);
  }
}

function makeRequest(method, resourceDescriptor, action, touchParams, noTouchNotify) {
  var store = resourceDescriptor.store
    , requestConfig = {
      method: method,
      url: resourceDescriptor.path,
      data: resourceDescriptor.payload
    };

  touchParams = _.extend({timestamp: TIMESTAMP_LOADING}, touchParams || {});

  store.touchResource(resourceDescriptor, touchParams);
  if (!noTouchNotify) {
    store.notifyChange(resourceDescriptor);
  }

  return new Promise(function(resolve, reject) {
    axios(requestConfig)
      .then(function(response) {
        var data = response && response.data || {};

        updateStoreResource(store, resourceDescriptor, data, action);
        resolve(response);
        store.notifyChange(resourceDescriptor);
      }, function(response) {
        store.touchResource(resourceDescriptor, {timestamp: Date.now()});
        reject(response);
        store.notifyChange(resourceDescriptor);
      })
      .then(undefined, function(err) {
        console.assert(false, err);
      });
  });
}

StackInvoker.Resolvers = Resolvers = {
  get: function(resourceDescriptor, noTouchNotify) {
    return makeRequest('get',
                       resourceDescriptor,
                       ACTION_FETCH,
                       {status: STATUS_STALE},
                       noTouchNotify);
  },

  create: function(resourceDescriptor) {
    return makeRequest('post',
                       resourceDescriptor,
                       ACTION_SAVE);
  },

  update: function(resourceDescriptor) {
    return makeRequest('put',
                       resourceDescriptor,
                       ACTION_SAVE);
  },

  delete: function(resourceDescriptor) {
    return makeRequest('delete',
                       resourceDescriptor,
                       ACTION_DELETE);
  },

  // This is used to load our dataset accessor on a component, so this must return
  // a resource object instead of a promise.
  fetch: function(resourceDescriptor) {
    var store = resourceDescriptor.store
      , resource = store.fetchResource(resourceDescriptor);

    // We sneakily pass getable in our params
    if (!resourceDescriptor.params.__getable) {
      return resource;
    }

    if (!resource.data || resource.timestamp < TIMESTAMP_LOADING) {
      this.get(resourceDescriptor, true);
      resource = store.fetchResource(resourceDescriptor);
    }

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
