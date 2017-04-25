var util = require('util'),
	events = require('events'),
	Request = require('request'),
	moment = require('moment'),
	URLParser = require('url')
var AsyncId = require('./async-id').asyncId
	// Request.debug = true

function AsyncRequest(options, callback) {
	var self = this;
	self.optionJson(options)
	self.optionGzip(options)
	self.options = options;
	self.callback = callback;
	self.domain = URLParser.parse(options.url).hostname;
	self.id = AsyncId.next();
	self.taskId = options.taskId;
	self.initMills = new Date().getTime();

	console.log('AsyncRequest:' + JSON.stringify(options))
	events.EventEmitter.call(self)
}
util.inherits(AsyncRequest, events.EventEmitter);

AsyncRequest.prototype.start = function() {
	var self = this
	self.emit('init', self)
	self.req = Request(self.options, self.callback)
	self.req.on('request', self.onRequest.bind(self))
	self.req.on('complete', self.onComplete.bind(self))
	self.req.on('error', self.onComplete.bind(self))
}

AsyncRequest.prototype.onRequest = function(req) {
	var self = this
	self.reqMills = new Date().getTime()
}

AsyncRequest.prototype.onComplete = function(response, body) {
	var self = this
	self.endMills = new Date().getTime()
	self.emit('complete', self)
}

AsyncRequest.prototype.getHeader = function(headers, key) {
	if (!headers || !key) {
		return;
	}
	if (headers[key]) {
		return headers[key];
	}
	key = key.toLowerCase();
	return headers[key];
}

AsyncRequest.prototype.optionJson = function(options) {
	var self = this
	if (options.json) {
		return;
	}
	var headers = options.headers;
	var contentType = self.getHeader(headers, 'Content-Type');
	if (contentType && contentType.toLowerCase().indexOf('application/json') >= 0) {
		options.json = options.form ? options.form : true;
		options.form = undefined;
	}
}
AsyncRequest.prototype.optionGzip = function(options) {
	var self = this
	if (options.gzip) {
		return;
	}
	var headers = options.headers;
	if (!headers) {
		return;
	}
	var headKey = 'Accept-Encoding';
	var headVal = self.getHeader(headers, headKey);
	if (headVal && headVal.toLowerCase().indexOf('gzip') >= 0) {
		options.gzip = true;
	}
}

AsyncRequest.prototype.toContent = function(response) {
	if (!response) {
		return;
	}
	var charset;
	var oHeaders = response.headers;
	var contentType = oHeaders && oHeaders['content-type'];
	var oCharsetReg = /charset=(UTF8|UTF-8|GBK|GB2312)/i;
	if (contentType && oCharsetReg.test(contentType)) {
		charset = RegExp.$1;
	}
	var body = response.body
	var useCharset = charset || 'UTF-8';
	var html = iconv.decode(body, useCharset);
	if (!charset && html && oCharsetReg.test(html)) {
		charset = RegExp.$1;
		if (charset && charset != useCharset) {
			html = iconv.decode(body, charset);
		}
	}
	return html
}

module.exports = AsyncRequest