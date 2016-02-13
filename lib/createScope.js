var _ = require('./utils')
  , RPS = require('./index');


function createScope(resolvable, origin) {
  var wrapper;

  if (!origin) {
    origin = resolvable;
  }

  if (resolvable instanceof RPS.createStore.prototype) {
    wrapper = RPS.createStore(resolvable.definition);
  }
  else if (resolvable instanceof RPS.createDataset.prototype) {
    wrapper = RPS.createDataset(resolvable.definition);
  }
  else {
    wrapper = RPS.createDataset(resolvable);
  }

  _.each(origin._scopes || {}, function(entry, key) {
    wrapper._scopes[key] = entry;
    wrapper[key] = createScope.call(wrapper, entry, origin[key]);
  });

  wrapper.parent = this;
  return wrapper;
}

module.exports = createScope;
