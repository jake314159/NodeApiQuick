var api = require('../lib/ApiQuick').init(8080);
var endpoints = {};
endpoints.date = function(req, cb) {
	cb(null, {date: new Date().toISOString()});
};
api.addEndpoints(endpoints);

// Auth example using curl ("user:pass")
// curl -H "Authorization: dXNlcjpwYXNz" 127.0.0.1:8080/date/now
var credentials = {'user1': 'test','user2':['pass', 'word']}
api.authByJson(credentials);
