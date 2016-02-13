var chai = require('chai')
  , utils = require('../lib/utils')
  /* jshint -W098 : needed to prevent circular dependency issues */
  , RPS = require('../lib/index')
  , StackReducer = require('../lib/StackReducer')
  , expect = chai.expect;


describe("StackReducer", function() {
  it("returns an expected format when invoked", function() {
    var result = StackReducer();

    expect(result).to.have.all.keys([
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

    expect(result1.payload).to.deep.equal({foo: "bar", bar: 123});
    expect(result2.payload).to.deep.equal({foo: "foo", bar: 123});
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

    expect(result1.params).to.deep.equal({foo: "bar", bar: 123});
    expect(result2.params).to.deep.equal({foo: "foo", bar: 123});
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

    expect(result1.store).to.equal("store2");
    expect(result1.type).to.equal("bar");
    expect(result2.store).to.equal("store4");
    expect(result2.type).to.equal("foo");
    expect(result3.store).to.be.null;
    expect(result3.type).to.be.null;
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

    expect(result1.partial).to.equal("bar");
    expect(result2.partial).to.equal("foo");
    expect(result3.partial).to.be.null;
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

    expect(result1.fragments).to.have.members(["foo", "bar", "nop"]);
    expect(result2.fragments).to.have.members(["foo", "nop"]);
    expect(result3.fragments).to.deep.equal([]);
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

      expect(result1.actions).to.have.all.keys([
        "invalidate",
        "get",
        "create",
        "post",
        "update",
        "put",
        "delete",
        "pull"
      ]);
      expect(result1.actions.pull).to.equal(123);
      expect(result1.actions.update).to.equal(321);
      expect(result1.actions.delete).to.equal(456);

      expect(result2.actions).to.have.all.keys([
        "invalidate",
        "get",
        "create",
        "post",
        "update",
        "put",
        "delete"
      ]);
      expect(result2.actions.update).to.equal(123);
      expect(result2.actions.delete).to.equal(789);

      expect(result3.actions).to.have.all.keys([
        "invalidate",
        "get",
        "create",
        "post",
        "update",
        "put",
        "delete"
      ]);
      expect(result3.actions.invalidate).to.be.a('function');
      expect(result3.actions.get).to.be.a('function');
      expect(result3.actions.create).to.be.a('function');
      expect(result3.actions.post).to.be.a('function');
      expect(result3.actions.update).to.be.a('function');
      expect(result3.actions.put).to.be.a('function');
      expect(result3.actions.delete).to.be.a('function');
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

      expect(result1.actions).to.have.all.keys([
        "delete"
      ]);
      expect(result1.actions.delete).to.equal(456);

      expect(result2.actions).to.have.all.keys([
        "invalidate",
        "get",
        "create",
        "post",
        "update",
        "put",
        "delete"
      ]);
      expect(result2.actions.update).to.equal(123);
      expect(result2.actions.delete).to.equal(789);
    });

    it("should throw an error on invalid", function() {
      expect(function() {
        StackReducer([
          {__type: "dataset", __definition: {actions: 123}},
          {__type: "dataset", __definition: {onlyActions: {delete: 456}}}
        ]);
      }).to.throw(TypeError, "was not an object, but of type");

      expect(function() {
        StackReducer([
          {__type: "dataset", __definition: {onlyActions: {pull: 123, update: 321}}},
          {__type: "store", __definition: {actions: "update"}}
        ]);
      }).to.throw(TypeError, "was not an object, but of type");
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

      expect(result1.id).to.equal("321");
      expect(result2.id).to.equal("321");
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

      expect(result1.id).to.equal(undefined);
      expect(result2.id).to.equal(undefined);
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

      expect(result1.event).to.equal("change:321");
      expect(result2.event).to.equal("change");
    });
  });

  describe("reduce definiton paramMap", function() {
    it("should correctly merge and resolve", function() {
      it("with no scope change", function() {
        var result = StackReducer([
          {__type: "dataset", __definition: {paramId: "foo"}},
          {__type: "dataset", __definition: {paramMap: {foo: "bar"}}},
          {__type: "dataset", __definition: {paramMap: {foo: "baz"}}},
          {__params: {foo: 123, bar: 321, baz: 987}}
        ]);

        expect(result.id).to.equal("987");
      });

      it("across a scope change", function() {
        var result1 = StackReducer([
            {__type: "dataset", __definition: {paramId: "foo"}},
            {__type: "dataset", __definition: {paramMap: {foo: "bar"}}},
            {__type: "store", __definition: {paramMap: {foo: "baz"}}},
            {__params: {foo: 123, bar: 321, baz: 987}}
          ])
          , result2 = StackReducer([
            {__type: "dataset", __definition: {paramId: "foo"}},
            {__type: "dataset", __definition: {paramMap: {foo: "bar"}}},
            {__type: "store", __definition: {paramMap: {foo: "baz"}}},
            {__type: "dataset", __definition: {paramId: "foo"}},
            {__params: {foo: 123, bar: 321, baz: 987}}
          ]);

        expect(result1.id).to.equal(undefined);
        expect(result2.id).to.equal(123);
      });
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

      expect(result1.path).to.equal("/foo/987/bar/321");
      expect(result2.path).to.equal("/foo/321/bar/321");
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

      expect(result1.partial).to.equal("bar");
      expect(result2.partial).to.equal("foo");
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

      expect(result1.fragments).to.deep.equal(["baz", "bar", "foo"]);
      expect(result2.fragments).to.deep.equal(["bar", "foo"]);
    });
  });

  describe("reduce definiton uri", function() {
    it("should correctly concat and resolve", function() {
      var result1 = StackReducer([
          {__type: "dataset", __definition: {uri: "/foo"}},
          {__type: "dataset", __definition: {uri: "/:foo"}},
          {__type: "dataset", __definition: {uri: "/bar/:bar"}},
          {__params: {foo: 123, bar: 321}}
        ])
        , result2 = StackReducer([
          {__type: "dataset", __definition: {uri: "/foo/:foo"}},
          {__type: "store", __definition: {uri: "/bar/:bar"}},
          {__params: {foo: 123, bar: 321}}
        ]);

      expect(result1.path).to.equal("/foo/123/bar/321");
      expect(result2.path).to.equal("/foo/123/bar/321");
    });
  });

  describe("setting utils hostname", function() {
    after(function() {
      utils.hostname = "";
    });

    it("should affect uri", function() {
      var result_before = StackReducer([
          {__type: "dataset", __definition: {paramId: "foo"}},
          {__type: "dataset", __definition: {paramMap: {foo: "bar"}}},
          {__type: "dataset", __definition: {paramMap: {foo: "baz"}}},
          {__type: "dataset", __definition: {uri: "/foo/:foo"}},
          {__type: "dataset", __definition: {uri: "/bar/:bar"}},
          {__params: {foo: 123, bar: 321, baz: 987}}
        ]);

      utils.hostname = "http://foobar.com";

      var result_after = StackReducer([
          {__type: "dataset", __definition: {paramId: "foo"}},
          {__type: "dataset", __definition: {paramMap: {foo: "bar"}}},
          {__type: "store", __definition: {paramMap: {foo: "baz"}}},
          {__type: "dataset", __definition: {uri: "/foo/:foo"}},
          {__type: "store", __definition: {uri: "/bar/:bar"}},
          {__params: {foo: 123, bar: 321, baz: 987}}
        ]);

      expect(result_before.path).to.equal("/foo/987/bar/321");
      expect(result_after.path).to.equal("http://foobar.com/foo/321/bar/321");
    });
  });
});
