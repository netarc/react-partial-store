var chai = require('chai')
  , createDataset = require("../lib/createDataset")
  , assert = chai.assert;


describe("createDataset", function() {
  describe("when invoked", function() {
    describe("with no arguments", function() {
      it("should create a dataset", function() {
        var dataset = createDataset();
        assert(dataset instanceof createDataset.prototype, "dataset was not instance of Dataset");
      });
    });

    describe("with an invalid argument", function() {
      it("should throw an error", function() {
        assert.throws(function(){
          createDataset(123);
        });
      });
    });

    describe("with a definition argument", function() {
      it("should properly create a dataset", function() {
        var dataset = createDataset({uri: "/projects"});
        assert(dataset instanceof createDataset.prototype, "dataset was not instance of Dataset");
        assert.deepEqual(dataset.definition, {uri: "/projects"});
      });

      it("should throw an error with an invalid option", function() {
        assert.throws(function(){
          createDataset({barfoo: 123});
        });
      });

      it("should throw an error on invalid option values", function() {
        assert.throws(function(){
          createDataset({partial: 123});
        });

        assert.throws(function(){
          createDataset({fragments: 123});
        });

        assert.throws(function(){
          createDataset({uri: 123});
        });

        assert.throws(function(){
          createDataset({actions: []});
        });

        assert.throws(function(){
          createDataset({onlyActions: []});
        });
      });
    });
  });
});
