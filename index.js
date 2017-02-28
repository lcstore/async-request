var Request = require('request')
  , iconv = require('iconv-lite')
  , URLParser = require('url')
  , async = require('async')

var Channelmgr = require('./channelmgr')

function loadBaidu (sUrl,oCell,cb) {
	    var headers = {
			'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
			,'Accept-Encoding':'gzip, deflate, sdch, br'
			,'Accept-Language':'zh-CN,zh;q=0.8'
			,'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
		};
		var options = {};
		options.headers = headers;
		options.gzip =true;
		options.url = sUrl;
		options.encoding = null;
		if(oCell){
			options.proxy = 'http://'+oCell.host+':'+oCell.port;
		}
		Request(options,function(error,response){
			   if(error){
			   	  return cb(error,oCell)
			   }
		   	  if(response.statusCode != 200){
		   	  	 error = new Error();
		   	  	 error.name = 'CodeErr'
		   	  	 error.message = 'code='+response.statusCode;
		   	  }else {
		   	  	  var charset;
		          var oHeaders = response.headers;
		          var contentType = oHeaders && oHeaders['content-type'];
		          var oCharsetReg = /charset=(UTF8|UTF-8|GBK|GB2312)/i;
		          if(contentType && oCharsetReg.test(contentType)){
		            charset = RegExp.$1;
		          }
		          var body = response.body;
		          var useCharset = charset || 'UTF-8';
		          var html = iconv.decode(response.body, useCharset);
		          if(!charset && html && oCharsetReg.test(html)){
		              charset = RegExp.$1;
		              if(charset && charset != useCharset){
		                  html = iconv.decode(body, charset);
		              }
		              var bPass = false;
		              if(html.indexOf('http://tieba.baidu.com/') > 0 
		              	|| html.indexOf('https://zhidao.baidu.com/') >0
		              	|| html.indexOf('http://news.baidu.com/') > 0 ) {
						bPass = true;
		              }
		              if(!bPass) {
		              	error = new Error()
		              	error.name = 'BadHtml'

						var index = html.indexOf('title');
						var end = index + 50;
						end = end > html.length?html.length:end;
						var title = html.substring(index,end);
						console.log('response.html:'+html.length+',title:'+title)
		              }
		          }
		   	  }
              return cb(error,oCell)
		});
}
var urls = [];
urls.push('https://www.baidu.com/')
urls.push('http://news.baidu.com/')
urls.push('http://v.baidu.com/')
urls.push('http://music.baidu.com/')
urls.push('http://wenku.baidu.com/')
urls.push('https://baike.baidu.com/')
urls.push('http://image.baidu.com/')
var count = 0;
function doLoads(urls){
	async.concat(urls,function(sUrl,ucb){
		var domain = URLParser.parse(sUrl).hostname
		Channelmgr.select(domain,function(err,oCell){
			console.log('domain:',domain,',cell:'+JSON.stringify(oCell))
			loadBaidu(sUrl,oCell,function(error,oData){
			   console.log('url:',sUrl,',oData:',JSON.stringify(oData),',error:',error)
			   if(!oData){
			   	  return ucb(null)
			   }
			   Channelmgr.receive(error,oData.host,oData.port,oData.level,function(err){
				   return ucb(null)
		       })
			   
			})
		})
	},function(err,rets){
		
	})
}
setInterval(function(){
	count++;
    console.log("count:"+count+',run doLoads');
    doLoads(urls)
},1000);