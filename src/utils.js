var objToString = Object.prototype.toString
  , isObject
  , isArray
  , extend
  , extendClass
  , extendFunction
  , each
  , deepCopy
  , keysFor;


exports.keysFor = keysFor = Object.keys || function(obj) {
  if (typeof(obj) !== "object") {
    return [];
  }

  var keys = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key);
    }
  }

  return keys;
};

var resolveChain = function(defOld, defNew) {
  return function() {
    defOld.apply(this, arguments);
    defNew.apply(this, arguments);
  };
};

var createAssigner = function(resolver, executeInit) {
  return function(obj) {
    var length = arguments.length;

    if (length < 2 || obj === null) {
      return obj;
    }

    for (var index = 1; index < length; index++) {
      var source = arguments[index],
          keys = keysFor(source),
          l = keys.length;

      for (var i = 0; i < l; i++) {
        var key = keys[i];

        if (executeInit && key === "initialize") {
          source[key].apply(obj);
        }
        else {
          if (resolver && key === "initialize" && obj[key] !== void 0) {
            obj[key] = resolver(obj[key], source[key]);
          }
          else {
            obj[key] = source[key];
          }
        }
      }
    }
    return obj;
  };
};

exports.EventEmitter = require('eventemitter3');

exports.isObject = isObject = function(obj) {
  var type = typeof obj;
  return type === 'function' || type === 'object' && !!obj;
};

exports.isFunction = function(value) {
  return typeof value === 'function';
};

exports.isArray = isArray = function(obj) {
  return isObject(obj) && objToString.call(obj) === "[object Array]";
};

exports.isPlainObject = function(obj) {
  return typeof(obj) === "object" && objToString.call(obj) === "[object Object]";
};

exports.extend = extend = createAssigner();
exports.extendClass = extendClass = createAssigner(resolveChain);
exports.extendFunction = extendFunction = createAssigner(resolveChain, true);

exports.each = each = function(obj, iteratee) {
  var i, length;
  if (isArray(obj)) {
    for (i = 0, length = obj.length; i < length; i++) {
      iteratee(obj[i], i, obj);
    }
  } else {
    var keys = keysFor(obj);
    for (i = 0, length = keys.length; i < length; i++) {
      iteratee(obj[keys[i]], keys[i], obj);
    }
  }
  return obj;
};

exports.any = function(obj, predicate) {
  var i, length;
  if (isArray(obj)) {
    for (i = 0, length = obj.length; i < length; i++) {
      if (predicate(obj[i], i, obj)) {
        return true;
      }
    }
  } else {
    var keys = keysFor(obj);
    for (i = 0, length = keys.length; i < length; i++) {
      if (predicate(obj[keys[i]], keys[i], obj)) {
        return true;
      }
    }
  }
  return false;
};

exports.map = function(obj, iteratee) {
  var keys = !isArray(obj) && keysFor(obj)
    , length = (keys || obj).length
    , results = Array(length);
  for (var index = 0; index < length; index++) {
    var currentKey = keys ? keys[index] : index;
    results[index] = iteratee(obj[currentKey], currentKey, obj);
  }
  return results;
};

exports.deepCopy = deepCopy = function(obj) {
  var out
    , i
    , length;

  if (objToString.call(obj) === '[object Array]') {
    length = obj.length;
    out = [];
    for (i = 0; i < length; i++) {
      out[i] = deepCopy(obj[i]);
    }
    return out;
  }
  else if (typeof obj === 'object') {
    var keys = keysFor(obj);
    length = keys.length;
    out = {};
    for (i = 0; i < length; i++) {
      out[i] = deepCopy(obj[i]);
    }
    return out;
  }
  return obj;
};

exports.capitalize = function(string){
  return string.charAt(0).toUpperCase()+string.slice(1);
};

exports.nextTick = function(callback) {
  setTimeout(callback, 0);
};

exports.defineClass = function() {
  var Class = function() {
    if (this.initialize) {
      this.initialize.apply(this, arguments);
    }
  };

  each([].slice.call(arguments), function(definition) {
    extendClass(Class.prototype, definition);
  });

  return Class;
};

// TODO: Temporary
exports.log = function(zone, method, msg) {
  if (msg) {
    console.log('%c%s%c::%c%s%c - %s',
                'font-weight: bold;', zone,
                'font-weight:normal;',
                'font-weight:bold;', method,
                'font-weight:normal;', msg.toString());
  }
  else {
    console.log('%c%s%c::%c%s',
                'font-weight: bold;', zone,
                'font-weight:normal;',
                'font-weight:bold;', method);
  }
};
