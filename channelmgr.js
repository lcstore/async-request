var URLParser = require('url')
  , levelup = require('level')
  , async = require('async')
  , extend = require('extend')

var db = levelup('./channelDB')

var proxyutils = require('./lib/proxyutils')

const MIN_SELECT_LEVEL=1
const MAX_SELECT_LEVEL=5
function Channelmgr (){
    var self = this
    self._pools = []
    var maxCounts = [0,50,100,500,1000]
    var maxCounts = [0,5000,100,500,1000]
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
       // console.log('select pool level:',oPool._level)
       oPool.select(domain,function(err,data){
         var newErr = err;
         if(data){
            newErr = new Error();
            newErr.name = 'Abort'
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
    this._channels = []
    this._gtKey = this._key
    this._ltKey = 'cl.'+(level+1)+'.'
    this._activeMap = {};
}

ChannelPool.prototype.select = function (domain,scb){
     var self = this
     var interval = 60000;
     function callback(err,oCell){
        if(oCell){
          oCell.select++
          var key = oCell.host +':'+oCell.port
          self._activeMap[key] = oCell;
        }
        return scb(err,oCell)
     }
     self.selectOne(self._channels,interval,domain,function(err,data){
          if(data){
            return callback(null,data)
          }
          var limit = self._maxCount - self._channels.length;
          if(limit < 0 ){
              console.warn('pool:',self._level,',reach max:',self._maxCount,',len:',self._channels.length)
              return callback(null)
          }
         var options = {};
         options.gt = self._gtKey
         options.lt = self._ltKey
         options.limit = limit
          self.load(options,function(error,oCells,nextKey){
            if(error) {
                console.warn('error:'+error)
                return
            }
            if(oCells.length > 0){
                self._gtKey = nextKey
                // var channelMap = {}
                // for (var ic = 0; ic < self._channels.length; ic++) {
                //     var oChannel = self._channels[ic]
                //     var cKey = oChannel.host+':'+oChannel.port
                //     channelMap[cKey] = oChannel
                // };
                // for (var io = 0; io < oCells.length; io++) {
                //     var cell = oCells[io]
                //     var cKey = cell.host+':'+cell.port
                //     if(channelMap[cKey]){
                //         continue
                //     }
                // };
                self._channels = oCells.concat(self._channels)
                self.selectOne(self._channels,interval,domain,function(err,oCell){
                    return callback(null,oCell);
                })
            }else {
                // reload ChannelPool
                return callback(null);
            }
          
          });

     })

}


ChannelPool.prototype.load = function(options,callback){
    var self = this;
    var nextKey
    var oCells = []
    db.createReadStream(options)
      .on('data', function (data) {
        nextKey = data.key
        var key = data.key
        var oValue = JSON.parse(data.value)
        // cp.level.error.port.host
        var keyArr = key.split('.')
        var index = 0;
        var level = keyArr[++index]
        var error = keyArr[++index]
        var port = keyArr[++index]
        var host = keyArr[++index]
        var oCell = new ChannelCell(key,level)
        for(var k in oValue){
            oCell[k] = oValue[k]
        }
        oCell.error = error - 0;
        oCell.host = proxyutils.long2ip(host)
        oCell.port = port
        oCells.push(oCell)
        // console.log(data.key, '=', data.value)
      })
      .on('error', function (err) {
        console.warn('load data,cause:', err)
      })
      .on('close', function () {
         console.log('load options:',JSON.stringify(options),',count:',oCells.length,',next:',nextKey || '')
         callback(null,oCells,nextKey);
      })
}

ChannelPool.prototype.selectOne = function (oLevels,interval,domain,callback){
     var self = this
     var oDest;
     while(oLevels.length > 0){
       var oCell = oLevels[0]
       if(oCell.level != self._level){
          oLevels.shift()
          continue;
       }
       var curInterval = interval;
       if(domain && domain === oCell.recent){
           curInterval = 10*interval;
          
       }
      if(oCell.atime + curInterval >= new Date().getTime()){
           break;
       }
       // 由久到近选择
       oDest = oLevels.shift()
       oDest.atime = new Date().getTime()
       oDest.domain = domain
       break;
     }
     return callback(null,oDest)
}


ChannelPool.prototype.receive = function(error,host,port,rcb){
    var self = this
    var key = host+':'+port
    var oCell = self._activeMap[key]
    var bError = error != null
    if(!oCell){
      console.warn('cell['+key+'] not exist,with error:'+bError )
      return rcb('cell['+key+'] not exist')
    }
    
    delete self._activeMap[key]

    if(bError){
        oCell.error++
    }else {
        oCell.ok++
    }
    oCell.atime = new Date().getTime()

    // change level
    if(oCell.error >= oCell.ok + self._incrCount){
        self.incrLevel(oCell,-1,rcb)
    } else if(oCell.ok > oCell.error + self._incrCount){
        self.incrLevel(oCell,1,rcb)
    } else {
        self._channels.push(oCell);
        if(oCell.select % 5 == 0){
            self.update(oCell,rcb)
        }else {
            return rcb(null)
        }
        
    }
}
ChannelPool.prototype.update = function(oCell,ucb){
    var oldKey = oCell.key
    // cp.level.error.port.host
    var keyArr = oldKey.split('.')
    var index = 2
    keyArr[index] = oCell.error
    var newKey = keyArr.join('.')

    var oCopy = extend({},oCell)
    var delKeys = ['key','level','host','port']
    for (var ik = 0; ik < delKeys.length; ik++) {
       var delKey = delKeys[ik];
       delete oCopy[delKey]
    };
    var newVal = JSON.stringify(oCopy)
    var batch = db.batch()
    if(oldKey != newKey){
        batch.del(oldKey)
    }
    batch.put(newKey,newVal)
         .write(function (err) { 
            if(err){
              console.warn('update,key[',oldKey,',',newKey,'],err:',err)
            } else {
              console.info('up key[',oldKey,',',newKey,']')
            }
            return ucb(err)
         })

}
ChannelPool.prototype.incrLevel = function(oCell,incrNum,ccb){
    var self = this
    var oldLevel = oCell.level;
    var newLevel = oldLevel + incrNum;
    newLevel = newLevel >= MAX_SELECT_LEVEL ? oldLevel : newLevel
    oCell.level  = newLevel;
    var oldKey = oCell.key
    // cp.level.error.port.host
    var keyArr = oldKey.split('.')
    var index = 0;
    

    var index = 0;
    // level
    keyArr[++index] = oCell.level
    // error
    keyArr[++index] = 0
    var port = keyArr[++index]
    var host = keyArr[++index]

    var newKey = keyArr.join('.')
    var delKeys = ['key','level','host','port']
    for (var ik = 0; ik < delKeys.length; ik++) {
       var delKey = delKeys[ik];
       delete oCell[delKey]
    };
    var pKey = 'cp.'+host+'.'+port
    db.get(pKey,function(err,value){

        var pCell;
        if(!value){
            pCell = extend({},oCell);
        } else {
            pCell = JSON.parse(value)
            pCell.ok += oCell.ok
            pCell.error += oCell.error
            pCell.select += oCell.select
            pCell.atime = oCell.atime
            pCell.domain = oCell.domain
        }
        pCell.level = newLevel

        var pVal = JSON.stringify(pCell)
        db.put(pKey,pVal,function(perr){
            if(perr){
                console.warn('put proxy[',pKey,'],to channel:',self._level,',cause:',err)
                oCell.level = oldLevel
                self._channels.push(oCell);
                return ccb(perr)
            }

            db.del(oldKey, function (err) {
              if (err) {
                console.warn('del old level[',oldKey,'],cause:',err)
              }
              oCell.ok = 0
              oCell.error = 0
              oCell.select = 0
              oCell.ctime = new Date().getTime()
              var sValue = JSON.stringify(oCell)
              db.put(newKey,sValue,function(nperr){
                 if(nperr){
                    console.warn('put new level:',newKey,',cause:',nperr)
                 }
                 return ccb(null)
              })
            });
        })
    })
    

}

function ChannelCell(key,level){
   // cp.level.error.port.host
   this.key = key;
   this.level = level - 0;
   this.ctime = new Date().getTime()
   this.atime = new Date().getTime()
   // this.host
   // this.port 
   this.select = 0
   this.error = 0
   this.ok = 0
   this.domain = ''
}

module.exports = new Channelmgr()