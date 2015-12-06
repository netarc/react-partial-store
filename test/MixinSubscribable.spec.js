var chai = require('chai')
  , sinon = require('sinon')
  , _ = require('../src/utils')
  , MixinSubscribable = require("../src/MixinSubscribable")
  , assert = chai.assert;

var SubscribableClass = _.defineClass(MixinSubscribable);

describe("MixinSubscribable", function() {
  describe("when instantiated", function() {
    it("should have an emitter", function() {
      var subscribable = new SubscribableClass();
      assert(subscribable.emitter instanceof _.EventEmitter, "Subscribable did not have an emitter");
    });

    it("should look like MixinSubscribable", function() {
      var subscribable = new SubscribableClass();

      assert.typeOf(subscribable.subscribe, "function");
      assert.typeOf(subscribable.trigger, "function");
    });
  });

  describe("the subscribe method", function() {
    describe("when passed invalid arguments", function() {
      it("should properly throw an error", function() {
        var subscribable = new SubscribableClass();

        assert.throws(function(){
          subscribable.subscribe();
        }, TypeError, "expected string event");

        assert.throws(function(){
          subscribable.subscribe("foobar");
        }, TypeError, "expected callback but found");
      });
    });

    describe("when passed valid arguments", function() {
      it("should subscribe and return a dispose method", function() {
        var subscribable = new SubscribableClass();
        assert.equal(subscribable.emitter.listeners("foobar").length, 0);

        var disposer = subscribable.subscribe("foobar", function() {});
        assert.typeOf(disposer, "function");
        assert.equal(subscribable.emitter.listeners("foobar").length, 1);

        disposer();
        assert.equal(subscribable.emitter.listeners("foobar").length, 0);
      });
    });
  });

  describe("the trigger method", function() {
    describe("when passed invalid arguments", function() {
      it("should properly throw an error", function() {
        var subscribable = new SubscribableClass();

        assert.throws(function(){
          subscribable.trigger();
        }, TypeError, "expected string event but found");

        assert.throws(function(){
          subscribable.trigger(123);
        }, TypeError, "expected string event but found");
      });
    });

    describe("when passed valid arguments", function() {
      it("should trigger a subscribed event", function() {
        var subscribable = new SubscribableClass()
          , callback1 = sinon.spy()
          , callback2 = sinon.spy();

        subscribable.subscribe("foobar", callback1);
        subscribable.subscribe("barfoo", callback2);
        assert.equal(callback1.callCount, 0);
        assert.equal(callback2.callCount, 0);

        subscribable.trigger("foobar");
        assert.equal(callback1.callCount, 1);
        assert.equal(callback2.callCount, 0);
      });

      it("should not trigger a disposed event", function() {
        var subscribable = new SubscribableClass()
          , callback1 = sinon.spy()
          , callback2 = sinon.spy();

        var disposer = subscribable.subscribe("foobar", callback1);
        subscribable.subscribe("barfoo", callback2);
        assert.equal(callback1.callCount, 0);
        assert.equal(callback2.callCount, 0);

        disposer();
        assert.equal(callback1.callCount, 0);
        assert.equal(callback2.callCount, 0);
      });
    });
  });
});
