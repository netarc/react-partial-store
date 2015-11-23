var axios = require("axios")
  , _ = require("./utils")
  , Constants = require("./Constants")
  , RPS = require("./index")
  , StoreSet = require("./StoreSet")
  , Resolvers = null
  , StackInvoker = {}
  , STATUS_SUCCESS = Constants.status.SUCCESS
  , STATUS_ERROR = Constants.status.ERROR
  , STATUS_PARTIAL = Constants.status.PARTIAL
  , STATUS_STALE = Constants.status.STALE
  , FRAGMENT_DEFAULT = Constants.defaultFragment
  , TIMESTAMP_STALE = Constants.timestamp.stale
  , TIMESTAMP_LOADING = Constants.timestamp.loading
  , ACTION_FETCH = Constants.action.fetch
  , ACTION_SAVE = Constants.action.save
  , ACTION_DELETE = Constants.action.delete;

var composeURI = function(uri, params, paramMap) {
  var pieces = uri.split('/');

  for (var i = 0; i < pieces.length; i++) {
    var piece = pieces[i];

    if (piece[0] == ':') {
      var key =  piece.substr(1);

      if (paramMap && paramMap[key]) {
        key = paramMap[key];
      }

      if (params[key]) {
        pieces[i] = params[key];
      }
      else {
        throw new TypeError("Failed to map path component `" + key + "` for: " + uri);
      }
    }
  }

  return pieces.join('/');
}

var resolveResource = function(stack) {
  var resolvedParams = {}
    , resolvedParamMap = {}
    , resolvedPartial = null
    , resolvedType = null
    , resolvedStore = null
    , resolvedActions = _.extend({}, RPS.actions)
    , resolvedPath = ""
    , resolvedFragments = []
    , resolvedParamId = null
    , resolvedPayload = {}
    , i;

  // Pass 1
  for (var i = 0; i < stack.length; i++) {
    var op = stack[i]
      , definition = op.__definition;

    if (definition) {
      // Store specific resolve rules
      if (op.__type === "store") {
        resolvedStore = op.__reference;

        if (definition.type)
          resolvedType = definition.type;
      }

      // Dataset specific resolve rules
      if (op.__type === "dataset") {
        if (definition.paramMap)
          resolvedParamMap = _.extend(resolvedParamMap, definition.paramMap);

        if (definition.partial)
          resolvedPartial = definition.partial;

        if (definition.fragments)
          resolvedFragments = resolvedFragments.concat(definition.fragments);
      }

      // Common resolve rules
      if (definition.paramId)
        resolvedParamId = definition.paramId;

      if (definition.onlyActions) {
        if (!_.isPlainObject(definition.onlyActions)) {
          throw new TypeError("onlyActions was not an object, but of type \"" + typeof definition.onlyActions + "\"");
        }
        resolvedActions = _.extend({}, definition.onlyActions);
      }

      if (definition.actions) {
        if (!_.isPlainObject(definition.actions))
          throw new TypeError("actions was not an object, but of type \"" + typeof definition.actions + "\"");
        resolvedActions = _.extend(resolvedActions, definition.actions);
      }
    }
    else if (op.__params) {
      resolvedParams = _.extend(resolvedParams, op.__params);
    }
    else if (_.isPlainObject(op)) {
      resolvedPayload = _.extend(resolvedPayload, op);
    }
  }

  // Pass 2 - Since URI uses resolved params we need to do it separately
  for (var i = 0; i < stack.length; i++) {
    var op = stack[i]
      , definition = op.__definition;

    if (definition) {
      if (definition.uri)
        resolvedPath+= composeURI(definition.uri, resolvedParams, resolvedParamMap);
    }
  }

  var key = resolvedParamId || "id";
  if (resolvedParamMap[key])
    key = resolvedParamMap[key];
  resolvedParamId = resolvedParams[key];

  var event = ["change"].concat(resolvedParamId || []).join(':');

  return {
    actions: resolvedActions,
    event: event,
    partial: resolvedPartial,
    id: resolvedParamId,
    params: resolvedParams,
    fragments: resolvedFragments.reverse(),
    path: resolvedPath,
    payload: resolvedPayload,
    store: resolvedStore,
    type: resolvedType
  };
}

/**
 * Given a known Store update a resource descriptors data and repeat with
 * any embedded data.
 */
function updateStoreResource(store, resourceDescriptor, data, action) {
  store.updateResource(resourceDescriptor, action, data, STATUS_SUCCESS);

  // TODO: any embedded data needs to find its store and update there..
  if (action == ACTION_FETCH) {

  }
}

function hookRequest(promise, resolve, reject, resourceDescriptor, action) {
  var store = resourceDescriptor.store;

  promise
    .then(function(response) {
      console.groupCollapsed("StackInvoker::hookRequest %c%s", 'font-weight:normal;color:#00aa00', action);
      var data = response && response.data || {};

      updateStoreResource(store, resourceDescriptor, data, action);
      resolve(response);
      store.notifyChange(resourceDescriptor);
      console.groupEnd();
    }, function(response) {
      console.groupCollapsed("StackInvoker::hookRequest %c%s", 'font-weight:normal;color:#ff0000;', action);
      store.touchResource(resourceDescriptor, action, {timestamp: Date.now()});
      reject(response);
      store.notifyChange(resourceDescriptor);
      console.groupEnd();
    });
}

StackInvoker.Resolvers = Resolvers = {
  get: function(resourceDescriptor, stack, noNotify) {
    var store = resourceDescriptor.store;

    return new Promise(function(resolve, reject) {
      store.touchResource(resourceDescriptor, ACTION_FETCH, {status: STATUS_STALE, timestamp: TIMESTAMP_LOADING})
      if (!noNotify)
        store.notifyChange(resourceDescriptor);

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
    var store = resourceDescriptor.store
      , resource = store.fetchResource(resourceDescriptor)

    if (!resource.data || resource.timestamp < TIMESTAMP_LOADING) {
      this.get(resourceDescriptor, stack, true);
      resource = store.fetchResource(resourceDescriptor)
    }

    return resource;
  }

  // invalidate: function(resourceDescriptor) {
  //   _.log("store", "resolveInvalidate");

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

  // Ideally it would be nice if our resolve declaration was at the end of the
  // chain, but action hooks chains start from the front in order to keep the
  // rear-to-front priority.
  for (var i = 0; i < stack.length; i++) {
    if (resolveAction = stack[i].__resolve) {
      stack.splice(i, 1);
      break;
    }
  }

  console.groupCollapsed("StackInvoker::invoke %c%s", 'font-weight:normal;', resolveAction || "{descriptor}");

  var resourceDescriptor = resolveResource(stack);

  if (!resolveAction || !resourceDescriptor.store) {
    console.groupEnd();
    return resourceDescriptor;
  }

  var resolver = Resolvers[resolveAction];
  if (!resolver)
    throw new Error("Store cannot resolve `" + resolveAction + "`");

  var result = resolver.call(Resolvers, resourceDescriptor, stack);
  console.groupEnd();
  return result
};

module.exports = StackInvoker;
