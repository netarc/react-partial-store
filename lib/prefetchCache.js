var _ = require('./utils')
  , RPS = require('./index');


function setEntries(data, options) {
  options = options || {};

  if (!_.isPlainObject(options)) {
    throw new TypeError(
      "setEntries: Expected config options object but found `" + typeof(options) + "`."
    );
  }

  RPS.responseHandler(data, options);
}

function setQueries(data) {
  if (!_.isPlainObject(data)) {
    throw new TypeError(
      "setQueries: Expected object of paths mapping to objects but found `" + typeof(data) + "`."
    );
  }

  _.each(data, function(uriConfig, uri) {
    if (!_.isPlainObject(uriConfig)) {
      throw new TypeError(
        "setQueries: Expected config options object for uri `" + uri + "` but found `" + typeof(uriConfig) + "`."
      );
    }

    RPS.responseHandler(uriConfig.data, _.extend({path: uri}, uriConfig));
  });
}

module.exports = {
  setEntries: setEntries,
  setQueries: setQueries
};
