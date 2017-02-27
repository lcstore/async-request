
// inet_aton
module.exports.ip2long=function(ip){
  var a = ip.split('.');
  var buf = new Buffer(4);
  for(var i = 0; i < 4; i++){
    buf.writeUInt8(a[i], i);
  }
  return buf.readUInt32BE(0);
}
// inet_ntoa
module.exports.long2ip =function (num){
  var buf = new Buffer(4);
  buf.writeUInt32BE(num, 0);

  var a = [];
  for(var i = 0; i < 4; i++){
    a[i] = buf.readUInt8(i);
  }
  return a.join('.');
}