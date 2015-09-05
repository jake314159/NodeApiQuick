var api = require('../lib/ApiQuick');
api.init(8080);
api.addPackage('date', 
	{
		'now': function(method, arg, params) {
			var currentDate = new Date();
			return {time:currentDate.toUTCString()};
		}
	}
);

// Auth example using curl ("user:pass")
// curl -H "Authorization: dXNlcjpwYXNz" 127.0.0.1:8080/date/now
credentials = {'user1': 'test','user2':['pass', 'word']}
api.authByJson(credentials);
