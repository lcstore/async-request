var should = require("should")
  , AsyncId = require('../async-id').asyncId;

describe('AsyncId', function(){
	it('1th.AsyncId should eql 0', function(){
    	AsyncId.get().should.eql(0)
	})
	it('2th.next AsyncId should eql 1', function(){
    	AsyncId.next().should.eql(1)
	})
	it('3th.next AsyncId should eql 2', function(){
    	AsyncId.next().should.eql(2)
	})
});