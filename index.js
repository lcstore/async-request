var URLParser = require('url')

const KEY_REQUEST_PROXY = 'XX-REQUEST-PROXY'

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
  	   console.log(domain+',err:'+err+',channel:'+JSON.stringify(oChannel))
       if(oChannel) {
       	  options.proxy = 'http://' + oChannel.host + ':' + oChannel.port
       }
       return request.Requestmgr.request(options,(error, response, body) =>{
       	 if(options.proxy) {
       	 	if(error) {
       	 		error[KEY_REQUEST_PROXY] = options.proxy
       	 	} else if (response) {
				response.headers = response.headers || {}
				response.headers[KEY_REQUEST_PROXY] = options.proxy
       	 	}
		 }
       	 return callback(error,response,body)
       })
  })
}

module.exports = request
request.Requestmgr = require('./requestmgr')
request.Channelmgr = require('./channelmgr')