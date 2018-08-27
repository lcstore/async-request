
var AsyncRequest = require('./async-request')

function Requestmgr (){
    this.taskCache = {};
    this.requestCache = {};
}

Requestmgr.prototype.request = function(options,callback){
	  var self = this;
    var req = new AsyncRequest(options,callback)
    req.on('complete', self.onRemove.bind(self))
    self.addRequest(req)
    req.start()
    return req;
}

Requestmgr.prototype.onRemove = function(req){
  var self = this
  delete self.requestCache[req.id]
  if(req.taskId) {
     var reqCache =  self.taskCache[req.taskId]
     if(reqCache) {
        delete reqCache[req.id]
     }
  }
}

Requestmgr.prototype.addRequest = function(req) {
  var self = this
  self.requestCache[req.id] = req
  if(req.taskId) {
     var reqCache =  self.taskCache[req.taskId]
     if(reqCache) {
        reqCache = self.taskCache[req.taskId] = {}
     }
     reqCache[req.id] = req
  }
}

Requestmgr.prototype.getTaskCache = function() {
  var self = this
  return self.taskCache; 
}

module.exports = new Requestmgr()