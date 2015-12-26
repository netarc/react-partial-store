var Promise = require("es6-promise").Promise
  , chai = require('chai')
  , sinon = require('sinon')
  , nock = require('nock')
  , RPS = require("../src/index")
  , Constants = require('../src/Constants')
  , StackInvoker = require("../src/StackInvoker")
  , Utils = require("../src/utils")
  , expect = chai.expect
  , DefaultPartial = Constants.defaultFragment
  , APIServer = "http://api.rps.com";


for (var i = 0, keys = Object.keys(StackInvoker.Resolvers); i < keys.length; i++) {
  var key = keys[i];
  StackInvoker.Resolvers[key] = sinon.spy(StackInvoker.Resolvers[key]);
}

function ResetResolvers() {
  for (var i = 0, keys = Object.keys(StackInvoker.Resolvers); i < keys.length; i++) {
    StackInvoker.Resolvers[keys[i]].reset();
  }
}

function assertFragmentData(obj, key, data, partial, status) {
  expect(obj).to.be.a('object')
    .with.property(key);

  var fragment = obj[key];
  expect(fragment).to.have.property('status')
    .that.is.a('string')
    .that.equals(status);

  expect(fragment).to.have.property('timestamp')
    .that.is.an('number');

  if (data) {
    expect(fragment).to.have.property('data')
      .that.deep.equals(data);
  }

  if (partial) {
    expect(fragment).to.have.property('partial')
      .that.equals(partial);
  }
}

var ProjectsStore = RPS.createStore({
  type: "projects"
});

var ProjectsDataset = ProjectsStore.createDataset({
  uri: "/projects"
});

var ProjectDataset = ProjectsDataset.createDataset({
  uri: "/:projectId",
  fragments: ["minimal"]
});

var dataSegmentId_1 = {
  id: 1,
  title: "Foo Project"
};

describe("StackInvoker", function() {
  var nockServer;

  before(function() {
    nock.disableNetConnect();
    nock.enableNetConnect(APIServer);
    nockServer = nock(APIServer);

    Utils.hostname = APIServer;
  });

  after(function() {
    Utils.hostname = "";
    nock.restore();
  });

  afterEach(function() {
    ResetResolvers();
    nock.cleanAll();
    ProjectsStore.fragmentMap.initialize();
  });

  describe("invoke method", function() {
    describe("accepts __resolve stack item", function() {
      describe("passed no __resolve", function() {
        it("should return a resource descriptor", function() {
          var pre_stack = [{__params: {projectId: 1}}]
            , stack = ProjectDataset.resolve(pre_stack)
            , result = StackInvoker.invoke(stack);

          expect(result).to.be.an('object')
            .to.have.all.keys([
              "actions",
              "event",
              "partial",
              "id",
              "params",
              "fragments",
              "path",
              "payload",
              "store",
              "type"
            ]);
        });
      });

      describe("passed an invalid __resolve", function() {
        it("should throw an error", function() {
          var pre_stack = [{__params: {projectId: 1}}, {__resolve: "foobar"}]
            , stack = ProjectDataset.resolve(pre_stack);

          expect(function() {
              StackInvoker.invoke(stack);
            })
            .to.throw(Error, "Invoker cannot resolve `foobar`");
        });
      });

      describe("passed a valid __resolve", function() {
        beforeEach(function() {
          nockServer
            .get('/projects/1')
            .reply(200, dataSegmentId_1);
        });

        it("should invoke the correct resolver", function() {
          var pre_stack = [{__params: {projectId: 1}}, {__resolve: "get"}]
            , stack = ProjectDataset.resolve(pre_stack)
            , result = StackInvoker.invoke(stack);

          expect(result).to.be.an.instanceof(Promise);
          expect(StackInvoker.Resolvers.get.callCount).to.equal(1);
        });
      });
    });

    describe("resolving get", function() {
      describe("resource not existing in store", function() {
        beforeEach(function() {
          nockServer
            .get('/projects/1')
            .reply(200, dataSegmentId_1);
        });

        it("touchResource", function() {
          var pre_stack = [{__params: {projectId: 1}}, {__resolve: "get"}]
            , stack = ProjectDataset.resolve(pre_stack)
            , result = StackInvoker.invoke(stack);

          expect(ProjectsStore.fragmentMap.fragments)
            .to.have.all.keys(DefaultPartial)
            .to.have.property(DefaultPartial)
            .to.have.all.keys('1');
          assertFragmentData(ProjectsStore.fragmentMap.fragments[DefaultPartial], 1, undefined, null, Constants.status.STALE);

          return result.then(function() {
            expect(ProjectsStore.fragmentMap.fragments)
              .to.have.all.keys(DefaultPartial)
              .to.have.property(DefaultPartial)
              .to.have.all.keys('1');
            assertFragmentData(ProjectsStore.fragmentMap.fragments[DefaultPartial], 1, dataSegmentId_1, null, Constants.status.SUCCESS);
          }, function() {
            // TODO: we are encountering this during 2nd stage (karma/phantomjs) testing due to potential cross-realm?
            throw new Error("failed request!");
          });
        });
      });
    });
  });
});
