var URLParser = require('url')
  , async = require('async')
  , extend = require('extend')


var proxyutils = require('./lib/toolutils')
  , channelDao = require('./lib/channeldao')

const MIN_SELECT_LEVEL=1
const MAX_SELECT_LEVEL=5
function Channelmgr (){
    var self = this
    self._pools = []
    var maxCounts = [0,50,100,500,1000]
    var maxCounts = [0,50,100,500,1000]
    var incrCounts = [0,10,20,50,100]
    for (var level = MIN_SELECT_LEVEL; level < 2; level++) {
        self._pools.push(new ChannelPool(level,maxCounts[level],incrCounts[level]))
    }
    // reverse for concatSeries
    self._pools = self._pools.reverse();
}

Channelmgr.prototype.select = function(domain,callback){
   var self = this
   async.concatSeries(self._pools,function(oPool,ccb){
       console.log('select pool level:',oPool._level)
       oPool.select(domain,function(err,data){
         console.log('[',new Date(),'],select pool level:',oPool._level+',err:',err,',size[',oPool._channels.length,'/',oPool._maxCount,']')
         var newErr = err;
         if(data) {
            data.request((rerr) => {
               if(!rerr) {
                  newErr = new Error();
                  newErr.name = 'Abort'
               } else {
                  data = null
               }
            })
         }
         if(!err && !data) {
           // console.log('[',new Date(),']setImmediate,oPool.load')
           setImmediate(function() {
              console.log('[',new Date(),']call,oPool.load')
              oPool.load()
           })
         }
         return ccb(newErr,data)
       })
   },function(err,oRets){
      var oCell = oRets ? oRets[0] : null
      return callback(null,oCell)
   })
   
}

Channelmgr.prototype.receive = function(error,host,port,level,rcb){
    var self  = this;
   if (isNaN(level)) {
      console.log('not a level:'+level+',addr:'+host+':'+port)
      return;
   }
   var oPool = self._pools[self._pools.length - level];
   if(oPool){
      oPool.receive(error,host,port,rcb)
   }else {
     rcb('pool['+level+'] not exist')
   }
}


function ChannelPool(level,maxCount,incrCount){
    this._key = 'cl.'+level+'.'
    this._level = level
    this._maxCount = maxCount
    this._incrCount = incrCount
    this._gtKey = this._key
    this._ltKey = 'cl.'+(level+1)+'.'
    this._channels = []
    this._channelMap = {};
}

ChannelPool.prototype.load = function(callback){
    var self = this;
    var from = self._gtKey
    var to = self._ltKey
    var limit = self._maxCount - self._channels.length
    console.log('pre load[',from,',',to,'].limit:',limit)
    if(limit < 1) {
      if(callback) {
             callback(err)
       }
       return
    }
    channelDao.find(from,to,limit,(err,channelArr) => {
       console.log('load[',from,',',to,'].limit:',limit,',err:',err,',channelArr:',channelArr?channelArr.length:-1)
       if(err) {
          if(callback) {
             callback(err)
          }
          return
       }
       var nextKey = self._key
       for (var ic = 0; ic < channelArr.length; ic++) {
         var oChannel = channelArr[ic]
         var key = oChannel.host + ':' + oChannel.port
         self._channels.push(oChannel)
         self._channelMap[key] = oChannel
         nextKey = oChannel.key
       };
       self._gtKey = nextKey
       if(callback) {
          callback(err)
       }
       return
    })
}

ChannelPool.prototype.freeze = function(channel,ucb){
    var self = this
    console.log('[',new Date(),'],freeze channel:',JSON.stringify(channel))
    channelDao.put(channel,(err) => {
       var key =  channel.host +':'+channel.port
       console.log('freeze['+key+'],channel:'+JSON.stringify(channel))
       delete self._channelMap[key]
       return ucb(err)
    })
}

ChannelPool.prototype.select = function (domain,scb){
     var self = this
     var oChannels = self._channels
     if(oChannels.length < 1) {
        return scb()
     }
     function callback(err,channel){
       if(!err && channel) {
          oChannels.shift()
          channel.domain = domain
          channel.select ++
          return scb(null,channel)
       }
       if(err.name == 'USE_TOO_LONG' || err.name == 'USE_COUNT_LIMIT' 
        || (err.name == 'USE_TOO_FAST' && self._maxCount <= self._channels.length)) {
        console.log('freeze:',JSON.stringify(oChannel))
        self.freeze(oChannel,(ferr) => {
           if(!ferr) {
              oChannels.shift()
           }
           return scb()
        })
       } else {
         return scb()
       }
     }
     var oDest = null
     var oChannel = oChannels[0]
     console.log('pool.select:'+JSON.stringify(oChannel))

     oChannel.open((err) => {
        console.log('pool.select.open:'+JSON.stringify(oChannel)+',err:',err)
        return callback(err,oChannel)
     })
     
}


ChannelPool.prototype.receive = function(error,host,port,rcb){
    var self = this
    var key = host+':'+port
    var oChannel = self._channelMap[key]
    var bError = error != null
    if(!oChannel){
      console.warn('channel['+key+'] not exist,with error:'+bError )
      return rcb('channel['+key+'] not exist')
    }
    
    if(bError){
        oChannel.error++
    }else {
        oChannel.ok++
    }
    oChannel.atime = new Date().getTime()

    oChannel.close(() => {
         console.log('close,channel:',JSON.stringify(oChannel))
        if(oChannel.error >= oChannel.ok + self._incrCount){
            self.incrLevel(oChannel,-1,rcb)
        } else if(oChannel.ok >= oChannel.error + self._incrCount){
            self.incrLevel(oChannel,1,rcb)
        } else {
            self._channels.push(oChannel);
            return rcb(null)
        }
    })
    // oChannel.close()
}



ChannelPool.prototype.incrLevel = function(oChannel,incrNum,ccb){
    var self = this
    var newLevel = oChannel.level + incrNum
    channelDao.changeLevel(oChannel,newLevel,ccb)
}



module.exports = new Channelmgr()