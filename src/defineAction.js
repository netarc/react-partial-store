var _ = require("./utils")
  , MixinResolvable = require("./MixinResolvable");

/**
 * An Action just wraps a method, any arguments passed when calling an action
 * are just appending into the results.
 */
var defineAction = function(outerCallback, outerContext) {
  var action = function() {
    var stack = [].concat(action.getResolvable(), [].slice.call(arguments));

    if (action.parent)
      return action.parent.resolve(stack)
    else
      return action.__resolveInvoker ? action.__resolveInvoker(stack) : stack;
  }

  _.extendFunction(action, MixinResolvable);

  action.getResolvable = function() {
    return outerCallback.call(outerContext || this);
  }

  /**
   * Hook the action method and chain another creating a new Action and
   * concatenating the results [Chain 1, Chain 2, ...]. Hooked actions
   * do not receive arguments that are sent to the intiial Action in the chain.
   *
   * The hook action can actually be a definition object instead which is just
   * concatenated into the stack chain.
   */
  action.hook = function(inner, innerContext) {
    var hook = defineAction(inner, innerContext);
    hook.parent = action;
    return hook
  }

  /**
   * Wrap will execute our new inner (local outer) Action and pass its result
   * chain to our new outer Action.
   */
  action.wrap = function(innerCallback, innerContext) {
    var wrapped = defineAction(function() {
      var context = innerContext || this
        , result = outerCallback.apply(context)
        , stack = [].concat(result, [].slice.call(arguments));

      return innerCallback.call(context, stack);
    }, innerContext);

    wrapped.resolve = function(stack) {
      stack = [].concat(wrapped.getResolvable.call(innerContext || this), stack || []);
      return wrapped.parent ? wrapped.parent.resolve(stack) : stack;
    }

    return wrapped;
  }

  return action;
}

module.exports = defineAction;
