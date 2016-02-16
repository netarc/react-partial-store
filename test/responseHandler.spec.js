var chai = require('chai')
  , RPS = require('../lib/index')
  , Constants = require('../lib/Constants')
  , testHelper = require('./testHelper')
  , expect = chai.expect
  , DefaultPartial = Constants.defaultFragment;


function assertStoreFragmentData(store, fragment, key, data, partial, status) {
  expect(store.fragmentMap).to.be.a('object')
    .with.property('fragments')
      .to.be.a('object')
      .to.have.all.keys(fragment)
    .with.property(fragment)
      .to.be.a('object')
      .to.have.all.keys([key]);

  var fragmentData = store.fragmentMap.fragments[fragment][key];
  expect(fragmentData).to.have.property('status')
    .that.is.a('string')
    .that.equals(status);

  expect(fragmentData).to.have.property('timestamp')
    .that.is.an('number');

  if (data) {
    expect(fragmentData).to.have.property('data')
      .that.deep.equals(data);
  }

  if (partial) {
    expect(fragmentData).to.have.property('partial')
      .that.equals(partial);
  }
}

function assertStoreQueryData(store, path, keys, status) {
  expect(store.fragmentMap).to.be.a('object')
    .with.property('queries')
    .to.be.a('object')
    .with.property(path)
    .to.be.a('object');

  var queryData = store.fragmentMap.queries[path];
  expect(queryData).to.have.property('status')
    .that.is.a('string')
    .that.equals(status);

  expect(queryData).to.have.property('timestamp')
    .that.is.an('number');

  expect(queryData).to.have.property('data')
    .that.deep.equals(keys);
}

describe("responseHandler", function() {
  afterEach(testHelper.deleteStores);

  describe("containerless_nested", function() {
    before(function() {
      RPS.responseHandler.defaultHandler = RPS.responseHandler.handlers.containerless_nested;
    });

    describe("when passed invalid data", function() {
      it("should throw an error with no args", function() {
        var case1 = function() {
            RPS.responseHandler();
          };

        expect(case1).to.throw(Error, "containerless_nested:parseObject: expected object type but found");
      });

      it("should throw an error with non array/object", function() {
        var case1 = function() {
            RPS.responseHandler("foobar");
          }
          , case2 = function() {
            RPS.responseHandler(123);
          }
          , case3 = function() {
            RPS.responseHandler(true);
          };

        expect(case1).to.throw(Error, "containerless_nested:parseObject: expected object type but found");
        expect(case2).to.throw(Error, "containerless_nested:parseObject: expected object type but found");
        expect(case3).to.throw(Error, "containerless_nested:parseObject: expected object type but found");
      });

      it("should throw an error with invalid array data", function() {
        var case1 = function() {
            RPS.responseHandler([1]);
          }
          , case2 = function() {
            RPS.responseHandler(["foo"]);
          };

        expect(case1).to.throw(TypeError, "containerless_nested:parseObject: expected object type but found");
        expect(case2).to.throw(TypeError, "containerless_nested:parseObject: expected object type but found");
      });

      it("should throw an error with empty data", function() {
        var case1 = function() {
            RPS.responseHandler([]);
          }
          , case2 = function() {
            RPS.responseHandler([{}]);
          }
          , case3 = function() {
            RPS.responseHandler({});
          };

        expect(case1).to.throw(TypeError, "responseHandler: Failed to resolve data type");
        expect(case2).to.throw(TypeError, "responseHandler: Failed to resolve data type");
        expect(case3).to.throw(TypeError, "responseHandler: Failed to resolve data type");
      });

      it("should throw an error with empty data and a descriptor type", function() {
        var case1 = function() {
            RPS.responseHandler([], {type: "project"});
          }
          , case2 = function() {
            RPS.responseHandler([{}], {type: "project"});
          }
          , case3 = function() {
            RPS.responseHandler({}, {type: "project"});
          };

        expect(case1).to.throw(TypeError, "responseHandler: Failed to resolve store for data type");
        expect(case2).to.throw(TypeError, "responseHandler: Failed to resolve store for data type");
        expect(case3).to.throw(TypeError, "responseHandler: Failed to resolve store for data type");
      });
    });

    describe("when passed valid data", function() {
      describe("with no descriptor", function() {
        var projectStore
          , userStore;

        beforeEach(function() {
          userStore = RPS.createStore("user");
          projectStore = RPS.createStore("project");
        });

        it("should properly add object to Store", function() {
          RPS.responseHandler({_type: "project", id: 1, title: "foo project"});

          expect(userStore.fragmentMap.queries)
            .to.deep.equal({});
          expect(userStore.fragmentMap.fragments)
            .to.deep.equal({});

          expect(projectStore.fragmentMap.queries)
            .to.deep.equal({});
          assertStoreFragmentData(projectStore,
                                  DefaultPartial,
                                  '1',
                                  {id: 1, title: "foo project"},
                                  null,
                                  Constants.status.SUCCESS);
        });

        it("should not properly add collection to Store", function() {
          RPS.responseHandler([{_type: "project", id: 1, title: "foo project"}]);

          expect(userStore.fragmentMap.queries)
            .to.deep.equal({});
          expect(userStore.fragmentMap.fragments)
            .to.deep.equal({});

          expect(projectStore.fragmentMap.queries)
            .to.deep.equal({});
          assertStoreFragmentData(projectStore,
                                  DefaultPartial,
                                  '1',
                                  {id: 1, title: "foo project"},
                                  null,
                                  Constants.status.SUCCESS);
        });
      });

      describe("with a basic descriptor", function() {
        var projectStore
          , userStore;

        beforeEach(function() {
          userStore = RPS.createStore("user");
          projectStore = RPS.createStore("project");
        });

        it("should properly add object to Store", function() {
          RPS.responseHandler({_type: "project", id: 1, title: "foo project"},
                          {path: "/projects/1"});

          expect(userStore.fragmentMap.queries)
            .to.deep.equal({});
          expect(userStore.fragmentMap.fragments)
            .to.deep.equal({});

          assertStoreQueryData(projectStore, "/projects/1", 1, Constants.status.SUCCESS);
          assertStoreFragmentData(projectStore,
                                  DefaultPartial,
                                  '1',
                                  {id: 1, title: "foo project"},
                                  null,
                                  Constants.status.SUCCESS);
        });

        it("should not properly add collection to Store", function() {
          RPS.responseHandler([{_type: "project", id: 1, title: "foo project"}],
                          {path: "/projects"});

          expect(userStore.fragmentMap.queries)
            .to.deep.equal({});
          expect(userStore.fragmentMap.fragments)
            .to.deep.equal({});

          assertStoreQueryData(projectStore, "/projects", [1], Constants.status.SUCCESS);
          assertStoreFragmentData(projectStore,
                                  DefaultPartial,
                                  '1',
                                  {id: 1, title: "foo project"},
                                  null,
                                  Constants.status.SUCCESS);
        });
      });
    });
  });
});
