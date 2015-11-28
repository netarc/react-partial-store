var _ = require("./utils")
  , MixinResolvable = require("./MixinResolvable");


/**
 * An Action just wraps a method, any arguments passed when calling an action
 * are just appending into the results.
 */
var defineAction = function() {
  var args = [].slice.call(arguments)
    , definition = args.pop()
    , callback = args.pop();

  if (_.isFunction(definition)) {
    var tmp = callback;
    callback = definition;
    definition = tmp;
  }

  if (callback && !_.isFunction(callback)) {
    throw new TypeError(
      "defineAction: You're attempting to pass multiple callbacks when only a single callback and/or " +
      "options is acceptable"
    );
  }

  if (definition && !_.isPlainObject(definition)) {
    throw new TypeError(
      "defineAction: Only accepts a callback method and/or options but found type `" + typeof(definition) + "`"
    );
  }

  var action = function() {
    var stack = [].concat(action.getResolvable(), [].slice.call(arguments));

    if (action.parent) {
      return action.parent.resolve(stack);
    }
    else {
      return action.__resolveInvoker ? action.__resolveInvoker(stack) : stack;
    }
  };

  _.extendFunction(action, MixinResolvable);

  action.getResolvable = function() {
    var result = [].concat(callback && callback() || []);

    if (definition) {
      result.unshift({
        __definition: definition,
        __type: "action"
      });
    }

    return result;
  };

  /**
   * Hook the action method and chain another creating a new Action and
   * concatenating the results [Chain 1, Chain 2, ...]. Hooked actions
   * do not receive arguments that are sent to the intiial Action in the chain.
   *
   * The hook action can actually be a definition object instead which is just
   * concatenated into the stack chain.
   */
  action.hook = function() {
    var hook = defineAction.apply(null, arguments);
    hook.parent = action;
    return hook;
  };

  /**
   * Wrap will execute our new inner (local outer) Action and pass its result
   * chain to our new outer Action.
   */
  action.wrap = function(outerCallback, context) {
    var wrapped = defineAction(function() {
      var context = context || this
        , result = action.resolve()
        , stack = [].concat(result, [].slice.call(arguments));

      return outerCallback(stack);
    });

    wrapped.resolve = function(stack) {
      stack = [].concat(wrapped.getResolvable.call(context || this), stack || []);
      return wrapped.parent ? wrapped.parent.resolve(stack) : stack;
    };

    return wrapped;
  };

  return action;
};

module.exports = defineAction;
