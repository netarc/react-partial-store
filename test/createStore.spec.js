var chai = require('chai')
  , sinon = require('sinon')
  , RPS = require('../lib/index')
  , Constants = require('../lib/Constants')
  , StoreSet = require("../lib/StoreSet")
  , testHelper = require('./testHelper')
  , expect = chai.expect;


var dataSegmentId_1 = {
    id: 1,
    title: "Foo Project"
  }
  , dataSegmentId_2 = {
    id: 2,
    title: "Bar Project"
  };

describe("Store", function() {
  afterEach(testHelper.deleteStores);

  describe("creation with createStore", function() {
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

  describe("methods", function() {
    describe("reset", function() {
      it("should properly reset the fragment map by assigning a new instance", function() {
        var store = RPS.createStore("foobar")
          , fragmentMap = store.fragmentMap;

        store.updateResource({
          path: "/projects"
        }, [dataSegmentId_1, dataSegmentId_2], Constants.status.SUCCESS);
        store.reset();

        expect(store.fragmentMap).to.not.equal(fragmentMap);
        expect(store.fragmentMap.fragments).to.deep.equal({});
      });
    });

    describe("invalidate", function() {
      it("should properly mark data as stale", function() {
        var store = RPS.createStore("foobar");

        store.updateResource({
          path: "/projects"
        }, [dataSegmentId_1, dataSegmentId_2], Constants.status.SUCCESS);

        expect(store.fetchResource({id: 1}).status).to.not.equal(Constants.status.STALE);
        expect(store.fetchResource({id: 2}).status).to.not.equal(Constants.status.STALE);
        expect(store.fetchResource({id: 1}).timestamp).to.not.equal(Constants.timestamp.stale);
        expect(store.fetchResource({id: 2}).timestamp).to.not.equal(Constants.timestamp.stale);

        store.invalidate();

        expect(store.fetchResource({id: 1}).status).to.equal(Constants.status.STALE);
        expect(store.fetchResource({id: 2}).status).to.equal(Constants.status.STALE);
        expect(store.fetchResource({id: 1}).timestamp).to.equal(Constants.timestamp.stale);
        expect(store.fetchResource({id: 2}).timestamp).to.equal(Constants.timestamp.stale);
      });

      it("should not trigger when not specified to", function() {
        var store = RPS.createStore("foobar")
          , callback = sinon.spy()
          , dispose;

        store.updateResource({
          path: "/projects"
        }, [dataSegmentId_1, dataSegmentId_2], Constants.status.SUCCESS);

        dispose = store.subscribe("change", callback);
        store.invalidate();
        dispose();

        expect(callback.callCount).to.equal(0);
      });

      it("should trigger when specified to", function() {
        var store = RPS.createStore("foobar")
          , callback = sinon.spy()
          , dispose;

        store.updateResource({
          path: "/projects"
        }, [dataSegmentId_1, dataSegmentId_2], Constants.status.SUCCESS);

        dispose = store.subscribe("change", callback);
        store.invalidate({notify: true});
        dispose();

        expect(callback.callCount).to.equal(1);
      });
    });
  });
});
