var levelup = require('level')
  , extend = require('extend')
  , events    = require('events')

var db = levelup('./channelDB')
  , Channel = require('./channel')

function ChannelDao(){
  var self = this
  events.EventEmitter.call(self)
}


ChannelDao.prototype.del = function(channelKey,callback) {
	var self  = this
	db.del(channelKey,(err) => {
		if(callback) {
			callback(err)
		}
	})
	
}

ChannelDao.prototype.put = function(channel,callback) {
	var self  = this
	var keepKeys = ['level','ctime','atime','select','error','ok','domain']
	var copy = {}
	for (var i = 0; i < keepKeys.length; i++) {
		var key = keepKeys[i]
		copy[key] = channel[key]
	};
	var sKey = channel.channelKey()
	var sVal = JSON.stringify(copy)
	// console.log('sKey:'+sKey + ',sVal:'+sVal)
	db.put(sKey,sVal,(err) => {
		if(callback) {
			callback(err)
		}
	})
	
}

ChannelDao.prototype.get = function(channelKey,callback) {
	var self  = this
	db.get(channelKey,(err,value) => {
		callback(err,value)
	})
	
}

ChannelDao.prototype.find = function(from,to,limit,callback) {
	var self  = this
	var options = {}
	var options = {};
	options.gt = from
	options.lt = to
	options.limit = limit
	var channelArr = []
	var error
    db.createReadStream(options)
      .on('data', (data) => {
      	// console.log('data:'+JSON.stringify(data))
      	var newObj = Channel.newChannel(data.key,data.value)
      	// console.log('newObj:'+JSON.stringify(newObj))
        channelArr.push(newObj)
      })
      .on('error', (err) => {
        error = err
      })
      .on('close', () => {
         callback(error,channelArr);
      })
	
}

ChannelDao.prototype.changeLevel = function(channel,newLevel,callback) {
	var self = this
	if(channel.level == newLevel){
	  return doCallBack(null,callback)
	}
	var oldKey = channel.key
	channel.toKVProxy((key,value) => {
        db.get(key,(err,oldValue) => {
           if(oldValue){
           	    var oldProxy = JSON.parse(oldValue)
           	    value.ok += oldProxy.ok
				value.error += oldProxy.error
				value.select += oldProxy.select
				value.ctime = oldProxy.ctime
           }
           var sProxyVal = JSON.stringify(value)
           var newLevelKey = key.replace('cp.','cl.'+newLevel+'.')
           var delKeys = ['level','error','ok','select']
           for (var di = 0; di < delKeys.length; di++) {
           	   var delKey = delKeys[di]
           	   delete value[delKey]
           };

           var newLevelKey = key.replace('cp.','cl.'+newLevel+'.')
           var newLevelVal = JSON.stringify(value)

           db.batch().del(oldKey)
           			 .put(newLevelKey,newLevelVal)
           			 .put(key,sProxyVal)
           			 .write(function (err) { 
			            if(err){
			              console.warn('changeLevel[',oldKey,',',key,'],err:', err)
			            } else {
			              console.info('changeLevel[',oldKey,',',key,']')
			            }
			            return doCallBack(err,callback)
			         })
        })
	})
	
}

ChannelDao.prototype.addChannel = function(level,host,port,callback) {
	var self = this
	var oChannel = new Channel(level,host,port)
	var sKey = oChannel.channelKey()
    self.get(sKey,(err,value) => {
       if(value) {
       	  var err = new Error()
       	  err.name = 'IGNORE'
       	  err.message = 'exist channel['+sKey+']'
       	  return doCallBack(err,callback)
       } else {
       	  oChannel.toKVProxy((pKey,pChannel) => {
       	  	self.get(pKey,(error,value) => {
       	  		if(value) {
					var err = new Error()
					err.name = 'IGNORE'
					err.message = 'exist channel['+pKey+']'
					return doCallBack(err,callback)
       	  		} else {
       	  			return self.put(oChannel,callback)
       	  		}
       	  	})
       	  })
       }
    })
}

function doCallBack (err,callback) {
  if(!callback) {
    if(err) {
      console.warn('cause:',err)  
    }
  } else {
    return callback(err)
  }
  
}

module.exports = new ChannelDao()