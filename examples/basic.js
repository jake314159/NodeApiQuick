var api = require('../lib/ApiQuick').init(8080);
api.addPackage('date', 
	function(method, args, params) {
		return {date: new Date().toUTCString()};
	}
);
