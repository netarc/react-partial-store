var chai = require('chai')
  , RPS = require('../lib/index')
  , expect = chai.expect;


describe("createDataset", function() {
  describe("when invoked", function() {
    describe("with no arguments", function() {
      it("should create a dataset", function() {
        var result = RPS.createDataset();
        expect(result).to.be.an.instanceof(RPS.createDataset.prototype);
      });
    });

    describe("with an invalid argument", function() {
      it("should throw an error", function() {
        expect(function() {
          RPS.createDataset(123);
        }).to.throw(Error);
      });
    });

    describe("with a definition argument", function() {
      it("should properly create a dataset", function() {
        var result = RPS.createDataset({uri: "/projects"});
        expect(result).to.be.an.instanceof(RPS.createDataset.prototype);
        expect(result.definition).to.deep.equal({uri: "/projects"});
      });

      it("should throw an error with an invalid option", function() {
        expect(function() {
          RPS.createDataset({barfoo: 123});
        }).to.throw(Error);
      });

      it("should throw an error on invalid option values", function() {
        expect(function() {
          RPS.createDataset({partial: 123});
        }).to.throw(Error);

        expect(function() {
          RPS.createDataset({fragments: 123});
        }).to.throw(Error);

        expect(function() {
          RPS.createDataset({uri: 123});
        }).to.throw(Error);

        expect(function() {
          RPS.createDataset({actions: []});
        }).to.throw(Error);
      });

      it("should not throw an error on valid option values", function() {
        expect(function() {
          RPS.createDataset({onlyActions: []});
        }).to.not.throw(Error);
      });
    });
  });
});
