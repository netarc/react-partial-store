var chai = require('chai')
  , RPS = require('../lib/index')
  , StoreSet = require("../lib/StoreSet")
  , assert = chai.assert;


function resetStoreSet() {
  for (var key in StoreSet) {
    delete StoreSet[key];
  }
}

describe("createStore", function() {
  describe("when invoked", function() {
    beforeEach(resetStoreSet);

    describe("with no arguments", function() {
      it("should create an anonymous store", function() {
        assert.sameMembers(Object.keys(StoreSet), []);
        var store = RPS.createStore();
        assert(store instanceof RPS.createStore.prototype, "store was not instance of Store");
        assert.sameMembers(Object.keys(StoreSet), [store.definition.type]);
      });
    });

    describe("with an invalid argument", function() {
      it("should throw an error", function() {
        assert.throws(function(){
          RPS.createStore(123);
        });
      });
    });

    describe("with a string argument", function() {
      it("should create a named store", function() {
        assert.sameMembers(Object.keys(StoreSet), []);
        var store = RPS.createStore("foobar");
        assert(store instanceof RPS.createStore.prototype, "store was not instance of Store");
        assert.sameMembers(Object.keys(StoreSet), ["foobar"]);
      });

      it("should throw an error a named store already exists", function() {
        assert.sameMembers(Object.keys(StoreSet), []);
        var store_1 = RPS.createStore("foobar");
        assert(store_1 instanceof RPS.createStore.prototype, "store was not instance of Store");
        assert.sameMembers(Object.keys(StoreSet), ["foobar"]);

        assert.throws(function(){
          RPS.createStore("foobar");
        }, TypeError, "found existing Store of");
      });
    });

    describe("with a string and dataset definition argument", function() {
      it("should properly create the store and return a dataset", function() {
        assert.sameMembers(Object.keys(StoreSet), []);
        var result = RPS.createStore("foobar", {uri: "/projects"});
        assert(result instanceof RPS.createDataset.prototype, "result was not instance of Dataset");
        assert.sameMembers(Object.keys(StoreSet), ["foobar"]);
        assert.deepEqual(result.definition, {uri: "/projects"});
      });
    });

    describe("with a definition argument", function() {
      it("should properly create a named store", function() {
        assert.sameMembers(Object.keys(StoreSet), []);
        var result = RPS.createStore({type: "foobar"}, {uri: "/projects"});
        assert(result instanceof RPS.createDataset.prototype, "result was not instance of Dataset");
        assert.sameMembers(Object.keys(StoreSet), ["foobar"]);
        assert.deepEqual(result.definition, {uri: "/projects"});
      });

      it("should throw an error with an invalid option", function() {
        assert.throws(function(){
          RPS.createStore({type: "foobar", barfoo: 123});
        });
      });

      it("should throw an error on invalid option values", function() {
        assert.throws(function(){
          RPS.createStore({type: 123});
        });

        assert.throws(function(){
          RPS.createStore({initialParams: 123});
        });

        assert.throws(function(){
          RPS.createStore({uri: 123});
        });

        assert.throws(function(){
          RPS.createStore({actions: []});
        });

        assert.throws(function(){
          RPS.createStore({onlyActions: []});
        });
      });
    });
  });
});
