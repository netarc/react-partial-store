var chai = require('chai')
  , createStore = require("../src/createStore")
  , StoreSet = require("../src/StoreSet")
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
        assert.sameMembers(Object.keys(StoreSet), []);
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

      it("should return the same named store if duplicated", function() {
        assert.sameMembers(Object.keys(StoreSet), []);
        var store_1 = createStore("foobar");
        assert(store_1 instanceof createStore.prototype, "store was not instance of Store");
        assert.sameMembers(Object.keys(StoreSet), ["foobar"]);

        var store_2 = createStore("foobar");
        assert.strictEqual(store_1, store_2);
        assert.sameMembers(Object.keys(StoreSet), ["foobar"]);
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
    });
  });
});
