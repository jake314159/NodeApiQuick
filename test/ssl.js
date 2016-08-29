
var should = require('should');
var request = require('request');
var fs = require('fs');

var api = require('../lib/ApiQuick');
api.init(8087, {
	consoleLog: api.error, 
	'ssl': {
		'key':'./test/certs/server.key',
		'cert':'./test/certs/server.crt'
	}
});


var url_base = 'https://localhost:8087/'

describe('SSL Server tests', function () {
	it('Single function package', function (done) {
		var p = 'package1';
		api.addPackage(p,
			function(req, cb) {
				cb(null, {'r': 'abc123'});
			}
		);

		request({
			url: url_base + p,
			strictSSL: false,
		}, function (error, response, body) {
			should.not.exist(error);
			should.exist(response);
			should.exist(response.statusCode);
			response.statusCode.should.equal(200);
			should.exist(body);
			body = JSON.parse(body);
			should.exist(body.r, 'No response in body');
			body.r.should.equal('abc123');
			done();
		})
	});

	it('Single function package with cert verified', function (done) {
		var p = 'package1';
		api.addPackage(p,
			function(req, cb) {
				cb(null, {'r': 'abc123'});
			}
		);

		request({
			url: url_base + p,
			ca: fs.readFileSync('./test/certs/server.crt')
		}, function (error, response, body) {
			should.not.exist(error);
			should.exist(response);
			should.exist(response.statusCode);
			response.statusCode.should.equal(200);
			should.exist(body);
			body = JSON.parse(body);
			should.exist(body.r, 'No response in body');
			body.r.should.equal('abc123');
			done();
		})
	});
});