exports.createClass = require('./createClass');
exports.createStore = require('./createStore');
exports.createDataset = require('./createDataset');
exports.prefetchCache = require('./prefetchCache');

var _ = require('./utils');

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
  })

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
})
