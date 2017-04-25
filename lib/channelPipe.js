var util = require('util')

var channelDao = require('./channeldao')

function ChannelPipe(name,channelPool,acceptFunc){
   this.name = name;
   this.channelPool = channelPool;
   this.acceptFunc = acceptFunc;
}

ChannelPipe.prototype.isAccept = function(domain) {
	var self = this
	if(util.isFunction(self.acceptFunc)) {
       return self.acceptFunc(domain)
	} 
	return true;
};

ChannelPipe.prototype.select = function(domain) {
};

ChannelPipe.prototype.receive = function(domain,host,port,success) {
};

ChannelPipe.prototype.load = function() {
};