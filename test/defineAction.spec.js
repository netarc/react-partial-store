var chai = require('chai')
  , sinon = require('sinon')
  , RPS = require('../lib/index')
  , assert = chai.assert;


describe("defineAction", function() {
  describe("when passed invalid arguments", function() {
    it("should properly throw an error", function() {
      assert.throws(function(){
        RPS.defineAction(123);
      }, TypeError, "Only accepts a callback method and/or options but found type");

      assert.throws(function(){
        RPS.defineAction(123, "foobar");
      }, TypeError, "attempting to pass multiple callbacks");
    });
  });

  describe("when invoked", function() {
    it("should invoke the wrapped method", function() {
      var callback = sinon.spy()
        , action = RPS.defineAction(callback);

      assert.equal(callback.callCount, 0);
      action();
      assert.equal(callback.callCount, 1);
    });

    it("should return the result of the wrapped method", function() {
      var action = RPS.defineAction(function() {
          return "foobar";
        });

      assert.deepEqual(action(), ["foobar"]);
    });

    it("should return any arguments passed in result of the wrapped method", function() {
      var action = RPS.defineAction(function() {
          return "foobar";
        });

      assert.deepEqual(action(123), ["foobar", 123]);
      assert.deepEqual(action(123, 321), ["foobar", 123, 321]);
    });
  });

  describe("implements MixinResolvable", function() {
    it("should look like it", function() {
      var action = RPS.defineAction(function() {});

      assert.typeOf(action.getResolvable, "function");
      assert.typeOf(action.resolve, "function");
    });

    it("should resolve the wrapped method", function() {
      var action = RPS.defineAction(function() {
        return "foobar";
      });

      assert.deepEqual(action.resolve(), ["foobar"]);
    });
  });

  describe("can be hooked", function() {
    it("should correctly hook results", function() {
      var action1 = RPS.defineAction(function() {
            return "foobar";
          })
        , action2 = action1.hook(function() {
            return 123;
          });

      assert.deepEqual(action2(321), ["foobar", 123, 321]);
      assert.deepEqual(action2.resolve(), ["foobar", 123]);
    });
  });

  describe("can be wrapped", function() {
    it("should correctly wrap results", function() {
      var callback = sinon.spy(function(stack) {
            assert.deepEqual(stack, ["foobar"]);
            return "barfoo";
          })
        , action1 = RPS.defineAction(function() {
            return "foobar";
          })
        , action2 = action1.wrap(callback);

      assert.deepEqual(action2(321), ["barfoo", 321]);
      assert.deepEqual(action2.resolve(), ["barfoo"]);
    });
  });
});
