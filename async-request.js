var util = require('util')
  , Request = require('request')
  , moment = require('moment')
var AsyncId = require('./async-id').asyncId


function AsyncRequest(options, cb) {
	var self = this;
	self.taskId = options.taskId || 0;
	self.id = makeId(self.taskId);
	Request.call(self,options,cb);
}
util.inherits(AsyncRequest, Request);

function makeId(taskId){
	var sTime =  moment().format('YYYYMMDDHHmmss');
    var sRequestId = sTime+'-'+taskId+'-'+ AsyncId.next();
    return sRequestId;
}

module.exports = AsyncRequest