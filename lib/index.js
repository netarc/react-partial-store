var _ = require('./utils')
  , StoreSet = require("./StoreSet");


exports.createClass = require('./createClass');
var createStore = exports.createStore = require('./createStore');
var createDataset = exports.createDataset = require('./createDataset');
exports.prefetchCache = require('./prefetchCache');
exports.responseHandler = require('./responseHandler');

var createScope = exports.createScope = function(resolvable, origin) {
  var wrapper;

  if (!origin) {
    origin = resolvable;
  }

  if (resolvable instanceof createStore.prototype) {
    wrapper = createStore(resolvable.definition);
  }
  else if (resolvable instanceof createDataset.prototype) {
    wrapper = createDataset(resolvable.definition);
  }
  else {
    wrapper = createDataset(resolvable);
  }

  _.each(origin._scopes || {}, function(entry, key) {
    wrapper._scopes[key] = entry;
    wrapper[key] = createScope.call(wrapper, entry, origin[key]);
  });

  wrapper.parent = this;
  return wrapper;
};

var defineAction = exports.defineAction = require('./defineAction');

var defineActions = exports.defineActions = function(actions) {
  if (!_.isPlainObject(actions)) {
    throw new TypeError(
      "defineActions: Expected simple object but found  `" + typeof(actions) + "`."
    );
  }

  var result = {};
  _.each(actions, function(val, key) {
    result[key] = defineAction(val);
  });

  return result;
};

exports.actions = defineActions({
  invalidate: function() {
    return {__resolve: "invalidate"};
  },
  get: function() {
    return {__resolve: "get"};
  },
  create: function() {
    return {__resolve: "create"};
  },
  post: function() {
    return {__resolve: "create"};
  },
  update: function() {
    return {__resolve: "update"};
  },
  put: function() {
    return {__resolve: "update"};
  },
  delete: function() {
    return {__resolve: "delete"};
  }
});

exports.resetStores = function() {
  _.each(StoreSet, function(store) {
    store.reset();
  });
};
