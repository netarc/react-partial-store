var _ = require('./utils');


module.exports = {
  initialize: function() {
    this.emitter = new _.EventEmitter();
  },

  subscribe: function(event, callback, context) {
    var aborted = false
      , self = this
      , eventHandler = null;

    if (typeof(event) !== "string") {
      throw new TypeError("MixinSubscribable:subscribe expected string event but found type `" + event + "`");
    }

    if (typeof(callback) !== "function") {
      throw new TypeError("MixinSubscribable:subscribe expected callback but found `" + event + "`");
    }

    context = context || this;
    eventHandler = function(args) {
      if (aborted) {
        return;
      }
      callback.apply(context, args);
    };

    this.emitter.addListener(event, eventHandler);

    return function() {
      aborted = true;
      self.emitter.removeListener(event, eventHandler);
    };
  },

  trigger: function(event) {
    if (typeof(event) !== "string") {
      throw new TypeError("MixinSubscribable:trigger expected string event but found type `" + event + "`");
    }

    this.emitter.emit(event);
  }
};
