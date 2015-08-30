var api = require('./lib/ApiQuick');
api.init(8080);
api.addPackage('date', 
	{
		'now': function(method, arg, params) {
			var currentDate = new Date();
			return {time:currentDate.toUTCString()};
		}
	}, 
	{
		'auth':function(){console.log('Alt auth'); return true;}
	}
);

// Auth example using curl ("test:test")
// curl -H "Authorization: dGVzdA:dGVzdA" 127.0.0.1:8080/date/now
api.auth(function(user,pass) {
	return pass=='test';
});
