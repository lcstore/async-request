var util = require('util')
  , events    = require('events')
  , Request = require('request')
  , moment = require('moment')
  , URLParser = require('url')
var AsyncId = require('./async-id').asyncId
// Request.debug = true

function AsyncRequest(options, callback) {
	var self = this;
	self.options = options;
	self.callback = callback;
	self.domain =  URLParser.parse(options.url).hostname;
	self.id = AsyncId.next();
	self.taskId = options.taskId;
	self.initMills = new Date().getTime();
    console.log('AsyncRequest:'+ JSON.stringify(options))
	events.EventEmitter.call(self)
}
util.inherits(AsyncRequest, events.EventEmitter);

AsyncRequest.prototype.start = function () {
	var self = this
	self.emit('init',self)
	self.req = Request(self.options, self.callback)
	self.req.on('request', self.onRequest.bind(self))
	self.req.on('complete', self.onComplete.bind(self))
	self.req.on('error', self.onComplete.bind(self))
}

AsyncRequest.prototype.onRequest = function (req) {
    var self = this
    self.reqMills = new Date().getTime()
}

AsyncRequest.prototype.onComplete = function (response, body) {
	var self = this
	self.endMills = new Date().getTime()
	self.emit('complete',self)
}

module.exports = AsyncRequest