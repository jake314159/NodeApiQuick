
var should = require('should');
var request = require('request');

var api = require('../lib/ApiQuick');
api.init(8086, {consoleLog: 'ERROR', maxDepth: 2});
//api.init(8086);

var url_base = 'http://127.0.0.1:8086/'

describe('Server tests', function () {
	it('Single function package', function (done) {
		var p = 'package1';
		api.addPackage(p,
			function(method, arg, params) {
				return {'r': 'abc123'};
			}
		);

		request(url_base + p, function (error, response, body) {
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

	it('Multi-function package', function (done) {
		var p = 'package2';
		api.addPackage(p,
			{'f': function(method, arg, params) {
					return {'r': 'abc123'};
				}
			}
		);

		request(url_base + p  + '/f', function (error, response, body) {
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

	it('Reply to 100 requests', function (done) {
		var p = 'package3';
		api.addPackage(p,
			function(method, arg, params) {
				return {'r': 'abc123'};
			}
		);
		var count = 0;
		var num = 100;
		var start = new Date() * 1;
		for(var i=0; i<num; i++) {
			request(url_base + p, function (error, response, body) {
				should.not.exist(error);
				should.exist(response);
				should.exist(response.statusCode);
				response.statusCode.should.equal(200);
				should.exist(body);
				body = JSON.parse(body);
				should.exist(body.r, 'No response in body');
				body.r.should.equal('abc123');
				count++;
				if(count >= num) {
					// TODO: Why is our connection reset for >~250 requests
					var end = new Date() * 1;
					console.log(end-start, ' ms');
					console.log(num*1000/(end-start), ' req/s')
					done();	
				}
			});
		}
	});

	it('Non exist package', function (done) {
		request(url_base + 'not_exist', function (error, response, body) {
			should.not.exist(error);
			should.exist(response);
			should.exist(response.statusCode);
			response.statusCode.should.equal(404);
			should.exist(body);
			body = JSON.parse(body);
			should.exist(body.code);
			body.code.should.equal(404);
			done();
		})
	});

	it('Non exist function', function (done) {
		var p = 'package4';
		api.addPackage(p,
			{'f': function(method, arg, params) {
					return {'r': 'abc123'};
				}
			}
		);

		request(url_base + p + '/not_exist', function (error, response, body) {
			should.not.exist(error);
			should.exist(response);
			should.exist(response.statusCode);
			response.statusCode.should.equal(404);
			should.exist(body);
			body = JSON.parse(body);
			should.exist(body.code);
			body.code.should.equal(404);
			done();
		})
	});

	it('Function only package args', function (done) {
		var p = 'package5';
		api.addPackage(p,
			function(method, arg, params) {
				return {'args': arg};
			}
		);

		request(url_base + p + '/a/b', function (error, response, body) {
			should.not.exist(error);
			should.exist(response);
			should.exist(response.statusCode);
			response.statusCode.should.equal(200);
			should.exist(body);
			body = JSON.parse(body);
			should.exist(body.args);
			should.exist(body.args[0]);
			should.exist(body.args[1]);
			body.args[0].should.equal('a');
			body.args[1].should.equal('b');
			done();
		})
	});

	it('Multi-function package args', function (done) {
		var p = 'package6';
		api.addPackage(p,
			{'f': function(method, arg, params) {
					return {'args': arg};
				}
			}
		);

		request(url_base + p + '/f/a', function (error, response, body) {
			should.not.exist(error);
			should.exist(response);
			should.exist(response.statusCode);
			response.statusCode.should.equal(200);
			should.exist(body);
			body = JSON.parse(body);
			should.exist(body.args);
			should.exist(body.args[0]);
			should.not.exist(body.args[1]);
			body.args[0].should.equal('a');
			done();
		})
	});

	it('Fail global auth', function (done) {
		var p = 'package7';
		api.addPackage(p,
			function(method, arg, params) {
				return {'r': 'abc123'};
			}
		);
		api.auth(function() {return false;})

		request(url_base + p, function (error, response, body) {
			should.not.exist(error);
			should.exist(response);
			should.exist(response.statusCode);
			response.statusCode.should.equal(401);
			should.exist(body);
			body = JSON.parse(body);
			should.exist(body.code);
			body.code.should.equal(401);
			api.auth(false);
			done();
		});
	});

	it('Fail package auth', function (done) {
		var p = 'package8';
		api.addPackage(p,
			function(method, arg, params) {
				return {'r': 'abc123'};
			}, {
				'auth' : function() {return false;}
			}
		);

		request(url_base + p, function (error, response, body) {
			should.not.exist(error);
			should.exist(response);
			should.exist(response.statusCode);
			response.statusCode.should.equal(401);
			should.exist(body);
			body = JSON.parse(body);
			should.exist(body.code);
			body.code.should.equal(401);
			api.auth(false);
			done();
		});
	});

	it('Echo back GET params', function (done) {
		var p = 'package9';
		api.addPackage(p,
			function(method, arg, params) {
				return params;
			}
		);

		request(url_base + p + '?a=1&b=2', function (error, response, body) {
			should.not.exist(error);
			should.exist(response);
			should.exist(response.statusCode);
			response.statusCode.should.equal(200);
			should.exist(body);
			body = JSON.parse(body);

			should.exist(body.a, 'No "a" response in body');
			body.a.should.equal('1');
			should.exist(body.b, 'No "b" response in body');
			body.b.should.equal('2');
			done();
		})
	});

	it('Echo back POST params', function (done) {
		var p = 'package10';
		api.addPackage(p,
			function(method, arg, params) {
				return params;
			}
		);

		request.post({url: url_base + p, form:{'a': '3', 'b': '4'}}, function (error, response, body) {
			should.not.exist(error);
			should.exist(response);
			should.exist(response.statusCode);
			response.statusCode.should.equal(200);
			should.exist(body);
			body = JSON.parse(body);

			should.exist(body.a, 'No "a" response in body');
			body.a.should.equal('3');
			should.exist(body.b, 'No "b" response in body');
			body.b.should.equal('4');
			done();
		})
	});

});
