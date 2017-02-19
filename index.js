
module.exports = asyncRequest
asyncRequest.Request = require('request')


exports.request = function request(options, cb) {

  return http.request(options, cb);
};

exports.get = function get(options, cb) {
  var req = exports.request(options, cb);
  req.end();
  return req;
};