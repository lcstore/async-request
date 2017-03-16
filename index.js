var URLParser = require('url')
  , util = require('util')

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
       	 if(options.proxy) {
         	 	if(error) {
              error[KEY_REQUEST_PROXY] = options.proxy
         	 		error[KEY_REQUEST_PROXY_LEVEL] = oChannel ? oChannel.level : null
         	 	} else if (response) {
  				    response.headers = response.headers || {}
              response.headers[KEY_REQUEST_PROXY] = options.proxy
  				    response.headers[KEY_REQUEST_PROXY_LEVEL] = oChannel ? oChannel.level : null
         	 	}
    		 }
         request.Channelmgr.receive(error,oChannel)
         body = response ? response.body : body
       	 return callback(error,response,body)
       })
  })
}

module.exports = request
request.Requestmgr = require('./requestmgr')
request.Channelmgr = require('./channelmgr')