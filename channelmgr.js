var URLParser = require('url')
  , async = require('async')
  , extend = require('extend')


var proxyutils = require('./lib/proxyutils')
  , channelDao = require('./lib/channeldao')

const MIN_SELECT_LEVEL=1
const MAX_SELECT_LEVEL=5
function Channelmgr (){
    var self = this
    self._pools = []
    var maxCounts = [0,50,100,500,1000]
    var maxCounts = [0,50,100,500,1000]
    var incrCounts = [0,10,20,50,100]
    for (var level = MIN_SELECT_LEVEL; level < 3; level++) {
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
         var newErr = err;
         if(data) {
            newErr = new Error();
            newErr.name = 'Abort'
         }
         if(!err && !data) {
          oPool.load()
           // setImmediate(function() {
           //    oPool.load()
           // })
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
    var limit = 10
    channelDao.find(from,to,limit,(err,channelArr) => {
       console.log('load[',from,',',to,'].limit:',limit,',err:',err)
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
    channelDao.put(channel,(err) => {
       var key =  channel.host +':'+channel.port
       delete self._channelMap[key]
       return ucb(err)
    })
}

ChannelPool.prototype.select = function (domain,callback){
     var self = this
     var oChannels = self._channels
     while(oChannels.length > 0){
       var oChannel = oChannels[0]
       oChannel.open((err) => {
          if(err){
             if(err.name == 'USE_TOO_FAST') {
                return callback(null)
             } else if(err.name == 'USE_TOO_LONG' || err.name == 'USE_COUNT_LIMIT') {
                self.freeze(oChannel,(ferr) => {
                   if(!ferr) {
                      oChannels.shift()
                   }
                })
             }
          } else {
            oChannels.shift()
            oChannel.domain = domain
            oChannel.select ++
            return callback(err,oChannel)
          }
       })
     }
     return callback(null)
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

    // change level
    if(oChannel.error >= oChannel.ok + self._incrCount){
        self.incrLevel(oChannel,-1,rcb)
    } else if(oChannel.ok >= oChannel.error + self._incrCount){
        self.incrLevel(oChannel,1,rcb)
    } else {
        self._channels.push(oChannel);
        return rcb(null)
    }
}



ChannelPool.prototype.incrLevel = function(oChannel,incrNum,ccb){
    var self = this
    var newLevel = oChannel.level + incrNum
    channelDao.changeLevel(oChannel,newLevel,ccb)
}



module.exports = new Channelmgr()