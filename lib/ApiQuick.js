
var express = require('express');
var s = require('express')
var app = module.exports = express();
var https = require('https');
var http = require('http');
var fs = require('fs');
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var ApiQuick = function () {};

ApiQuick.prototype = {

	init: function(port, extra) {
		this.packages = {};
		this.checkAuth = false;
		this.ssl = false
		this.options = {}

		if(extra) {
			if(extra.ssl) {
				this.options.key = fs.readFileSync(extra.ssl.key);
				this.options.cert = fs.readFileSync(extra.ssl.cert);
			}
		}

		app.get('/:package/:func', this.get(this));
		app.get('/:package/:func/:arg', this.get(this));
		app.post('/:package/:func', this.post(this));
		app.post('/:package/:func/:arg', this.post(this));

		if(extra && extra.ssl) {
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
					responseData = self.packages[req.params.package]['package'][req.params.func]("GET", req.params.arg, req.query)
				}
			}
			res.writeHead( code, statusMsg, header);
			return res.end(JSON.stringify(responseData));
		};
	},

	post: function(self) {
		return function(req, res) {
			responseData = "Unknown error AQ100"
			if(!self.packages[req.params.package]) {
				responseData = {"Error": "No package called "+req.params.package};
			} else if(!self.packages[req.params.package]['package']) {
				responseData = {"Error": "Package object does not exist Q101"};
			} else if(!self.packages[req.params.package]['package'][req.params.func]) {
				responseData = {"Error": "No function "+req.params.func+" in package"};
			} else {
				responseData = self.packages[req.params.package]['package'][req.params.func]("POST", req.params.arg, req.body)
			}
			
			return res.end(JSON.stringify(responseData));
			
		};
	}, 

	auth: function(f) {
		this.checkAuth = f;
	}
};

module.exports = new ApiQuick();
