var api = require('./lib/NodeApiQuick');
api.init(8080);
api.addPackage('date', {
	'now': function(method, arg, params) {
		var currentDate = new Date();
		return {time:currentDate.toUTCString()};
	}
});