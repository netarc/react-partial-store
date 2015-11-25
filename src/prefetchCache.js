var _ = require("./utils")
  , cache = {}
  , cacheEntries = (cache.entries = {})
  , cacheQueries = (cache.queries = {});


function appendEntry(entry, defaultType) {
  if (!_.isPlainObject(entry)) {
    throw new TypeError(
      "setEntries: Found object in entries array that is not a simple object but was  `" + typeof(entry) + "`."
    );
  }

  var entryType = entry._type || defaultType;
  if (!entryType) {
    throw new TypeError(
      "setEntries: Could not resolve entry type you must pass a `type` into `setEntries` or the entry itself " +
      "must have a `_type` property while adding entry: " + JSON.stringify(entry)
    );
  }

  if (entry.id) {
    throw new TypeError(
      "setEntries: Could not resolve entry without an `id` property while adding entry: " + JSON.stringify(entry)
    );
  }

  cacheEntries[entryType][entry.id] = entry;
  return {
    id: entry.id,
    type: entryType
  };
}

function setEntries(type, data, noCrossType) {
  var ids = []
    , type = null
    , data = null
    , allowCrossType = true
    , args = [].slice.call(arguments);

  while (args.length > 0) {
    var arg = args.shift();

    if (_.isArray(arg) || _.isPlainObject(arg)) {
      data = arg;
    }
    else if (typeof(arg) === "string") {
      type = arg;
    }
    else if (typeof(arg) === "boolean") {
      allowCrossType = arg;
    }
    else {
      throw new TypeError(
        "setEntries: Found unknown argument type `" + typeof(arg) + "`."
      );
    }
  }

  if (!(_.isArray(data) || _.isPlainObject(data))) {
    throw new TypeError(
      "setEntries: Expected object or array of objects to append to cache but found  `" + typeof(data) + "`."
    );
  }

  if (_.isArray(data)) {
    var lastType = null;

    _.each(data, function(entry, i) {
      var result = appendEntry(entry, type);

      if (!allowCrossType) {
        if (lastType && lastType !== result.type) {
          throw new TypeError(
            "setEntries: Found conflicting colleciton type definitons, first was `" + lastType +
            "` but found `" + result.type + "`."
          );
        }
        else {
          lastType = result.type;
        }
      }

      ids.push(result.id);
    });
  }
  else {
    var result = appendEntry(data, type)
    ids.push(result.id);
  }

  return ids;
}

function setQueries(data) {
  if (!_.isPlainObject(data)) {
    throw new TypeError(
      "setQueries: Expected object of paths mapping to objects but found `" + typeof(data) + "`."
    );
  }

  _.each(data, function(uri, uriData) {
    cacheQueries[uri] = setEntries(uriData, false);
  });
}

module.exports = {
  setEntries: setEntries,
  setQueries: setQueries,
  raw: cache
};
