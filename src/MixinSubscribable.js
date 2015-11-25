var _ = require('./utils');


module.exports = {
  initialize: function() {
    this.emitter = new _.EventEmitter();
  },

  subscribe: function(event, callback, context) {
    _.log("MixinSubscribable", "subscribe", event);
    var aborted = false
      , self = this
      , eventHandler = null;

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
    _.log("MixinSubscribable", "trigger", event);
    this.emitter.emit(event);
  }
};
