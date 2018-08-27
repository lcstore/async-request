var should = require("should")
  , iconv = require('iconv-lite');
var AsyncRequest = require('../index')
  , Channelmgr = require('../channelmgr');

describe('Async-request', function(){
	it('AsyncRequest', function(endIt){
		this.timeout(20000);
		var options = {};
		options.url = 'https://segmentfault.com/a/1190000002921481';
		options.encoding = null;
		AsyncRequest(options,function(error,response){
		   console.log('AsyncRequest.response:'+JSON.stringify(response.statusCode))
           endIt();
		});
	})
	it('AsyncRequest.Proxy', function(endIt){
		this.timeout(200000);
		var options = {};
		options.url = 'https://segmentfault.com/a/1190000002921481';
		options.encoding = null;
		options.timeout = 2000;
		options.proxymgrOptions = {};
		Channelmgr.select('segmentfault.com',function(err,oChannel) {
			setTimeout(function() {
				AsyncRequest(options,function(error,response){
				   if(response) {
					 console.log('AsyncRequest.response:'+JSON.stringify(response.headers))
				   } else {
				   	 console.log('AsyncRequest.error:'+JSON.stringify(error))
				   }
		           endIt();
				});
			}, 1000);
			
		})
		
	})
});