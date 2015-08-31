
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

		// Add routes
		app.get('/:package/:func', this.get(this));
		app.get('/:package/:func/:arg', this.get(this));
		app.post('/:package/:func', this.post(this));
		app.post('/:package/:func/:arg', this.post(this));

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

	get: function(self) {
		return function(req, res) {
			var ip = req.connection.remoteAddress;

			if(self.rateLimit) {
				var now = Math.floor(Date.now() / 1000);
				if(now > self.rateLimit.periodStart+self.rateLimit.period) {
					self.rateLimit.periodStart = now;
					self.rateLimitStore = {}
				} else {
					if(self.rateLimitStore[ip] && self.rateLimitStore[ip] > self.rateLimit.limit) {
						// Rate limit reached
						res.writeHead(429, '{"error":"Rate limit reached"}', {'content-type' : 'application/json'});
						return res.end(JSON.stringify({"error":"Rate limit reached"}));
					}
					if(self.rateLimitStore[ip]) self.rateLimitStore[ip] += 1;
					else 						self.rateLimitStore[ip] = 1;
				}
			}

			code = 200;
			statusMsg = "Success";
			header = {
				'content-type' : 'application/json',
				'X-Content-Type-Options': 'nosniff',
				'X-Frame-Options': 'DENY'
			};

			res.removeHeader('X-Powered-By');

			authVals = new Buffer(req.headers.authorization || "", 'base64').toString("ascii").split(':');
			user = undefined;
			pass = undefined;
			if(authVals.length>=2) {
				user = authVals[0];
				pass = authVals[1];
			}

			var responseData = {"error":"Unknown error Q100"}
			if(!self.packages[req.params.package]) {
				code = 404;
				responseData = {"Error": "No package called "+req.params.package};
			} else if(!self.packages[req.params.package]['package']) {
				code = 501;
				responseData = {"Error": "Package object does not exist Q101"};
			} else if(!self.packages[req.params.package]['package'][req.params.func]) {
				code = 405;
				responseData = {"Error": "No function "+req.params.func+" in package"};
			} else {
				auth = true;
				if(self.packages[req.params.package].auth) {
					auth = self.packages[req.params.package].auth(user, pass, req.params.package, req.params.func, req.params.arg);
				} else if(self.checkAuth) {
					auth = self.checkAuth(user, pass, req.params.package, req.params.func, req.params.arg);
				}

				if(!auth) {
					code = 401;
					statusMsg = 'Auth failed';
					responseData = {"error":"Auth failed"};
					header['WWW-Authenticate'] =  'Basic user:pass';
				} else {
					responseData = self.packages[req.params.package]['package'][req.params.func]("GET", req.params.arg, req.query)
				}
			}
			res.writeHead( code, statusMsg, header);
			return res.end(JSON.stringify(responseData));
		};
	},

	post: function(self) {
		return function(req, res) {
			code = 200;
			statusMsg = "Success";
			header = {'content-type' : 'application/json'};

			auth64 = (req.headers.authorization || ":").split(':');
			user = undefined;
			pass = undefined;
			if(auth64.length>=2) {
				user = new Buffer(auth64[0], 'base64').toString("ascii");
				pass = new Buffer(auth64[1], 'base64').toString("ascii");
			}

			responseData = {"error":"Unknown error Q100"}
			if(!self.packages[req.params.package]) {
				responseData = {"Error": "No package called "+req.params.package};
			} else if(!self.packages[req.params.package]['package']) {
				responseData = {"Error": "Package object does not exist Q101"};
			} else if(!self.packages[req.params.package]['package'][req.params.func]) {
				responseData = {"Error": "No function "+req.params.func+" in package"};
			} else {
				auth = true;
				if(self.packages[req.params.package].auth) {
					auth = self.packages[req.params.package].auth(user, pass, req.params.package, req.params.func, req.params.arg);
				} else if(self.checkAuth) {
					auth = self.checkAuth(user, pass, req.params.package, req.params.func, req.params.arg);
				}

				if(!auth) {
					code = 401;
					statusMsg = 'Auth failed';
					responseData = {"error":"Auth failed"};
				} else {
					responseData = self.packages[req.params.package]['package'][req.params.func]("GET", req.params.arg, req.body)
				}
			}
			res.writeHead( code, statusMsg, header);
			return res.end(JSON.stringify(responseData));
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
