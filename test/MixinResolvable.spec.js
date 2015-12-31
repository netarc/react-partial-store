var chai = require('chai')
  , sinon = require('sinon')
  , _ = require('../lib/utils')
  , MixinResolvable = require("../lib/MixinResolvable")
  , assert = chai.assert;


var ResolvableZero = _.defineClass(MixinResolvable);

var ResolvableOne = _.defineClass(MixinResolvable, {
  getResolvable: function() {
    return "foobar";
  }
});

var ResolvableTwo = _.defineClass(MixinResolvable, {
  getResolvable: function() {
    return 123;
  }
});

var ResolvableThree = _.defineClass(MixinResolvable, {
  getResolvable: function() {
    return {
      __definition: new ResolvableOne()
    };
  }
});

var ResolvableFour = _.defineClass(MixinResolvable, {
  getResolvable: function() {
    return {
      __definition: [new ResolvableOne(), new ResolvableTwo()]
    };
  }
});

var ResolvableFive = _.defineClass(MixinResolvable, {
  getResolvable: function() {
    return {
      __definition: [new ResolvableFour(), new ResolvableFour()]
    };
  }
});

var ResolvableSix = _.defineClass(MixinResolvable, {
  getResolvable: function() {
    return {
      __definition: {
        type: "foobar"
      }
    };
  }
});

describe("MixinResolvable", function() {
  describe("when instantiated", function() {
    it("should look like MixinResolvable", function() {
      var caseZero = new ResolvableZero()
        , caseOne = new ResolvableOne();

      assert.typeOf(caseZero.getResolvable, "function");
      assert.typeOf(caseZero.resolve, "function");
      assert.typeOf(caseOne.getResolvable, "function");
      assert.typeOf(caseOne.resolve, "function");
    });
  });

  describe("the getResolvable method", function() {
    it("should return expected results", function() {
      var caseZero = new ResolvableZero()
        , caseOne = new ResolvableOne()
        , caseTwo = new ResolvableTwo();

      assert.strictEqual(caseZero.getResolvable(), null);
      assert.strictEqual(caseOne.getResolvable(), "foobar");
      assert.strictEqual(caseTwo.getResolvable(), 123);
    });
  });

  describe("the resolve method", function() {
    it("should append arguments into the results", function() {
      var caseZero = new ResolvableZero();

      assert.deepEqual(caseZero.resolve(123), [123]);
    });

    it("should invoke __resolveInvoker if present at end of resolve", function() {
      var caseZero = new ResolvableZero()
        , caseOne = new ResolvableOne()
        , caseTwo = new ResolvableTwo()
        , callback1 = sinon.spy(function(stack) {
            assert.deepEqual(stack, ["foobar", 123]);
          })
        , callback2 = sinon.spy();

      caseZero.__resolveInvoker = callback1;
      caseOne.parent = caseZero;
      caseTwo.parent = caseOne;
      caseTwo.__resolveInvoker = callback2;

      assert.equal(callback1.callCount, 0);
      assert.equal(callback2.callCount, 0);
      caseTwo.resolve();
      assert.equal(callback1.callCount, 1);
      assert.equal(callback2.callCount, 0);
    });

    describe("for non-parented resolvables", function() {
      it("should return expected results", function() {
        var caseZero = new ResolvableZero()
          , caseOne = new ResolvableOne()
          , caseTwo = new ResolvableTwo();

        assert.deepEqual(caseZero.resolve(), []);
        assert.deepEqual(caseOne.resolve(), ["foobar"]);
        assert.deepEqual(caseTwo.resolve(), [123]);
      });
    });

    describe("for parented resolvables", function() {
      it("should return expected results", function() {
        var caseZero = new ResolvableZero()
          , caseOne = new ResolvableOne()
          , caseTwo = new ResolvableTwo();

        caseOne.parent = caseZero;
        caseTwo.parent = caseOne;

        assert.deepEqual(caseZero.resolve(), []);
        assert.deepEqual(caseOne.resolve(), ["foobar"]);
        assert.deepEqual(caseTwo.resolve(), ["foobar", 123]);
      });

      it("should correctly unfold definition results", function() {
        var caseSix1 = new ResolvableSix()
          , caseSix2 = new ResolvableSix()
          , caseSix3 = new ResolvableSix();

        caseSix3.parent = caseSix2;
        caseSix2.parent = caseSix1;

        assert.deepEqual(caseSix3.resolve(), [
          {__definition: {type: "foobar"}},
          {__definition: {type: "foobar"}},
          {__definition: {type: "foobar"}}
        ]);
      });
    });

    describe("when resolving __definition objects", function() {
      it("should unfold an object", function() {
        var caseZero = new ResolvableZero()
          , caseThree = new ResolvableThree();

        caseThree.parent = caseZero;

        assert.deepEqual(caseThree.resolve(), ["foobar"]);
      });

      it("should unfold an array", function() {
        var caseZero = new ResolvableZero()
          , caseFour = new ResolvableFour()
          , caseFive = new ResolvableFive();

        caseFour.parent = caseZero;
        caseFive.parent = caseZero;

        assert.deepEqual(caseFour.resolve(), ["foobar", 123]);
        assert.deepEqual(caseFive.resolve(), ["foobar", 123, "foobar", 123]);
      });
    });
  });
});
