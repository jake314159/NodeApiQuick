
var express = require('express');
var s = require('express')
var app = module.exports = express();
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var ApiQuick = function () {};

ApiQuick.prototype = {

	init: function(port) {
		this.packages = {};
		this.checkAuth = function(user,code) {return true;}
		app.get('/:package/:func', this.get(this));
		app.get('/:package/:func/:arg', this.get(this));
		app.post('/:package/:func', this.post(this));
		app.post('/:package/:func/:arg', this.post(this));
		app.listen(port);
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
			console.log(req.headers.authorization);
			auth64 = (req.headers.authorization || ":").split(':');
			console.log(auth64)
			user = undefined;
			pass = undefined;
			if(auth64.length>=2) {
				user = new Buffer(auth64[0], 'base64').toString("ascii");
				pass = new Buffer(auth64[1], 'base64').toString("ascii");
			}

			responseData = {"error":"Unknown error AQ100"}
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
				} else {
					auth = self.checkAuth(user, pass, req.params.package, req.params.func, req.params.arg);
				}

				if(!auth) {
					res.writeHead( 401, 'Auth failed', {'content-type' : 'text/plain'})
					responseData = {"error":"Auth failed"}
				} else {
					responseData = self.packages[req.params.package]['package'][req.params.func]("GET", req.params.arg, req.query)
				}
			}
			
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
