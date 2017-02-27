var URLParser = require('url')
  , levelup = require('level')
  , db = levelup('./channelDB')
  , fs = require('fs')
  , async = require('async')

fs.readFile('./proxy.txt', 'utf8',(err, data) => {
  if (err) throw err;
  var lineArr = data.split('\n')
  // for (var i = 0; i < lineArr.length; i++) {
    
  // };
  async.concat(lineArr, function(line,cb){
    var unitArr = line.split('\t');
    var host = unitArr[0]
    var port = unitArr[1]
    // var key = 'cp.'+host+'.'+port;
    // cp.level.error.port.host
    var key = 'cl.1.0.'+port+'.'+host;
    // console.log('put key[',key,']');
    db.put(key,'{}',{sync:true},function(err){
        console.log('put key[',key,'],err:',err);
        return cb(null)
    })
  }, function(err, files) {
    // files is now a list of filenames that exist in the 3 directories
  });
  
});