var api = require('../lib/ApiQuick').init(8080);
var endpoints = {};
endpoints.date = function(req) {
	return {date: new Date().toISOString()};
};
api.addEndpoints(endpoints);
