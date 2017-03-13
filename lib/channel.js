var async = require('async')
  , extend = require('extend')
  , events    = require('events')
  , util    = require('util')

var toolutils = require('./toolutils')

const KEY_PREIFIX = 'cl'
const KEY_SPLITOR = '.'
const USE_INTEVAL = 60000
const USE_NAX_LONG = 60*USE_INTEVAL
const USE_MAX_COUNT = 100
const CODE_USE_TOO_FAST = 1
const CODE_USE_TOO_LONG = 2
const CODE_USE_OUT_COUNT = 3
const STATE_CLOSE = 0
const STATE_OPEN = 1
const STATE_REQUEST = 2

function Channel(level,host,port){
   
   if(host && !isNaN(host)){
     host = toolutils.long2ip(host)
   }

   var self = this
   events.EventEmitter.call(self)


   this.level = level - 0;
   this.ctime = new Date().getTime()
   this.atime = 0
   this.host = host
   this.port = port
   this.select = 0
   this.error = 0
   this.ok = 0
   this.domain = ''

   self._firstUseTime = 0
   self._useState = STATE_CLOSE

}
util.inherits(Channel, events.EventEmitter);

Channel.prototype.channelKey = function () {
  	// cl.level.port.host
  	var self = this
  	if(self.key){
  		return self.key 
  	}
    var channelKey =  KEY_PREIFIX 
			    	 + KEY_SPLITOR + self.level
			    	 + KEY_SPLITOR + self.port
			    	 + KEY_SPLITOR + toolutils.ip2long(self.host)
    self.key = channelKey
    return self.key
}

Channel.prototype.isOpen  = function() {
  var self = this
  return STATE_OPEN === self._useState
}

Channel.prototype.open = function (callback) {
	var self = this
  if(!self.isClose()){
     var err = new Error();
     err.name = 'REOPEN'
     return self.doCallBack(err,callback)
  }
  var nowMills = new Date().getTime()
  if(self.atime + USE_INTEVAL > nowMills){
     var err = new Error();
     err.name = 'USE_TOO_FAST'
     err.code = CODE_USE_TOO_FAST
     return self.doCallBack(err,callback)
  }
  if(self._firstUseTime + USE_NAX_LONG > nowMills){
     var err = new Error();
     err.name = 'USE_TOO_LONG'
     err.code = CODE_USE_TOO_LONG
     return self.doCallBack(err,callback)
  }
  if(self._useCount > USE_MAX_COUNT){
     var err = new Error();
     err.name = 'USE_COUNT_LIMIT'
     err.code = CODE_USE_OUT_COUNT
     return self.doCallBack(err,callback)
  }
  self._useState = STATE_OPEN
  self.emit('open')
  return self.doCallBack(null,callback)

}

Channel.prototype.isRequest  = function() {
  var self = this
  return STATE_REQUEST === self._useState
}

Channel.prototype.request = function (callback) {
	var self = this
  if(self.isRequest()){
     var err = new Error();
     err.name = 'REREQUEST'
     return self.doCallBack(err,callback)
  }
  if(self._firstUseTime < 1){
    self._firstUseTime = new Date().getTime()
  }
  self._useState = STATE_REQUEST
  self.emit('request')
  return self.doCallBack(null,callback)
}

Channel.prototype.isClose  = function() {
  var self = this
  return STATE_CLOSE === self._useState
}

Channel.prototype.close = function (callback) {
	var self = this
  self._useState = STATE_CLOSE
  self.emit('close')
  return self.doCallBack(null,callback)
}

Channel.prototype.doCallBack = function (err,callback) {
  var self = this
  if(!callback) {
    if(err) {
      console.warn('channel['+self.channelKey()+'] cause:',err)  
    }
    return
  }
  return callback(err)
}

Channel.prototype.toKVProxy = function (callback) {
  var self = this
  var copyChannel = {}
  var keepKeys = ['level','ctime','atime','select','error','ok','domain']
  for (var ik = 0; ik < keepKeys.length; ik++) {
     var sKey = keepKeys[ik];
     copyChannel[sKey] = self[sKey]
  };
  var sHostNum = toolutils.ip2long(self.host)
  var pKey = 'cp.' + sHostNum + KEY_SPLITOR + port
  return callback(pKey,copyChannel)
}

module.exports = Channel

module.exports.newChannel = function (key,value) {
    if(!key){
       throw new Error('key must not be empty.')
    }
    // cl.level.port.host
    var keyArr = key.split('.')
    if(keyArr.length != 4){
       throw new Error('illegal key['+key+']')
    }
    var index = 0;
    var level = keyArr[++index]
    var port = keyArr[++index]
    var host = keyArr[++index]
    var newObj = new Channel(level,host,port)
    newObj.key = key
    if(value){
      try {
          var oValue = JSON.parse(value)
          for(var k in oValue){
            newObj[k] = oValue[k]
          }
      } catch(err) {
         console.warn('key['+key+'],illegal value['+value+']')
      }
    }
    return newObj
}
