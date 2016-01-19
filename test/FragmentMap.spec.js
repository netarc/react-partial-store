var chai = require('chai')
  , assert = chai.assert
  , Constants = require('../lib/Constants')
  , FragmentMap = require('../lib/FragmentMap')
  , DefaultPartial = Constants.defaultFragment;


function assertFragmentData(obj, key, data, partial) {
  assert.isObject(obj);
  assert.property(obj, key);

  if (typeof(data) === 'object') {
    assert.deepPropertyVal(obj, key + ".status", Constants.status.SUCCESS);
    assert.deepProperty(obj, key + ".timestamp");
    assert.deepEqual(obj[key].data, data);
  }
  else {
    assert.propertyVal(obj, key, data);
  }

  if (partial) {
    assert.deepPropertyVal(obj, key + ".partial", partial);
  }
}

function assertQueryData(obj, key, data) {
  assert.isObject(obj);
  assert.property(obj, key);

  assert.deepPropertyVal(obj, key + ".status", Constants.status.SUCCESS);
  assert.deepProperty(obj, key + ".timestamp");
  assert.deepEqual(obj[key].data, data);
}

describe("FragmentMap", function() {
  describe("the update method", function() {
    var fragmentMap
      , dataSegmentId_1 = {
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

    beforeEach(function() {
      fragmentMap = new FragmentMap();
    });

    describe("when passed a collection descriptor", function() {
      it("should properly store the data for a specified partial", function() {
        fragmentMap.update({
          path: "/projects",
          partial: "foobar"
        }, [dataSegmentId_1, dataSegmentId_2], Constants.status.SUCCESS);

        assert.sameMembers(Object.keys(fragmentMap.fragments), ["foobar"]);
        assert.sameMembers(Object.keys(fragmentMap.fragments.foobar), ["1", "2"]);
        assertFragmentData(fragmentMap.fragments.foobar, 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments.foobar, 2, dataSegmentId_2);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects"]);
        assertFragmentData(fragmentMap.queries, "/projects", [1,2], "foobar");
      });

      it("should properly store the data for a default partial", function() {
        fragmentMap.update({
          path: "/projects"
        }, [dataSegmentId_1, dataSegmentId_2], Constants.status.SUCCESS);

        assert.sameMembers(Object.keys(fragmentMap.fragments), [DefaultPartial]);
        assert.sameMembers(Object.keys(fragmentMap.fragments[DefaultPartial]), ["1", "2"]);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 2, dataSegmentId_2);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects"]);
        assertFragmentData(fragmentMap.queries, "/projects", [1,2], DefaultPartial);
      });

      it("should properly update when updated multiple times", function() {
        fragmentMap.update({
          path: "/projects",
          partial: "foobar"
        }, [dataSegmentId_1, dataSegmentId_2], Constants.status.SUCCESS);
        fragmentMap.update({
          path: "/projects",
          partial: "foobar"
        }, [dataSegmentId_1, dataSegmentId_3], Constants.status.SUCCESS);


        assert.sameMembers(Object.keys(fragmentMap.fragments), ["foobar"]);
        assert.sameMembers(Object.keys(fragmentMap.fragments.foobar), ["1", "2", "3"]);
        assertFragmentData(fragmentMap.fragments.foobar, 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments.foobar, 2, dataSegmentId_2);
        assertFragmentData(fragmentMap.fragments.foobar, 3, dataSegmentId_3);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects"]);
        assertFragmentData(fragmentMap.queries, "/projects", [1,3], "foobar");
      });
    });

    describe("when passed an id descriptor", function() {
      it("should properly store the data with a specified partial", function() {
        fragmentMap.update({
          id: 1,
          path: "/projects/1",
          partial: "foobar"
        }, dataSegmentId_1, Constants.status.SUCCESS);

        assert.sameMembers(Object.keys(fragmentMap.fragments), ["foobar"]);
        assert.sameMembers(Object.keys(fragmentMap.fragments.foobar), ["1"]);
        assertFragmentData(fragmentMap.fragments.foobar, 1, dataSegmentId_1);

        assert.deepEqual(fragmentMap.queries, {});
      });

      it("should properly store the data with a default partial", function() {
        fragmentMap.update({
          id: 1,
          path: "/projects/1",
        }, dataSegmentId_1, Constants.status.SUCCESS);

        assert.sameMembers(Object.keys(fragmentMap.fragments), [DefaultPartial]);
        assert.sameMembers(Object.keys(fragmentMap.fragments[DefaultPartial]), ["1"]);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 1, dataSegmentId_1);

        assert.deepEqual(fragmentMap.queries, {});
      });

      it("should properly update when updated multiple times", function() {
        fragmentMap.update({
          id: 1,
          path: "/projects/1",
          partial: "foobar"
        }, dataSegmentId_1, Constants.status.SUCCESS);
        fragmentMap.update({
          id: 1,
          path: "/projects/1",
          partial: "foobar"
        }, dataSegmentId_2, Constants.status.SUCCESS);

        assert.sameMembers(Object.keys(fragmentMap.fragments), ["foobar"]);
        assert.sameMembers(Object.keys(fragmentMap.fragments.foobar), ["1"]);
        assertFragmentData(fragmentMap.fragments.foobar, 1, dataSegmentId_2);

        assert.deepEqual(fragmentMap.queries, {});
      });
    });

    describe("when passed an non-id descriptor", function() {
      it("should properly store the data with a specified partial", function() {
        fragmentMap.update({
          path: "/projects/1",
          partial: "foobar"
        }, dataSegmentId_1, Constants.status.SUCCESS);

        assert.sameMembers(Object.keys(fragmentMap.fragments), ["foobar"]);
        assert.sameMembers(Object.keys(fragmentMap.fragments.foobar), ["1"]);
        assertFragmentData(fragmentMap.fragments.foobar, 1, dataSegmentId_1);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects/1"]);
        assertQueryData(fragmentMap.queries, "/projects/1", 1);
      });

      it("should properly store the data with a default partial", function() {
        fragmentMap.update({
          path: "/projects/1",
        }, dataSegmentId_1, Constants.status.SUCCESS);

        assert.sameMembers(Object.keys(fragmentMap.fragments), [DefaultPartial]);
        assert.sameMembers(Object.keys(fragmentMap.fragments[DefaultPartial]), ["1"]);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 1, dataSegmentId_1);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects/1"]);
        assertQueryData(fragmentMap.queries, "/projects/1", 1);
      });

      it("should properly update when updated multiple times", function() {
        fragmentMap.update({
          path: "/projects/1",
          partial: "foobar"
        }, dataSegmentId_1, Constants.status.SUCCESS);
        fragmentMap.update({
          path: "/projects/1",
          partial: "foobar"
        }, dataSegmentId_2, Constants.status.SUCCESS);

        assert.sameMembers(Object.keys(fragmentMap.fragments), ["foobar"]);
        assert.sameMembers(Object.keys(fragmentMap.fragments.foobar), ["1", "2"]);
        assertFragmentData(fragmentMap.fragments.foobar, 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments.foobar, 2, dataSegmentId_2);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects/1"]);
        assertQueryData(fragmentMap.queries, "/projects/1", 2);
      });
    });

    describe("when passed multiple collection descriptors", function() {
      it("should properly store the data for a specified partial", function() {
        fragmentMap.update({
          path: "/projects",
          partial: "foobar"
        }, [dataSegmentId_1, dataSegmentId_2], Constants.status.SUCCESS);
        fragmentMap.update({
          path: "/projects/active",
          partial: "foobar"
        }, [dataSegmentId_1, dataSegmentId_3], Constants.status.SUCCESS);

        assert.sameMembers(Object.keys(fragmentMap.fragments), ["foobar"]);
        assert.sameMembers(Object.keys(fragmentMap.fragments.foobar), ["1", "2", "3"]);
        assertFragmentData(fragmentMap.fragments.foobar, 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments.foobar, 2, dataSegmentId_2);
        assertFragmentData(fragmentMap.fragments.foobar, 3, dataSegmentId_3);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects", "/projects/active"]);
        assertFragmentData(fragmentMap.queries, "/projects", [1,2], "foobar");
        assertFragmentData(fragmentMap.queries, "/projects/active", [1,3], "foobar");
      });

      it("should properly store the data for a default partial", function() {
        fragmentMap.update({
          path: "/projects"
        }, [dataSegmentId_1, dataSegmentId_2], Constants.status.SUCCESS);
        fragmentMap.update({
          path: "/projects/active"
        }, [dataSegmentId_1, dataSegmentId_3], Constants.status.SUCCESS);

        assert.sameMembers(Object.keys(fragmentMap.fragments), [DefaultPartial]);
        assert.sameMembers(Object.keys(fragmentMap.fragments[DefaultPartial]), ["1", "2", "3"]);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 2, dataSegmentId_2);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 3, dataSegmentId_3);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects", "/projects/active"]);
        assertFragmentData(fragmentMap.queries, "/projects", [1,2], DefaultPartial);
        assertFragmentData(fragmentMap.queries, "/projects/active", [1,3], DefaultPartial);
      });

      it("should properly update when updated multiple times", function() {
        fragmentMap.update({
          path: "/projects",
          partial: "foobar"
        }, [dataSegmentId_1, dataSegmentId_2], Constants.status.SUCCESS);
        fragmentMap.update({
          path: "/projects/active",
          partial: "foobar"
        }, [dataSegmentId_1, dataSegmentId_3], Constants.status.SUCCESS);

        fragmentMap.update({
          path: "/projects",
          partial: "foobar"
        }, [dataSegmentId_1, dataSegmentId_4], Constants.status.SUCCESS);


        assert.sameMembers(Object.keys(fragmentMap.fragments), ["foobar"]);
        assert.sameMembers(Object.keys(fragmentMap.fragments.foobar), ["1", "2", "3", "4"]);
        assertFragmentData(fragmentMap.fragments.foobar, 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments.foobar, 2, dataSegmentId_2);
        assertFragmentData(fragmentMap.fragments.foobar, 3, dataSegmentId_3);
        assertFragmentData(fragmentMap.fragments.foobar, 4, dataSegmentId_4);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects", "/projects/active"]);
        assertFragmentData(fragmentMap.queries, "/projects", [1, 4], "foobar");
        assertFragmentData(fragmentMap.queries, "/projects/active", [1,3], "foobar");
      });
    });

    describe("when passed multiple id descriptors", function() {
      it("should properly store the data with a specified partial", function() {
        fragmentMap.update({
          id: 1,
          path: "/projects/1",
          partial: "foobar"
        }, dataSegmentId_1, Constants.status.SUCCESS);
        fragmentMap.update({
          id: 2,
          path: "/projects/2",
          partial: "foobar"
        }, dataSegmentId_2, Constants.status.SUCCESS);

        assert.sameMembers(Object.keys(fragmentMap.fragments), ["foobar"]);
        assert.sameMembers(Object.keys(fragmentMap.fragments.foobar), ["1", "2"]);
        assertFragmentData(fragmentMap.fragments.foobar, 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments.foobar, 2, dataSegmentId_2);

        assert.deepEqual(fragmentMap.queries, {});
      });

      it("should properly store the data with a default partial", function() {
        fragmentMap.update({
          id: 1,
          path: "/projects/1",
        }, dataSegmentId_1, Constants.status.SUCCESS);
        fragmentMap.update({
          id: 2,
          path: "/projects/2",
        }, dataSegmentId_2, Constants.status.SUCCESS);

        assert.sameMembers(Object.keys(fragmentMap.fragments), [DefaultPartial]);
        assert.sameMembers(Object.keys(fragmentMap.fragments[DefaultPartial]), ["1", "2"]);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 2, dataSegmentId_2);

        assert.deepEqual(fragmentMap.queries, {});
      });

      it("should properly update when updated multiple times", function() {
        fragmentMap.update({
          id: 1,
          path: "/projects/1",
          partial: "foobar"
        }, dataSegmentId_1, Constants.status.SUCCESS);
        fragmentMap.update({
          id: 2,
          path: "/projects/2",
          partial: "foobar"
        }, dataSegmentId_2, Constants.status.SUCCESS);
        fragmentMap.update({
          id: 1,
          path: "/projects/1",
          partial: "foobar"
        }, dataSegmentId_3, Constants.status.SUCCESS);

        assert.sameMembers(Object.keys(fragmentMap.fragments), ["foobar"]);
        assert.sameMembers(Object.keys(fragmentMap.fragments.foobar), ["1", "2"]);
        assertFragmentData(fragmentMap.fragments.foobar, 1, dataSegmentId_3);
        assertFragmentData(fragmentMap.fragments.foobar, 2, dataSegmentId_2);

        assert.deepEqual(fragmentMap.queries, {});
      });
    });

    describe("when passed multiple non-id descriptors", function() {
      it("should properly store the data with a specified partial", function() {
        fragmentMap.update({
          path: "/projects/1",
          partial: "foobar"
        }, dataSegmentId_1, Constants.status.SUCCESS);
        fragmentMap.update({
          path: "/projects/2",
          partial: "foobar"
        }, dataSegmentId_2, Constants.status.SUCCESS);

        assert.sameMembers(Object.keys(fragmentMap.fragments), ["foobar"]);
        assert.sameMembers(Object.keys(fragmentMap.fragments.foobar), ["1", "2"]);
        assertFragmentData(fragmentMap.fragments.foobar, 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments.foobar, 2, dataSegmentId_2);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects/1", "/projects/2"]);
        assertQueryData(fragmentMap.queries, "/projects/1", 1);
        assertQueryData(fragmentMap.queries, "/projects/2", 2);
      });

      it("should properly store the data with a default partial", function() {
        fragmentMap.update({
          path: "/projects/1",
        }, dataSegmentId_1, Constants.status.SUCCESS);
        fragmentMap.update({
          path: "/projects/2",
        }, dataSegmentId_2, Constants.status.SUCCESS);

        assert.sameMembers(Object.keys(fragmentMap.fragments), [DefaultPartial]);
        assert.sameMembers(Object.keys(fragmentMap.fragments[DefaultPartial]), ["1", "2"]);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 2, dataSegmentId_2);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects/1", "/projects/2"]);
        assertQueryData(fragmentMap.queries, "/projects/1", 1);
        assertQueryData(fragmentMap.queries, "/projects/2", 2);
      });

      it("should properly update when updated multiple times", function() {
        fragmentMap.update({
          path: "/projects/1",
          partial: "foobar"
        }, dataSegmentId_1, Constants.status.SUCCESS);
        fragmentMap.update({
          path: "/projects/2",
          partial: "foobar"
        }, dataSegmentId_2, Constants.status.SUCCESS);
        fragmentMap.update({
          path: "/projects/1",
          partial: "foobar"
        }, dataSegmentId_3, Constants.status.SUCCESS);

        assert.sameMembers(Object.keys(fragmentMap.fragments), ["foobar"]);
        assert.sameMembers(Object.keys(fragmentMap.fragments.foobar), ["1", "2", "3"]);
        assertFragmentData(fragmentMap.fragments.foobar, 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments.foobar, 2, dataSegmentId_2);
        assertFragmentData(fragmentMap.fragments.foobar, 3, dataSegmentId_3);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects/1", "/projects/2"]);
        assertQueryData(fragmentMap.queries, "/projects/1", 3);
        assertQueryData(fragmentMap.queries, "/projects/2", 2);
      });

      it("should properly update a collection when updated multiple times", function() {
        fragmentMap.update({
          path: "/projects",
          partial: "foobar"
        }, [dataSegmentId_1, dataSegmentId_2], Constants.status.SUCCESS);
        fragmentMap.update({
          path: "/projects",
          partial: "foobar"
        }, dataSegmentId_3, Constants.status.SUCCESS);

        assert.sameMembers(Object.keys(fragmentMap.fragments), ["foobar"]);
        assert.sameMembers(Object.keys(fragmentMap.fragments.foobar), ["1", "2", "3"]);
        assertFragmentData(fragmentMap.fragments.foobar, 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments.foobar, 2, dataSegmentId_2);
        assertFragmentData(fragmentMap.fragments.foobar, 3, dataSegmentId_3);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects"]);
        assertQueryData(fragmentMap.queries, "/projects", [1, 2, 3]);
      });
    });
  });

  describe("the fetch method", function() {
    var fragmentMap
      , dataSegmentId_1 = {
        id: 1,
        title: "Foo Project"
      }
      , dataSegmentId_2 = {
        id: 2,
        title: "Bar Project"
      }
      , dataSegmentId_3 = {
        id: 3,
        title: "FooBar Project"
      };

    beforeEach(function() {
      fragmentMap = new FragmentMap();
      fragmentMap.update({
        path: "/projects",
        partial: DefaultPartial
      }, [dataSegmentId_1, dataSegmentId_2], Constants.status.SUCCESS);
      fragmentMap.update({
        path: "/projects/active",
        partial: DefaultPartial
      }, [dataSegmentId_1, dataSegmentId_3], Constants.status.SUCCESS);
    });

    describe("when passed an empty descriptor", function() {
      it("should return a stale resource", function() {
        var result = fragmentMap.fetch({});

        assert.typeOf(result, "object");
        assert.property(result, "status");
        assert.strictEqual(result.status, Constants.status.STALE);
        assert.property(result, "timestamp");
        assert.strictEqual(result.timestamp, Constants.timestamp.stale);
        assert.notProperty(result, "data");
      });
    });

    describe("when passed an id descriptor", function() {
      it("should return the proper resource for a valid id", function() {
        var result = fragmentMap.fetch({id: 1});

        assert.typeOf(result, "object");
        assert.property(result, "status");
        assert.strictEqual(result.status, Constants.status.SUCCESS);
        assert.property(result, "timestamp");
        assert.notStrictEqual(result.timestamp, Constants.timestamp.stale);
        assert.property(result, "data");
        assert.deepEqual(result.data, dataSegmentId_1);
      });

      it("should return a stale resource for a invalid id", function() {
        var result = fragmentMap.fetch({id: 4});

        assert.typeOf(result, "object");
        assert.property(result, "status");
        assert.strictEqual(result.status, Constants.status.STALE);
        assert.property(result, "timestamp");
        assert.strictEqual(result.timestamp, Constants.timestamp.stale);
        assert.notProperty(result, "data");
      });
    });

    describe("when passed a path descriptor", function() {
      it("should return the proper resource for a valid path", function() {
        var result = fragmentMap.fetch({path: "/projects"});

        assert.typeOf(result, "object");
        assert.property(result, "status");
        assert.strictEqual(result.status, Constants.status.SUCCESS);
        assert.property(result, "timestamp");
        assert.notStrictEqual(result.timestamp, Constants.timestamp.stale);
        assert.property(result, "data");
        assert.deepEqual(result.data, [dataSegmentId_1, dataSegmentId_2]);
      });

      it("should return a stale resource for a invalid path", function() {
        var result = fragmentMap.fetch({path: "/projectsz"});

        assert.typeOf(result, "object");
        assert.property(result, "status");
        assert.strictEqual(result.status, Constants.status.STALE);
        assert.property(result, "timestamp");
        assert.strictEqual(result.timestamp, Constants.timestamp.stale);
        assert.notProperty(result, "data");
      });
    });
  });

  describe("the delete method", function() {
    var fragmentMap
      , dataSegmentId_1 = {
        id: 1,
        title: "Foo Project"
      }
      , dataSegmentId_2 = {
        id: 2,
        title: "Bar Project"
      }
      , dataSegmentId_3 = {
        id: 3,
        title: "FooBar Project"
      };

    beforeEach(function() {
      fragmentMap = new FragmentMap();
      fragmentMap.update({
        path: "/projects",
      }, [dataSegmentId_1, dataSegmentId_2], Constants.status.SUCCESS);
      fragmentMap.update({
        path: "/projects/active",
      }, [dataSegmentId_1, dataSegmentId_3], Constants.status.SUCCESS);
    });

    describe("when passed an empty descriptor", function() {
      it("should perform no action", function() {
        fragmentMap.delete({});

        assert.sameMembers(Object.keys(fragmentMap.fragments), [DefaultPartial]);
        assert.sameMembers(Object.keys(fragmentMap.fragments[DefaultPartial]), ["1", "2", "3"]);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 2, dataSegmentId_2);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 3, dataSegmentId_3);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects", "/projects/active"]);
        assertFragmentData(fragmentMap.queries, "/projects", [1, 2], DefaultPartial);
        assertFragmentData(fragmentMap.queries, "/projects/active", [1, 3], DefaultPartial);
      });
    });

    describe("when passed an id descriptor", function() {
      it("should properly delete resource and remove from collections", function() {
        fragmentMap.delete({id: 2});

        assert.sameMembers(Object.keys(fragmentMap.fragments), [DefaultPartial]);
        assert.sameMembers(Object.keys(fragmentMap.fragments[DefaultPartial]), ["1", "2", "3"]);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 2, undefined);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 3, dataSegmentId_3);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects", "/projects/active"]);
        assertFragmentData(fragmentMap.queries, "/projects", [1], DefaultPartial);
        assertFragmentData(fragmentMap.queries, "/projects/active", [1, 3], DefaultPartial);
      });
    });

    describe("when passed a path descriptor", function() {
      it("should properly delete only the query", function() {
        fragmentMap.delete({path: "/projects"});

        assert.sameMembers(Object.keys(fragmentMap.fragments), [DefaultPartial]);
        assert.sameMembers(Object.keys(fragmentMap.fragments[DefaultPartial]), ["1", "2", "3"]);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 2, dataSegmentId_2);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 3, dataSegmentId_3);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects", "/projects/active"]);
        assertFragmentData(fragmentMap.queries, "/projects", undefined);
        assertFragmentData(fragmentMap.queries, "/projects/active", [1, 3], DefaultPartial);
      });
    });
  });

  describe("the touch method", function() {
    var fragmentMap
      , dataSegmentId_1 = {
        id: 1,
        title: "Foo Project"
      }
      , dataSegmentId_2 = {
        id: 2,
        title: "Bar Project"
      }
      , dataSegmentId_3 = {
        id: 3,
        title: "FooBar Project"
      };

    beforeEach(function() {
      fragmentMap = new FragmentMap();
      fragmentMap.update({
        path: "/projects",
      }, [dataSegmentId_1, dataSegmentId_2], Constants.status.SUCCESS);
      fragmentMap.update({
        path: "/projects/active",
      }, [dataSegmentId_1, dataSegmentId_3], Constants.status.SUCCESS);
    });

    describe("when passed an invalid descriptor", function() {
      it("should perform no action on empty descriptor", function() {
        fragmentMap.touch({});

        assert.sameMembers(Object.keys(fragmentMap.fragments), [DefaultPartial]);
        assert.sameMembers(Object.keys(fragmentMap.fragments[DefaultPartial]), ["1", "2", "3"]);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 2, dataSegmentId_2);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 3, dataSegmentId_3);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects", "/projects/active"]);
        assertFragmentData(fragmentMap.queries, "/projects", [1, 2], DefaultPartial);
        assertFragmentData(fragmentMap.queries, "/projects/active", [1, 3], DefaultPartial);
      });

      it("should perform no action on empty touch", function() {
        fragmentMap.touch({id: 2}, {});

        assert.sameMembers(Object.keys(fragmentMap.fragments), [DefaultPartial]);
        assert.sameMembers(Object.keys(fragmentMap.fragments[DefaultPartial]), ["1", "2", "3"]);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 2, dataSegmentId_2);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 3, dataSegmentId_3);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects", "/projects/active"]);
        assertFragmentData(fragmentMap.queries, "/projects", [1, 2], DefaultPartial);
        assertFragmentData(fragmentMap.queries, "/projects/active", [1, 3], DefaultPartial);
      });
    });

    describe("when passed an id descriptor", function() {
      it("should properly update metadata", function() {
        assert.deepPropertyNotVal(fragmentMap.fragments[DefaultPartial], "2.timestamp", 123);

        fragmentMap.touch({id: 2}, {timestamp: 123});

        assert.sameMembers(Object.keys(fragmentMap.fragments), [DefaultPartial]);
        assert.sameMembers(Object.keys(fragmentMap.fragments[DefaultPartial]), ["1", "2", "3"]);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 2, dataSegmentId_2);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 3, dataSegmentId_3);
        assert.deepPropertyVal(fragmentMap.fragments[DefaultPartial], "2.timestamp", 123);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects", "/projects/active"]);
        assertFragmentData(fragmentMap.queries, "/projects", [1, 2], DefaultPartial);
        assertFragmentData(fragmentMap.queries, "/projects/active", [1, 3], DefaultPartial);
      });
    });

    describe("when passed a path descriptor", function() {
      it("should properly update metadata", function() {
        assert.propertyNotVal(fragmentMap.queries["/projects"], "timestamp", 123);

        fragmentMap.touch({path: "/projects"}, {timestamp: 123});

        assert.sameMembers(Object.keys(fragmentMap.fragments), [DefaultPartial]);
        assert.sameMembers(Object.keys(fragmentMap.fragments[DefaultPartial]), ["1", "2", "3"]);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 1, dataSegmentId_1);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 2, dataSegmentId_2);
        assertFragmentData(fragmentMap.fragments[DefaultPartial], 3, dataSegmentId_3);

        assert.sameMembers(Object.keys(fragmentMap.queries), ["/projects", "/projects/active"]);
        assertFragmentData(fragmentMap.queries, "/projects", [1, 2], DefaultPartial);
        assertFragmentData(fragmentMap.queries, "/projects/active", [1, 3], DefaultPartial);
        assert.propertyVal(fragmentMap.queries["/projects"], "timestamp", 123);
      });
    });
  });
});
