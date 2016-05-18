var should = require('should');

var api = require('../lib/ApiQuick');
api.init(8080, {
	'rateLimit': {
        'period': 300,
        'limit': 30
    }
})


// TODO: The method of indicating a rate limit hit is BAD and I should feel bad (I do)
describe('handleRateLimit()', function () {
	it('Should let through normal requests', function (done) {
		api.rateLimitStore = {};

		var ip = '127.0.0.1';
		var req = {};
		var res = {
			writeHead: function(){},
			end: function(){
				true.should.equal(false, "Limit reached when it shouldn't have been")
			}
		};


		for(var i=0; i<30; i++) {
			var data = api.handleRateLimit(req, res, ip);
			// note: false == ok
			data.should.equal(false);
		}

		done();
	});

	it('Should block if go over the limit', function (done) {
		api.rateLimitStore = {};

		var ip = '127.0.0.1';
		var req = {};
		var res = {
			writeHead: function(){},
			end: function(){
				true.should.equal(false, "Limit reached when it shouldn't have been")
			}
		};


		for(var i=0; i<30; i++) {
			var data = api.handleRateLimit(req, res, ip);
			// note: false == ok
			should.exist(data);
			data.should.equal(false);
		}

		res.end = function() {
			// We wanted this to fail so mark as success
			done();
		}

		var data = api.handleRateLimit(req, res, ip);
	});

	it('Should clear rate limit dict after time reached', function (done) {
		// Store a old record that should be removed later
		api.rateLimitStore = {
			'clear': 1
		};

		var now = Math.floor(Date.now() / 1000);
		api.rateLimit.periodStart = now - api.rateLimit.period - 1;

		var ip = '127.0.0.1';
		var req = {};
		var res = {
			writeHead: function(){},
			end: function(){
				true.should.equal(false, "Limit reached when it shouldn't have been")
			}
		};

		should.exist(api.rateLimitStore['clear'])
		var data = api.handleRateLimit(req, res, ip);
		should.exist(data);
		data.should.equal(false);

		// The existing rate record should have been removed as it is old now
		should.not.exist(api.rateLimitStore['clear']);

		done();
	});
});

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
