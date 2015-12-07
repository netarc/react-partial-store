var _ = require('./utils');


var unfoldStack = function(stack) {
  var results = [];

  for (var i = 0; i < stack.length; i++) {
    var element = stack[i]
      , definition;

    // Intentionally drop invalid elements
    if (!element) {
      continue;
    }

    if (// Case 1 - Our element looks like a MixinResolvable
        element.resolve &&
        element.getResolvable &&
        (definition = element.resolve()) ||
        // Case 2 - Our element contains a definition that looks like a MixinResolvable
        (definition = element.__definition) &&
        definition.resolve &&
        definition.getResolvable &&
        (definition = definition.resolve()) ||
        // Case 3 - Our element contains a definition that is an array
        _.isArray(definition)) {
      results = results.concat(unfoldStack(definition));
    }
    else {
      results.push(element);
    }
  }

  return results;
};

module.exports = {
  getResolvable: function() {
    return null;
  },

  /**
   * Including ourself, grab all definitions as we walk up to our top parent
   * and invoke a given method with all our definitions.
   */
  resolve: function(stack) {
    stack = [].concat(this.getResolvable.call(this), stack || []);

    var parent = this.parent;
    if (parent) {
      return parent.resolve(stack);
    }
    else {
      stack = unfoldStack(stack);
      return this.__resolveInvoker ? this.__resolveInvoker(stack) : stack;
    }
  }
};
