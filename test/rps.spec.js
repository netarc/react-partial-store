var chai = require('chai')
  , RPS = require('../lib/index')
  , Constants = require('../lib/Constants')
  , StoreSet = require('../lib/StoreSet')
  , DefaultPartial = Constants.defaultFragment
  , expect = chai.expect;


function resetStoreSet() {
  for (var key in StoreSet) {
    delete StoreSet[key];
  }
}

var dataSegmentId_1 = {
    id: 1,
    title: "Foo Project"
  }
  , dataSegmentId_2 = {
    id: 2,
    title: "Bar Project"
  }
  , dataSegmentId_3 = {
    id: 3,
    title: "BarFoo Project"
  }
  , dataSegmentId_4 = {
    id: 4,
    title: "FooBar Project"
  };

describe("RPS", function() {
  beforeEach(resetStoreSet);

  describe("resetStores", function() {
    var store1
      , store2;

    beforeEach(function() {
      store1 = RPS.createStore();
      store1.updateResource({
        path: "/projects",
        partial: "foobar"
      }, [dataSegmentId_1, dataSegmentId_2], Constants.status.SUCCESS);

      store2 = RPS.createStore();
      store2.updateResource({
        path: "/projects"
      }, [dataSegmentId_3, dataSegmentId_4], Constants.status.SUCCESS);
    });

    it("will reset all registered stores", function() {
      expect(store1.fragmentMap.fragments)
        .to.have.property("foobar")
          .to.have.all.keys("1", "2");

      expect(store2.fragmentMap.fragments)
        .to.have.property(DefaultPartial)
          .to.have.all.keys("3", "4");

      RPS.resetStores();

      expect(store1.fragmentMap.fragments)
        .to.deep.equal({});

      expect(store2.fragmentMap.fragments)
        .to.deep.equal({});
    });
  });
});
