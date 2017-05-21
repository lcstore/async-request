var should = require("should")
  , Channel = require('../lib/channel');

describe('Channel', function(){
	it('newChannel', function(){
		var key = 'cl.1.1081.609446038'
    	var newObj = Channel.newChannel(key)
    	should(newObj).not.null
    	should(newObj.port).eql('1081')
    	should(newObj.error).not.eql(10)

		var value = '{"error":10}'
    	newObj = Channel.newChannel(key,value)
    	should(newObj.port).eql('1081')
    	should(newObj.error).eql(10)
	})

	it('newChannel,empty value', function(){
		var key = 'cl.1.1081.609446038'
    	var newObj = Channel.newChannel(key)
    	should(newObj).not.null
    	should(newObj.port).eql('1081')
    	should(newObj.error).not.eql(10)

		var value = '{}'
    	newObj = Channel.newChannel(key,value)
    	should(newObj.port).eql('1081')
    	should(newObj.error).eql(0)
	})

	it('isOpen', function(){
		var key = 'cl.1.1081.609446038'
		var value = '{"error":10}'
		newObj = Channel.newChannel(key,value)
		should(newObj.isOpen()).eql(false)
		newObj.on('open',() => {
           console.log('#open channel')
		})
		newObj.open();
		should(newObj.isOpen()).eql(true)

	})

	it('isOpen', function(){
		var key = 'cl.1.1081.609446038'
		var value = '{"error":10}'
		newObj = Channel.newChannel(key,value)
		should(newObj.isOpen()).eql(false)
		newObj.on('open',() => {
           console.log('#open channel')
		})
		newObj.open();
		should(newObj.isOpen()).eql(true)

	})
});