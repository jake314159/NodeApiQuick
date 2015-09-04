
var ApiQuick = function () {};

ApiQuick.prototype = {

	init: function(port, extra) {

		// Call all the required modules that are only used for the init
		var express = require('express');
		var s = require('express')
		var app = module.exports = express();
		var https = require('https');
		var http = require('http');
		var fs = require('fs');
		var bodyParser = require('body-parser');
		app.use( bodyParser.json() );       // to support JSON-encoded bodies
		app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
		  extended: true
		}));
		app.use(function(req, res, next){
			res.removeHeader('X-Powered-By');
			next();
		})

		// Init vars
		this.packages = {};
		this.checkAuth = false;
		this.ssl = false
		this.rateLimit = false;
		this.options = {}

		// Deal with extra data
		if(extra) {
			if(extra.ssl && extra.ssl.key && extra.ssl.cert) {
				this.ssl = true;
				this.options.key = fs.readFileSync(extra.ssl.key);
				this.options.cert = fs.readFileSync(extra.ssl.cert);
			}
			if(extra.rateLimit) {
				this.rateLimit = {};
				this.rateLimit.period = extra.rateLimit.period || 60;
				this.rateLimit.limit = extra.rateLimit.limit || 60;
				this.rateLimit.periodStart = Math.floor(Date.now() / 1000);
				this.rateLimitStore = {}
			}
		}

		var getFunction = this.process(this, 'GET', function(req){return req.query})
		var postFunction = this.process(this, 'POST', function(req){return req.body})

		// Add routes
		app.get('/:package/:func', getFunction);
		app.get('/:package/:func/:arg', getFunction);
		app.post('/:package/:func', postFunction);
		app.post('/:package/:func/:arg', postFunction);

		// Start the server
		if(this.ssl) {
			https.createServer(this.options, app).listen(port);
		} else {
			http.createServer(app).listen(port);
		}
	},

	addPackage: function (name, p, extra) {
		this.packages[name] = {'package':p};
		if(extra) {
			if(extra.auth) {
				this.packages[name].auth = extra.auth;
			}
		}
	},

	handleRateLimit: function(req, res, ip, self) {
		if(self.rateLimit) {
			var now = Math.floor(Date.now() / 1000);
			if(now > self.rateLimit.periodStart+self.rateLimit.period) {
				self.rateLimit.periodStart = now;
				self.rateLimitStore = {}
			} else {
				if(self.rateLimitStore[ip] && self.rateLimitStore[ip] >= self.rateLimit.limit) {
					// Rate limit reached
					res.writeHead(429, '{"error":"Rate limit reached"}', {'content-type' : 'application/json'});
					return res.end(JSON.stringify({"error":"Rate limit reached"}));
				}
				if(self.rateLimitStore[ip]) self.rateLimitStore[ip] += 1;
				else 						self.rateLimitStore[ip] = 1;
			}
		}
		return false;
	},

	checkParamsSupplied: function(req, res, self) {
		code = 200
		if(!self.packages[req.params.package]) {
			code = 404;
			responseData = {"Error": "No package called "+req.params.package};
		} else if(!self.packages[req.params.package]['package']) {
			code = 501;
			responseData = {"Error": "Package object does not exist Q101"};
		} else if(!self.packages[req.params.package]['package'][req.params.func]) {
			code = 405;
			responseData = {"Error": "No function "+req.params.func+" in package"};
		}
		if(code != 200) {
			return {'code':code, 'data':responseData}
		} else {
			return false;
		}
	},

	getBasicHeader: function() {
		return 	{
					'content-type' : 'application/json',
					'X-Content-Type-Options': 'nosniff',
					'X-Frame-Options': 'DENY'
				}
	},

	decodeAuthDetails: function(authHeader) {
		var authVals = new Buffer(authHeader || "", 'base64').toString("ascii").split(':');
		if(authVals.length>=2) {
			return {
				user: authVals[0],
				pass: authVals[1]
			}
		}
		return {}
	},

	checkAuthDetails: function(package, func, arg, authDetails, self) {
		auth = true;
		if(self.packages[package].auth) {
			auth = self.packages[package].auth(authDetails.user, authDetails.pass, package, func, arg);
		} else if(self.checkAuth) {
			auth = self.checkAuth(authDetails.user, authDetails.pass, package, func, arg);
		}

		return auth;
	},

	process: function(self, method, getData) {
		return function(req, res) {
			var ip = req.connection.remoteAddress;

			var returnValue = self.handleRateLimit(req, res, ip, self);
			if(returnValue) return returnValue;

			code = 200;
			statusMsg = "Success";
			header = self.getBasicHeader();

			var authDetails = self.decodeAuthDetails(req.headers.authorization)

			var responseData = {"error":"Unknown error Q100"}

			returnValue = self.checkParamsSupplied(req, res, self);
			if(returnValue) {
				code = returnValue.code
				responseData = returnValue.data;
			} else {

				var auth = self.checkAuthDetails(req.params.package, req.params.func, req.params.arg, authDetails, self);

				if(!auth) {
					code = 401;
					statusMsg = 'Auth failed';
					responseData = {"error":"Auth failed"};
					header['WWW-Authenticate'] =  'Basic user:pass';
				} else {
					setTimeout(function(){
						responseData = self.packages[req.params.package]['package'][req.params.func](method, req.params.arg, getData(req))
						res.writeHead( code, statusMsg, header);
						return res.end(JSON.stringify(responseData));
					}, 0);
				}
			}
			if(code != 200) {
				res.writeHead( code, statusMsg, header);
				return res.end(JSON.stringify(responseData));
			} //If 200 then the async function will return things
		};
	},

	auth: function(f) {
		this.checkAuth = f;
	},

	authByJsonFunction: function(credentials) {
		// No one may pass
		if(!credentials) return function(){return false;}

		return function(user, pass) {
			return credentials[user] && credentials[user] == pass
		}
	},

	authByJson: function(credentials) {
		return this.auth(this.authByJsonFunction(credentials))
	}
};

module.exports = new ApiQuick();
