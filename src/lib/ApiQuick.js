
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
		this.packages = {}
		app.get('/:package/:func', this.get(this));
		app.get('/:package/:func/:arg', this.get(this));
		app.post('/:package/:func', this.post(this));
		app.post('/:package/:func/:arg', this.post(this));
		app.listen(port);
	},

	addPackage: function (name, p) {
		this.packages[name] = {'package':p};
	},

	get: function(self) {
		return function(req, res) {
			responseData = "Unknown error AQ100"
			if(!self.packages[req.params.package]) {
				responseData = {"Error": "No package called "+req.params.package};
			} else if(!self.packages[req.params.package]['package']) {
				responseData = {"Error": "Package object does not exist Q101"};
			} else if(!self.packages[req.params.package]['package'][req.params.func]) {
				responseData = {"Error": "No function "+req.params.func+" in package"};
			} else {
				responseData = self.packages[req.params.package]['package'][req.params.func]("GET", req.params.arg, req.query)
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
	}
}

module.exports = new ApiQuick();
