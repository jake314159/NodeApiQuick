var api = require('../lib/ApiQuick');
api.init(8080,{
	'ssl': {
			'key':'./key.pem',
			'cert':'./cert.pem'
		}
});

var endpoints = {};
endpoints.date = function(req, cb) {
	cb(null, {date: new Date().toISOString()});
};
api.addEndpoints(endpoints);
