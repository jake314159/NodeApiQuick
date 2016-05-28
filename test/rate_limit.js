var should = require('should');
var rl = require('../lib/ratelimit');
var ratelimit = new rl();
ratelimit.startRateLimit({
	'period': 300,
	'limit': 30
});

var api = require('../lib/ApiQuick');
api.init(8080, {
	'rateLimit': {
        'period': 300,
        'limit': 30
    },
    consoleLog: 'ERROR'
});

describe('handleRateLimitHelper()', function () {
	it('Should let through normal requests', function (done) {
		api.rateLimit.rateLimitStore = {};

		var ip = '127.0.0.1';

		for(var i=0; i<30; i++) {
			var data = api.handleRateLimitHelper(ip);
			// note: false == ok
			data.should.equal(true);
		}

		done();
	});

	it('Should block if go over the limit', function (done) {
		api.rateLimit.rateLimitStore = {};

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
		api.rateLimit.rateLimitStore = {
			'clear': 1
		};

		var now = Math.floor(Date.now() / 1000);
		api.rateLimit.periodStart = now - api.rateLimit.period - 1;

		var ip = '127.0.0.1';

		should.exist(api.rateLimit.rateLimitStore['clear']);
		var data = api.handleRateLimitHelper(ip);
		should.exist(data);
		data.should.equal(true);

		// The existing rate record should have been removed as it is old now
		should.not.exist(api.rateLimit.rateLimitStore['clear']);

		done();
	});
});

describe('ratelimit module', function () {
	it('Should let through normal requests', function (done) {
		ratelimit.rateLimitStore = {};

		var ip = '127.0.0.1';

		for(var i=0; i<30; i++) {
			var data = ratelimit.handleRateLimit(ip);
			// note: false == ok
			data.should.equal(true);
		}

		done();
	});

	it('Should block if go over the limit', function (done) {
		ratelimit.rateLimitStore = {};

		var ip = '127.0.0.1';

		for(var i=0; i<30; i++) {
			var data = ratelimit.handleRateLimit(ip);
			// note: false == ok
			should.exist(data);
			data.should.equal(true);
		}

		var data = ratelimit.handleRateLimit(ip);
		should.exist(data);
		data.should.equal(false);
		done();
	});

	it('Should clear rate limit dict after time reached', function (done) {
		// Store a old record that should be removed later
		ratelimit.rateLimitStore = {
			'clear': 1
		};

		var now = Math.floor(Date.now() / 1000);
		ratelimit.periodStart = now - ratelimit.period - 1;

		var ip = '127.0.0.1';

		should.exist(ratelimit.rateLimitStore['clear']);
		var data = ratelimit.handleRateLimit(ip);
		should.exist(data);
		data.should.equal(true);

		// The existing rate record should have been removed as it is old now
		should.not.exist(ratelimit.rateLimitStore['clear']);

		done();
	});
});
