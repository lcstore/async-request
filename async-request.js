var util = require('util')
  , events    = require('events')
  , Request = require('request')
  , moment = require('moment')
  , URLParser = require('url')
var AsyncId = require('./async-id').asyncId
Request.debug = true

function AsyncRequest(options, callback) {
	var self = this;
	self.options = options;
	self.callback = callback;
	self.domain =  URLParser.parse(options.url).hostname;
	self.id = AsyncId.next();
	self.taskId = options.taskId;
	self.creation = new Date().getTime();
	// self.requestId = makeId(options.url,self.taskId);
	events.EventEmitter.call(this);
	Requestmgr.addRequest(this);
}
util.inherits(AsyncRequest, events.EventEmitter);

function makeId(taskId){
	var sTime =  moment().format('YYYYMMDDHHmmss');
    var sRequestId = sTime+'-'+taskId+'-'+ AsyncId.next();
    return sRequestId;
}

function makeId(taskId){
	var sTime =  moment().format('YYYYMMDDHHmmss');
    var sRequestId = sTime+'-'+taskId+'-'+ AsyncId.next();
    return sRequestId;
}

function RequestFuture(){

}

module.exports = AsyncRequest