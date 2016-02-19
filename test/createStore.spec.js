var chai = require('chai')
  , RPS = require('../lib/index')
  , StoreSet = require("../lib/StoreSet")
  , testHelper = require('./testHelper')
  , expect = chai.expect;


describe("createStore", function() {
  describe("when invoked", function() {
    afterEach(testHelper.deleteStores);

    describe("with no arguments", function() {
      it("should create an anonymous store", function() {
        var result = RPS.createStore();
        expect(result).to.be.an.instanceof(RPS.createStore.prototype);
        expect(Object.keys(StoreSet)).to.have.members([result.definition.type]);
      });
    });

    describe("with an invalid argument", function() {
      it("should throw an error", function() {
        expect(function() {
          RPS.createStore(123);
        }).to.throw(Error);
      });
    });

    describe("with a string argument", function() {
      it("should create a named store", function() {
        var result = RPS.createStore("foobar");
        expect(result).to.be.an.instanceof(RPS.createStore.prototype);
        expect(Object.keys(StoreSet)).to.have.members(["foobar"]);
      });

      it("should throw an error a named store already exists", function() {
        var result = RPS.createStore("foobar");
        expect(result).to.be.an.instanceof(RPS.createStore.prototype);
        expect(Object.keys(StoreSet)).to.have.members(["foobar"]);

        expect(function() {
          RPS.createStore("foobar");
        }, TypeError, "found existing Store of");
      });
    });

    describe("with a string and dataset definition argument", function() {
      it("should properly create the store and return a dataset", function() {
        var result = RPS.createStore("foobar", {uri: "/projects"});
        expect(result).to.be.an.instanceof(RPS.createDataset.prototype);
        expect(Object.keys(StoreSet)).to.have.members(["foobar"]);
        expect(result.definition).to.deep.equal({uri: "/projects"});
      });
    });

    describe("with a definition argument", function() {
      it("should properly create a named store", function() {
        var result = RPS.createStore({type: "foobar"}, {uri: "/projects"});
        expect(result).to.be.an.instanceof(RPS.createDataset.prototype);
        expect(Object.keys(StoreSet)).to.have.members(["foobar"]);
        expect(result.definition).to.deep.equal({uri: "/projects"});
      });

      it("should throw an error with an invalid option", function() {
        expect(function() {
          RPS.createStore({type: "foobar", barfoo: 123});
        }).to.throw(Error);
      });

      it("should throw an error on invalid option values", function() {
        expect(function() {
          RPS.createStore({type: 123});
        }).to.throw(Error);

        expect(function() {
          RPS.createStore({initialParams: 123});
        }).to.throw(Error);

        expect(function() {
          RPS.createStore({uri: 123});
        }).to.throw(Error);

        expect(function() {
          RPS.createStore({actions: []});
        }).to.throw(Error);
      });

      it("should not throw an error on valid option values", function() {
        expect(function() {
          RPS.createStore({onlyActions: []});
        }).to.not.throw(Error);
      });
    });
  });
});
