var util = require('util')
  , Request = require('request')
  , moment = require('moment')
var AsyncId = require('./async-id').asyncId

var 

function RequestAction(options, cb) {
	var self = this;
	self.taskId = options.taskId || 0;
	self.id = makeId(self.taskId);
	self._options = options;
	self._callback = cb;
}
util.inherits(AsyncRequest, Request);

function makeId(taskId){
	var sTime =  moment().format('YYYYMMDDHHmmss');
    var sRequestId = sTime+'-'+taskId+'-'+ AsyncId.next();
    return sRequestId;
}

function put(){

}

function poll(domain){

}

module.exports = AsyncRequest