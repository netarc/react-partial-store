var _ = require('./utils');


var unfoldStack = function(stack) {
  for (var i = 0; i < stack.length; i++) {
    var definition = stack[i].__definition;
    if (!definition)
      continue;

    if (_.isArray(definition)) {
      stack.splice(i, 1);

      for (var l = 0; l < definition.length; l++) {
        var innerDefinition = definition[l];
        if (innerDefinition.resolve && innerDefinition.getResolvable) {
          var substack = unfoldStack(innerDefinition.resolve());
          [].splice.apply(stack, [].concat(i, 0, substack));
          i+= substack.length;
        }
        else {
          stack.splice(i, 0, innerDefinition);
          i++;
        }
      }
      i--;
    }
    else if (definition.resolve && definition.getResolvable) {
      var substack = unfoldStack(definition.resolve());
      [].splice.apply(stack, [].concat(i, 1, substack));
    }
  }
  return stack;
}

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
