var chai = require('chai')
  , _ = require('../lib/utils')
  , RPS = require('../lib/index')
  , MixinSubset = require("../lib/MixinSubset")
  , StackReducer = require('../lib/StackReducer')
  , testHelper = require('./testHelper')
  , expect = chai.expect;


describe("MixinSubset", function() {
  // TODO: the use of this "here" causes a timeout for a nock:
  // "StackInvoker invoke method resolving get resource not existing in store"
  afterEach(testHelper.deleteStores);

  describe("when instantiated", function() {
    it("should look like MixinSubset", function() {
      var Nestable = _.defineClass(MixinSubset)
        , NestableInstance = new Nestable();

      expect(NestableInstance.addDataset).to.be.a("function");
      expect(NestableInstance._subsets).to.deep.equal({});
    });
  });

  describe("is accessible on Datasets", function() {
    it("and should properly subset", function() {
      var Users = RPS.createStore("users", {
          uri: "/users"
        })
        , Projects = RPS.createStore("projects", {
          uri: "/projects"
        })
        , Posts = RPS.createStore("posts", {
          uri: "/posts"
        });

      Users.addDataset("user", {
        uri: "/:userId",
        paramId: "userId"
      });

      Projects.addDataset("project", {
        uri: "/:projectId",
        paramId: "projectId"
      });

      Posts.addDataset("post", {
        uri: "/:postId",
        paramId: "postId"
      });

      Projects.project.addDataset("users", Users);
      Posts.post.addDataset("users", Users);

      expect(Projects).to.be.an.instanceof(RPS.createDataset.prototype);
      expect(Projects.project.users).to.be.an.instanceof(RPS.createDataset.prototype);
      expect(Posts).to.be.an.instanceof(RPS.createDataset.prototype);
      expect(Posts.post.users).to.be.an.instanceof(RPS.createDataset.prototype);
      expect(Posts.post.users).to.not.equal(Projects.project.users);

      var ProjectUsersDescriptor = StackReducer(Projects.project.users.resolve({__params: {projectId: 1}}))
        , PostUsersDescriptor = StackReducer(Posts.post.users.resolve({__params: {postId: 2}}));

      expect(ProjectUsersDescriptor.path).to.equal("/projects/1/users");
      expect(ProjectUsersDescriptor.store.definition.type).to.equal("users");
      expect(PostUsersDescriptor.path).to.equal("/posts/2/users");
      expect(PostUsersDescriptor.store.definition.type).to.equal("users");
    });
  });
});
