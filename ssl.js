var api = require('./lib/ApiQuick');
api.init(8080,{
	'ssl': {
			'key':'./key.pem',
			'cert':'./cert.pem'
		}
});

api.addPackage('date', 
	{
		'now': function(method, arg, params) {
			var currentDate = new Date();
			return {time:currentDate.toUTCString()};
		}
	}
);
