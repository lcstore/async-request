var URLParser = require('url')
  , levelup = require('level')
  , db = levelup('./channelDB')
  , fs = require('fs')
  , async = require('async')

fs.readFile('./d.out', 'utf8',(err, data) => {
  if (err) throw err;
  var lineArr = data.split('\n')
  // for (var i = 0; i < lineArr.length; i++) {
    
  // };
  async.concat(lineArr, function(line,cb){
    var unitArr = line.split('=');
    var key = unitArr[0].trim()
    var value = unitArr[1].trim()
    var sKey = key
    if(key.indexOf('cl')>=0){
       var kArr = key.split('.')
       if(kArr.length >= 5) {
          kArr.splice(2,1)
          sKey = kArr.join('.').trim()
       }
    }
    var sVal = value
    // var key = 'cp.'+host+'.'+port;
    // cp.level.error.port.host
    console.log('key:'+sKey+',sVal:'+sVal);
    db.put(sKey,sVal,{sync:true},function(err){
        console.log('put key[',sKey,'],err:',err);
        return cb(null)
    })
  }, function(err, files) {
    // files is now a list of filenames that exist in the 3 directories
  });
  
});