var chai = require('chai')
  , createStore = require("../lib/createStore")
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
        var store = createStore();
        assert(store instanceof createStore.prototype, "store was not instance of Store");
        assert.sameMembers(Object.keys(StoreSet), [store.definition.type]);
      });
    });

    describe("with an invalid argument", function() {
      it("should throw an error", function() {
        assert.throws(function(){
          createStore(123);
        });
      });
    });

    describe("with a string argument", function() {
      it("should create a named store", function() {
        assert.sameMembers(Object.keys(StoreSet), []);
        var store = createStore("foobar");
        assert(store instanceof createStore.prototype, "store was not instance of Store");
        assert.sameMembers(Object.keys(StoreSet), ["foobar"]);
      });

      it("should throw an error a named store already exists", function() {
        assert.sameMembers(Object.keys(StoreSet), []);
        var store_1 = createStore("foobar");
        assert(store_1 instanceof createStore.prototype, "store was not instance of Store");
        assert.sameMembers(Object.keys(StoreSet), ["foobar"]);

        assert.throws(function(){
          createStore("foobar");
        }, TypeError, "found existing Store of");
      });
    });

    describe("with a string and definition argument", function() {
      it("should properly create the store", function() {
        assert.sameMembers(Object.keys(StoreSet), []);
        var store = createStore("foobar", {uri: "/projects"});
        assert(store instanceof createStore.prototype, "store was not instance of Store");
        assert.sameMembers(Object.keys(StoreSet), ["foobar"]);
        assert.deepEqual(store.definition, {type: "foobar", uri: "/projects"});
      });
    });

    describe("with a definition argument", function() {
      it("should properly create a named store", function() {
        assert.sameMembers(Object.keys(StoreSet), []);
        var store = createStore({type: "foobar", uri: "/projects"});
        assert(store instanceof createStore.prototype, "store was not instance of Store");
        assert.sameMembers(Object.keys(StoreSet), ["foobar"]);
        assert.deepEqual(store.definition, {type: "foobar", uri: "/projects"});
      });

      it("should throw an error with an invalid option", function() {
        assert.throws(function(){
          createStore({type: "foobar", barfoo: 123});
        });
      });

      it("should throw an error on invalid option values", function() {
        assert.throws(function(){
          createStore({type: 123});
        });

        assert.throws(function(){
          createStore({initialParams: 123});
        });

        assert.throws(function(){
          createStore({uri: 123});
        });

        assert.throws(function(){
          createStore({actions: []});
        });

        assert.throws(function(){
          createStore({onlyActions: []});
        });
      });
    });
  });
});
