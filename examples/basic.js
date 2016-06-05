var api = require('../lib/ApiQuick').init(8080);
var endpoints = {};
endpoints.date = function(req) {
	return {date: new Date().toUTCString()};
};
api.addEndpoints(endpoints);
