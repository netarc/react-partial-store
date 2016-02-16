var _ = require('./utils')
  , RPS = require('./index');


function addDataset(resolvable, origin) {
  var wrapper
    , chain = [];

  if (!origin) {
    origin = resolvable;
  }

  while (resolvable) {
    if (resolvable instanceof RPS.createStore.prototype) {
      chain.push(resolvable);
    }
    else if (resolvable instanceof RPS.createDataset.prototype) {
      chain.push(RPS.createDataset(resolvable.definition));
    }
    else {
      chain.push(resolvable);
    }
    resolvable = resolvable.parent;
  }

  wrapper = RPS.createDataset.apply(null, chain);

  _.each(origin._subsets || {}, function(entry, key) {
    wrapper._subsets[key] = entry;
    wrapper[key] = addDataset.call(wrapper, entry, origin[key]);
  });

  wrapper.parent = this;
  return wrapper;
}

module.exports = {
  initialize: function() {
    this._subsets = {};
  },

  addDataset: function(key, scope) {
    this._subsets[key] = scope;
    return (this[key] = addDataset.call(this, scope));
  },
};
