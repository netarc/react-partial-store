var chai = require('chai')
  , RPS = require('../lib/index')
  , assert = chai.assert;


describe("createDataset", function() {
  describe("when invoked", function() {
    describe("with no arguments", function() {
      it("should create a dataset", function() {
        var dataset = RPS.createDataset();
        assert(dataset instanceof RPS.createDataset.prototype, "dataset was not instance of Dataset");
      });
    });

    describe("with an invalid argument", function() {
      it("should throw an error", function() {
        assert.throws(function(){
          RPS.createDataset(123);
        });
      });
    });

    describe("with a definition argument", function() {
      it("should properly create a dataset", function() {
        var dataset = RPS.createDataset({uri: "/projects"});
        assert(dataset instanceof RPS.createDataset.prototype, "dataset was not instance of Dataset");
        assert.deepEqual(dataset.definition, {uri: "/projects"});
      });

      it("should throw an error with an invalid option", function() {
        assert.throws(function(){
          RPS.createDataset({barfoo: 123});
        });
      });

      it("should throw an error on invalid option values", function() {
        assert.throws(function(){
          RPS.createDataset({partial: 123});
        });

        assert.throws(function(){
          RPS.createDataset({fragments: 123});
        });

        assert.throws(function(){
          RPS.createDataset({uri: 123});
        });

        assert.throws(function(){
          RPS.createDataset({actions: []});
        });

        assert.throws(function(){
          RPS.createDataset({onlyActions: []});
        });
      });
    });
  });
});
