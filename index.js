var URLParser = require('url'),
  ToolUtils = require('./lib/toolutils'),
  extend = require('extend'),
  util = require('util')

var Channel = require('./lib/channel')


function request(options, callback) {
  if (options.proxymgrOptions) {
    return channel(options, callback)
  } else {
    return request.Requestmgr.request(options, callback)
  }
}

function get(callback, url, options) {
  var newOptions = extend({}, options);
  newOptions.url = url;
  newOptions.method = 'GET';
  return request(newOptions, (err, response) => {
    var body = response ? response.body : null;
    return callback(err, response, body)
  });
}

function post(callback, url, options, forms) {
  var newOptions = extend({}, options);
  newOptions.url = url;
  newOptions.method = 'POST';
  newOptions.form = forms;
  return request(newOptions, (err, response) => {
    var body = response ? response.body : null;
    return callback(err, response, body)
  });
}

function channel(options, callback) {
  var domain = URLParser.parse(options.url).hostname;
  return request.useChannel().select(domain, function(err, oChannel) {
    console.log('selectChannel:' + domain + ',err:' + err + ',channel:' + JSON.stringify(oChannel))
    if (oChannel) {
      options.proxy = 'http://' + oChannel.host + ':' + oChannel.port
      options.proxyLevel = oChannel.level
    }
    return request.Requestmgr.request(options, (error, response, body) => {
      
      var useChannel;
      if (options.proxy) {
        var sMark = '://'
        var index = options.proxy.indexOf(sMark);
        var sHostPort = options.proxy.substring(index + sMark.length);
        var unitArr = sHostPort.split(':');
        var channelLevel = options.proxyLevel || 1;
        useChannel = new Channel(channelLevel, unitArr[0], unitArr[1]);
        console.info('useChannel[' + useChannel.channelKey() + '],proxy[' + options.proxy + '],state:' + error)
      }
      request.useChannel().receive(error, useChannel)
      body = response ? response.body : body
      return callback(error, response, body)
    })
  })
}

request.get = get
request.post = post

request.useChannel = function(channelmgr) {
  if(!channelmgr &&  request._channel) {
    return request._channel
  }else {
    request._channel = channelmgr || new request.Channelmgr();
  }
  return request._channel
}
module.exports = request
request.Requestmgr = require('./requestmgr')
request.Channelmgr = require('./channelmgr')