var chai = require('chai')
  , StackReducer = require("../src/StackReducer")
  , assert = chai.assert;


describe("StackReducer", function() {
  it("returns an expected format when invoked", function() {
    var result = StackReducer();

    assert.sameMembers(Object.keys(result), [
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

  it("should correctly reduce objects as payload", function() {
    var result1 = StackReducer([
        {foo: "bar"},
        {bar: 123}
      ])
      , result2 = StackReducer([
        {foo: "bar"},
        {bar: 123, foo: "foo"}
      ]);

    assert.deepEqual(result1.payload, {foo: "bar", bar: 123});
    assert.deepEqual(result2.payload, {foo: "foo", bar: 123});
  });

  it("should correctly reduce params", function() {
    var result1 = StackReducer([
        {__params: {foo: "bar"}},
        {__params: {bar: 123}}
      ])
      , result2 = StackReducer([
        {__params: {foo: "bar"}},
        {__params: {bar: 123, foo: "foo"}}
      ]);

    assert.deepEqual(result1.params, {foo: "bar", bar: 123});
    assert.deepEqual(result2.params, {foo: "foo", bar: 123});
  });

  it("should correctly reduce store reference", function() {
    var result1 = StackReducer([
        {__type: "store", __reference: "store1", __definition: {type: "foo"}},
        {__type: "store", __reference: "store2", __definition: {type: "bar"}},
      ])
      , result2 = StackReducer([
        {__type: "dataset", __reference: "store3", __definition: {type: "bar"}},
        {__type: "store", __reference: "store4", __definition: {type: "foo"}},
      ])
      , result3 = StackReducer();

    assert.strictEqual(result1.store, "store2");
    assert.strictEqual(result1.type, "bar");
    assert.strictEqual(result2.store, "store4");
    assert.strictEqual(result2.type, "foo");
    assert.isNull(result3.store);
    assert.isNull(result3.type);
  });

  it("should correctly reduce definition partial", function() {
    var result1 = StackReducer([
        {__type: "dataset", __definition: {partial: "foo"}},
        {__type: "dataset", __definition: {partial: "bar"}},
      ])
      , result2 = StackReducer([
        {__type: "dataset", __definition: {partial: "foo"}},
        {__type: "store", __definition: {partial: "bar"}},
      ])
      , result3 = StackReducer();

    assert.strictEqual(result1.partial, "bar");
    assert.strictEqual(result2.partial, "foo");
    assert.isNull(result3.partial);
  });

  it("should correctly reduce definition fragments", function() {
    var result1 = StackReducer([
        {__type: "dataset", __definition: {fragments: ["foo", "nop"]}},
        {__type: "dataset", __definition: {fragments: ["bar"]}},
      ])
      , result2 = StackReducer([
        {__type: "dataset", __definition: {fragments: ["foo", "nop"]}},
        {__type: "store", __definition: {fragments: ["bar"]}},
      ])
      , result3 = StackReducer();

    assert.sameMembers(result1.fragments, ["foo", "bar", "nop"]);
    assert.sameMembers(result2.fragments, ["foo", "nop"]);
    assert.deepEqual(result3.fragments, []);
  });

  describe("reduce definiton actions", function() {
    it("should correctly merge", function() {
      var result1 = StackReducer([
          {__type: "dataset", __definition: {actions: {pull: 123, update: 321}}},
          {__type: "dataset", __definition: {actions: {delete: 456}}},
        ])
        , result2 = StackReducer([
          {__type: "dataset", __definition: {actions: {pull: 123, update: 321}}},
          {__type: "store", __definition: {actions: {delete: 789, update: 123}}},
        ])
        , result3 = StackReducer();

      assert.deepEqual(Object.keys(result1.actions), [
        "invalidate",
        "get",
        "create",
        "post",
        "update",
        "put",
        "delete",
        "pull"
      ]);
      assert.strictEqual(result1.actions.pull, 123);
      assert.strictEqual(result1.actions.update, 321);
      assert.strictEqual(result1.actions.delete, 456);

      assert.deepEqual(Object.keys(result2.actions), [
        "invalidate",
        "get",
        "create",
        "post",
        "update",
        "put",
        "delete",
        "pull"
      ]);
      assert.strictEqual(result2.actions.pull, 123);
      assert.strictEqual(result2.actions.update, 123);
      assert.strictEqual(result2.actions.delete, 789);

      assert.sameMembers(Object.keys(result3.actions), [
        "invalidate",
        "get",
        "create",
        "post",
        "update",
        "put",
        "delete"
      ]);
      assert.isFunction(result3.actions.invalidate);
      assert.isFunction(result3.actions.get);
      assert.isFunction(result3.actions.create);
      assert.isFunction(result3.actions.post);
      assert.isFunction(result3.actions.update);
      assert.isFunction(result3.actions.put);
      assert.isFunction(result3.actions.delete);
    });

    it("should correctly whitelist", function() {
      var result1 = StackReducer([
          {__type: "dataset", __definition: {actions: {pull: 123, update: 321}}},
          {__type: "dataset", __definition: {onlyActions: {delete: 456}}},
        ])
        , result2 = StackReducer([
          {__type: "dataset", __definition: {onlyActions: {pull: 123, update: 321}}},
          {__type: "store", __definition: {actions: {delete: 789, update: 123}}},
        ]);

      assert.deepEqual(Object.keys(result1.actions), [
        "delete"
      ]);
      assert.strictEqual(result1.actions.delete, 456);

      assert.deepEqual(Object.keys(result2.actions), [
        "pull",
        "update",
        "delete"
      ]);
      assert.strictEqual(result2.actions.pull, 123);
      assert.strictEqual(result2.actions.update, 123);
      assert.strictEqual(result2.actions.delete, 789);
    });

    it("should throw an error on invalid", function() {
      assert.throws(function() {
        StackReducer([
          {__type: "dataset", __definition: {actions: 123}},
          {__type: "dataset", __definition: {onlyActions: {delete: 456}}}
        ]);
      }, TypeError, "was not an object, but of type");

      assert.throws(function() {
        StackReducer([
          {__type: "dataset", __definition: {onlyActions: {pull: 123, update: 321}}},
          {__type: "store", __definition: {actions: "update"}}
        ]);
      }, TypeError, "was not an object, but of type");
    });
  });

  describe("reduce definiton paramId", function() {
    it("should correctly merge and resolve valid key", function() {
      var result1 = StackReducer([
          {__type: "dataset", __definition: {paramId: "foo"}},
          {__type: "dataset", __definition: {paramId: "bar"}},
          {__params: {foo: 123, bar: 321}}
        ])
        , result2 = StackReducer([
          {__type: "dataset", __definition: {paramId: "foo"}},
          {__type: "store", __definition: {paramId: "bar"}},
          {__params: {foo: 123, bar: 321}}
        ]);

      assert.strictEqual(result1.id, "321");
      assert.strictEqual(result2.id, "321");
    });

    it("should correctly merge and resolve in-valid key", function() {
      var result1 = StackReducer([
          {__type: "dataset", __definition: {paramId: "foo"}},
          {__type: "dataset", __definition: {paramId: "bar"}},
          {__params: {fooz: 123, barz: 321}}
        ])
        , result2 = StackReducer([
          {__type: "dataset", __definition: {paramId: "foo"}},
          {__type: "store", __definition: {paramId: "bar"}},
          {__params: {fooz: 123, barz: 321}}
        ]);

      assert.strictEqual(result1.id, undefined);
      assert.strictEqual(result2.id, undefined);
    });

    it("should correctly affect events", function() {
      var result1 = StackReducer([
          {__type: "dataset", __definition: {paramId: "foo"}},
          {__type: "dataset", __definition: {paramId: "bar"}},
          {__params: {foo: 123, bar: 321}}
        ])
        , result2 = StackReducer([
          {__type: "dataset", __definition: {}},
          {__type: "store", __definition: {}},
          {__params: {foo: 123, bar: 321}}
        ]);

      assert.strictEqual(result1.event, "change:321");
      assert.strictEqual(result2.event, "change");
    });
  });

  describe("reduce definiton paramMap", function() {
    it("should correctly merge and resolve", function() {
      var result1 = StackReducer([
          {__type: "dataset", __definition: {paramId: "foo"}},
          {__type: "dataset", __definition: {paramMap: {foo: "bar"}}},
          {__type: "dataset", __definition: {paramMap: {foo: "baz"}}},
          {__params: {foo: 123, bar: 321, baz: 987}}
        ])
        , result2 = StackReducer([
          {__type: "dataset", __definition: {paramId: "foo"}},
          {__type: "dataset", __definition: {paramMap: {foo: "bar"}}},
          {__type: "store", __definition: {paramMap: {foo: "baz"}}},
          {__params: {foo: 123, bar: 321, baz: 987}}
        ]);

      assert.strictEqual(result1.id, "987");
      assert.strictEqual(result2.id, "321");
    });

    it("should affect uri", function() {
      var result1 = StackReducer([
          {__type: "dataset", __definition: {paramId: "foo"}},
          {__type: "dataset", __definition: {paramMap: {foo: "bar"}}},
          {__type: "dataset", __definition: {paramMap: {foo: "baz"}}},
          {__type: "dataset", __definition: {uri: "/foo/:foo"}},
          {__type: "dataset", __definition: {uri: "/bar/:bar"}},
          {__params: {foo: 123, bar: 321, baz: 987}}
        ])
        , result2 = StackReducer([
          {__type: "dataset", __definition: {paramId: "foo"}},
          {__type: "dataset", __definition: {paramMap: {foo: "bar"}}},
          {__type: "store", __definition: {paramMap: {foo: "baz"}}},
          {__type: "dataset", __definition: {uri: "/foo/:foo"}},
          {__type: "store", __definition: {uri: "/bar/:bar"}},
          {__params: {foo: 123, bar: 321, baz: 987}}
        ]);

      assert.strictEqual(result1.path, "/foo/987/bar/321");
      assert.strictEqual(result2.path, "/foo/321/bar/321");
    });
  });

  describe("reduce definiton partial", function() {
    it("should correctly merge and resolve", function() {
      var result1 = StackReducer([
          {__type: "dataset", __definition: {partial: "foo"}},
          {__type: "dataset", __definition: {partial: "bar"}}
        ])
        , result2 = StackReducer([
          {__type: "dataset", __definition: {partial: "foo"}},
          {__type: "store", __definition: {partial: "bar"}}
        ]);

      assert.strictEqual(result1.partial, "bar");
      assert.strictEqual(result2.partial, "foo");
    });
  });

  describe("reduce definiton fragments", function() {
    it("should correctly merge and resolve", function() {
      var result1 = StackReducer([
          {__type: "dataset", __definition: {fragments: ["foo", "bar"]}},
          {__type: "dataset", __definition: {fragments: ["baz"]}}
        ])
        , result2 = StackReducer([
          {__type: "dataset", __definition: {fragments: ["foo", "bar"]}},
          {__type: "store", __definition: {fragments: ["bar"]}}
        ]);

      assert.deepEqual(result1.fragments, ["baz", "bar", "foo"]);
      assert.deepEqual(result2.fragments, ["bar", "foo"]);
    });
  });

  describe("reduce definiton uri", function() {
    it("should correctly concat and resolve", function() {
      var result1 = StackReducer([
          {__type: "dataset", __definition: {uri: "/foo/:foo"}},
          {__type: "dataset", __definition: {uri: "/bar/:bar"}},
          {__params: {foo: 123, bar: 321}}
        ])
        , result2 = StackReducer([
          {__type: "dataset", __definition: {uri: "/foo/:foo"}},
          {__type: "store", __definition: {uri: "/bar/:bar"}},
          {__params: {foo: 123, bar: 321}}
        ]);

      assert.strictEqual(result1.path, "/foo/123/bar/321");
      assert.strictEqual(result2.path, "/foo/123/bar/321");
    });
  });
});
