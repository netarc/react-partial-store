var RPS = require('../lib/index');


exports.deleteStores = function() {
  for (var key in RPS.stores) {
    delete RPS.stores[key];
  }
};
