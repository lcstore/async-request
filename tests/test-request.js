var should = require("should")
  , iconv = require('iconv-lite');
var AsyncRequest = require('../async-request');
var Channelmgr = require('../index').useChannel();

describe('Async-request', function(){
	it('Get requestId', function(endIt){
		var options = {};
		options.url = 'https://segmentfault.com/a/1190000002921481';
		options.encoding = null;
		var req = new AsyncRequest(options,function(error,response){
		   console.log('req:'+req.id)
		   req.id.should.above(0)
           endIt();
		});
		should(req.id).not.null
		req.start()
	})
	it('Get request,return 200', function(endIt){
		var headers = {
			'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
			,'Accept-Encoding':'gzip, deflate, sdch, br'
			,'Accept-Language':'zh-CN,zh;q=0.8'
			,'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
		};
		var options = {};
		options.headers = headers;
		options.gzip =true;
		options.url = 'https://segmentfault.com/a/1190000002921481';
		options.encoding = null;
		var req = new AsyncRequest(options,function(error,response){
			console.log('errorXX:'+JSON.stringify(error))
		   response.statusCode.should.eql(200)
		   var html = iconv.decode(response.body, 'UTF-8');
           console.log('response:'+response.statusCode)
           // console.log('response.headers:'+JSON.stringify(response.headers))
           var index = html.indexOf('title');
           var end = index + 50;
           end = end > html.length?html.length:end;
           var title = html.substring(index,end);
           console.log('response.html:'+html.length+',title:'+title)
           console.log('reqMills:'+req.reqMills + ',end:'+req.endMills)
           endIt();
		});
		req.start()
	})

	it('Add channel', function(endIt){
		var level = 2
		var host = '1033615407'
		var port = 8081
		Channelmgr.addChannel(level,host,port,(err)=>{
            console.log('err:'+err)
            endIt();
		})
	})
});