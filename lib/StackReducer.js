var _ = require("./utils")
  , RPS = require("./index");


var fillURI = function(uri, params, paramMap) {
  var vars = uri.match(/:(\w+)/g) || []
    , lastParamKey = null;

  for (var i = 0; i < vars.length; i++) {
    var v = vars[i]
      , value;

    lastParamKey = v.substr(1);
    if (paramMap && paramMap[lastParamKey]) {
      lastParamKey = paramMap[lastParamKey];
    }

    if ((value = params[lastParamKey])) {
      uri = uri.replace(v, value);
    }
    else {
      throw new TypeError("Failed to map path component `" + lastParamKey + "` for `" + uri + "`" +
      " while using params: " + JSON.stringify(params));
    }
  }

  return {
    lastParamKey: lastParamKey,
    uri: uri
  };
};

module.exports = function(stack) {
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
    , i, op, definition
    , lastURIParamId = null;

  stack = stack || [];

  // Pass 1
  for (i = 0; i < stack.length; i++) {
    op = stack[i];
    definition = op.__definition;

    if (definition) {
      // Store specific resolve rules
      if (op.__type === "store") {
        resolvedStore = op.__reference;

        if (definition.type) {
          resolvedType = definition.type;
        }
      }

      // Dataset specific resolve rules
      if (op.__type === "dataset") {
        if (definition.paramMap) {
          resolvedParamMap = _.extend(resolvedParamMap, definition.paramMap);
        }

        if (definition.partial) {
          resolvedPartial = definition.partial;
        }

        if (definition.fragments) {
          resolvedFragments = _.concatUnique(resolvedFragments, definition.fragments);
        }
      }

      // NOTE: We intentionally unset a resolved paramId on a new scope
      resolvedParamId = definition.paramId || undefined;

      if (definition.onlyActions) {
        if (!_.isPlainObject(definition.onlyActions)) {
          throw new TypeError("onlyActions was not an object, but of type \"" + typeof definition.onlyActions + "\"");
        }
        resolvedActions = _.extend({}, definition.onlyActions);
      }

      if (definition.actions) {
        if (!_.isPlainObject(definition.actions)) {
          throw new TypeError("actions was not an object, but of type \"" + typeof definition.actions + "\"");
        }
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
  for (i = 0; i < stack.length; i++) {
    op = stack[i];
    definition = op.__definition;

    if (definition) {
      if (definition.uri) {
        var result = fillURI(definition.uri, resolvedParams, resolvedParamMap);
        resolvedPath+= result.uri;
        lastURIParamId = result.lastParamKey;
      }
    }
  }

  resolvedPath = _.hostname + resolvedPath;

  var key = resolvedParamId || lastURIParamId || "id";
  if (resolvedParamMap[key]) {
    key = resolvedParamMap[key];
  }
  resolvedParamId = (resolvedParamId = resolvedParams[key]) &&
                    ("" + resolvedParamId);

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
};
