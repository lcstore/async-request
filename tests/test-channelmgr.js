var should = require("should")
  , iconv = require('iconv-lite')
  , async = require('async')
var AsyncRequest = require('../async-request')
  , Channelmgr = require('../channelmgr')

describe('Channelmgr', function(){
	it('select a domain,do nothing', function(endIt){
		this.timeout(150000);
		 var domain = 'baidu.com'
         Channelmgr.select(domain,function(err,oCell){
			 console.log('oCell:',JSON.stringify(oCell))
	         endIt()
         })
         
	})
	it('receive,no error', function(endIt){
		this.timeout(150000);
		 var domain = 'baidu.com'
		 setTimeout(function() {
		     Channelmgr.select(domain,function(err,oCell){
		     	 var channelKey = oCell.host+':'+oCell.port
				 console.log('select:'+channelKey)
				 Channelmgr.receive(null,channelKey,function(err,oCell){
					 console.log('receive:',JSON.stringify(oCell))
			         endIt()
		         })
	         })
		 }, 1000);

	})
});