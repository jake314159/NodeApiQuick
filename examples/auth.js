var api = require('../lib/ApiQuick').init(8080);
var endpoints = {};
endpoints.date = function(req, cb) {
	cb(null, {date: new Date().toUTCString()});
};
api.addEndpoints(endpoints,
	{
		'auth':function(){return true;}
	}
);

// Auth example using curl ("user:pass")
// curl -H "Authorization: dXNlcjpwYXNz" 127.0.0.1:8080/date/now
api.auth(function(user,pass) {
	return pass=='pass';
});
