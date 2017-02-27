
var AsyncRequest = require('./async-request')
function Requestmgr (){
    this.sequenceQueue = [];
    this.domainMap = {};
}

Requestmgr.prototype.request = function(options,callback){
	var self = this;
    var newRequest = new AsyncRequest(options,callback);
    self.sequenceQueue.push(newRequest);
    var requestArr = self.domainMap[newRequest.domain];
    if(!requestArr){
    	requestArr = self.domainMap[newRequest.domain] = [];
    }
    requestArr.push(newRequest);
    return newRequest;
}

Requestmgr.prototype.start = function(domain){
   var curRequest;
   if(domain){
	  var requestArr = self.domainMap[domain] || [];
	  curRequest = popUsable(requestArr);
   }
   if(!curRequest){
	 curRequest = popUsable(sequenceQueue);
   }
   return curRequest;
   
}

Requestmgr.prototype.end = function(domain){

}

function popUsable(requestArr){
  if(!requestArr){
     return ;
  }
  var usable;
  while(true){
  	usable = requestArr.pop();
  	if(!usable){
  		break;
  	}
  	if(!usable.active){
        break;
  	}
  }
  return usable;
}