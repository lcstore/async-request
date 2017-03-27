var URLParser = require('url')
  , util = require('util')

var Channel = require('./lib/channel')

const KEY_REQUEST_PROXY = 'REQUEST-PROXY-ADDR'
const KEY_REQUEST_PROXY_LEVEL = 'REQUEST-PROXY-LEVEL'

function request (options, callback) {
  if(options.proxymgrOptions) { 
    return channel(options,callback)
  } else {
  	return request.Requestmgr.request(options,callback)
  }
}

function channel (options, callback) {
  var domain =  URLParser.parse(options.url).hostname;
  return request.Channelmgr.select(domain,function(err,oChannel){
  	   console.log('selectChannel:'+domain+',err:'+err+',channel:'+JSON.stringify(oChannel))
       if(oChannel) {
          options.proxy = 'http://' + oChannel.host + ':' + oChannel.port
       	  options.proxyLevel = oChannel.level
       }
       return request.Requestmgr.request(options,(error, response, body) =>{
          var validateFunc = options.validate;
          if(validateFunc && util.isFunction(validateFunc)){
            try {
              error = validateFunc(error,response);
            } catch (verror){
              error = verror;
            }
          }
         var useChannel;
       	 if(options.proxy) {
         	 	if(error) {
              error[KEY_REQUEST_PROXY] = options.proxy
         	 		error[KEY_REQUEST_PROXY_LEVEL] = options.proxyLevel
         	 	} else if (response) {
  				    response.headers = response.headers || {}
              response.headers[KEY_REQUEST_PROXY] = options.proxy
  				    response.headers[KEY_REQUEST_PROXY_LEVEL] = options.proxyLevel
         	 	}
            var sMark = '://'
            var index = options.proxy.indexOf(sMark);
            var sHostPort = options.proxy.substring(index + sMark.length);
            var unitArr = sHostPort.split(':');
            var channelLevel = options.proxyLevel || 1;
            useChannel = new Channel(channelLevel, unitArr[0], unitArr[1]);
            console.info('useChannel['+ useChannel.channelKey() +'],proxy['+options.proxy+'],state:'+ error)
    		 }
         request.Channelmgr.receive(error,useChannel)
         body = response ? response.body : body
       	 return callback(error,response,body)
       })
  })
}

module.exports = request
request.Requestmgr = require('./requestmgr')
request.Channelmgr = require('./channelmgr')