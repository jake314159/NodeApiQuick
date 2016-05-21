var should = require('should');

var api = require('../lib/ApiQuick');
api.init(8080, {
	'rateLimit': {
        'period': 300,
        'limit': 30
    }
})

describe('handleRateLimitHelper()', function () {
	it('Should let through normal requests', function (done) {
		api.rateLimitStore = {};

		var ip = '127.0.0.1';

		for(var i=0; i<30; i++) {
			var data = api.handleRateLimitHelper(ip);
			// note: false == ok
			data.should.equal(true);
		}

		done();
	});

	it('Should block if go over the limit', function (done) {
		api.rateLimitStore = {};

		var ip = '127.0.0.1';

		for(var i=0; i<30; i++) {
			var data = api.handleRateLimitHelper(ip);
			// note: false == ok
			should.exist(data);
			data.should.equal(true);
		}

		var data = api.handleRateLimitHelper(ip);
		should.exist(data);
		data.should.equal(false);
		done();
	});

	it('Should clear rate limit dict after time reached', function (done) {
		// Store a old record that should be removed later
		api.rateLimitStore = {
			'clear': 1
		};

		var now = Math.floor(Date.now() / 1000);
		api.rateLimit.periodStart = now - api.rateLimit.period - 1;

		var ip = '127.0.0.1';

		should.exist(api.rateLimitStore['clear'])
		var data = api.handleRateLimitHelper(ip);
		should.exist(data);
		data.should.equal(true);

		// The existing rate record should have been removed as it is old now
		should.not.exist(api.rateLimitStore['clear']);

		done();
	});
});
