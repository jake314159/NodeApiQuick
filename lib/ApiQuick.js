var compare = require('secure-compare');

var ApiQuick = function () {};

ApiQuick.prototype = {

	/**
	 * Initilizes the api server
	 * @param port: An optional port for the server to listen to, default: 8080
	 * @param extra: An optional dict containing extra settings for the api server
	 */
	init: function(port, extra) {
		// Set up the express server
		var express = require('express');
		var app = module.exports = express();

		var bodyParser = require('body-parser');
		app.use(bodyParser.json());       // to support JSON-encoded bodies
		app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
		  extended: true
		}));

		app.use(function(req, res, next){
			res.removeHeader('X-Powered-By');
			next();
		})

		var self = this;

		// Init vars
		this.packages = {};
		this.checkAuth = false;
		this.ssl = false
		this.rateLimit = false;
		this.options = {}
		this.port = port || 8080

		// Deal with extra settings
		if(extra) {
			if(extra.ssl && extra.ssl.key && extra.ssl.cert) {
				var fs = require('fs');
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

				// Add the rate limit middleware to run for all connections
				app.use(function(req, res, next) {
					var ip = req.connection.remoteAddress;
					if(self.handleRateLimit(ip)) {
						// No rate limit reached, the user may continue
						return next();
					} else {
						// Rate limit reached
						var responseData = {ok: false, code: 429, error: 'Rate limit reached'};
						self.writeResponse(res, responseData);
						// Don't call next() as we have closed the connection
					}
				});
			}
		}

		// Create handlers
		var getFunction = this.process('GET', function(req){return req.query})
		var postFunction = this.process('POST', function(req){return req.body})

		// Add routes
		app.get('/:package', getFunction);
		app.get('/:package/:func', getFunction);
		app.get('/:package/:func/:arg', getFunction);
		app.post('/:package', postFunction);
		app.post('/:package/:func', postFunction);
		app.post('/:package/:func/:arg', postFunction);

		// Start the server
		if(this.ssl) {
			require('https').createServer(this.options, app).listen(this.port);
		} else {
			require('http').createServer(app).listen(this.port);
		}

		return this;
	},

	addPackage: function (name, p, extra) {
		this.packages[name] = {'package': p};
		if(extra) {
			if(extra.auth) {
				this.packages[name].auth = extra.auth;
			}
		}
	},

	/**
	 *  Takes an ip address and handles the rate limit store, recording 1 api call from that ip
	 *  @param ip: IP address of the client that will be the key of the rate limit
	 *  @returns true for ALLOW and false for DENY
	 */
	handleRateLimit: function(ip) {
		if(this.rateLimit) {
			var now = Math.floor(Date.now() / 1000);
			if(now > this.rateLimit.periodStart+this.rateLimit.period) {
				// We have started a new period so clear the limit store
				this.rateLimit.periodStart = now;
				this.rateLimitStore = {}
			}

			// Check if the rate limit has been reached
			if(this.rateLimitStore[ip] && this.rateLimitStore[ip] >= this.rateLimit.limit) {
				return false;
			}

			// Increment the api call count for this ip
			if(this.rateLimitStore[ip]){
				this.rateLimitStore[ip] += 1;
			} else {
				this.rateLimitStore[ip] = 1;
			}
		}
		return true;  // All ok, the user may continue
	},

	/**
	 * Takes a request object and checks that it has a valid handler
	 * Will also return the handler if one can be found
	 * @param req: The request object
	 * @returns: A dict with an ok & code paramiter and optionally an error string or a handler function
	 */
	checkParamsSupplied: function(req) {
		var returnDict = {
			ok: true,
			code: 200
		}
		if(!this.packages[req.params.package]) {
			returnDict.ok = false;
			returnDict.code = 404;
			returnDict.error = "No package called "+req.params.package
		} else if(typeof this.packages[req.params.package].package == 'function') {
			// Single function package
			returnDict.handler = this.packages[req.params.package]['package'];
			returnDict.args = [];
			if(req.params.func) returnDict.args.push(req.params.func);
			if(req.params.arg) returnDict.args.push(req.params.arg);
		} else if(!this.packages[req.params.package]['package']) {
			returnDict.ok = false;
			returnDict.code = 501;
			returnDict.error = "Package object does not exist Q101"
		} else if(!this.packages[req.params.package]['package'][req.params.func]) {
			returnDict.ok = false;
			returnDict.code = 405;
			returnDict.error = "No function "+req.params.func+" in package"
		} else {
			returnDict.handler = this.packages[req.params.package]['package'][req.params.func];
			returnDict.args = [];
			if(req.params.arg) returnDict.args.push(req.params.arg);
		}

		return returnDict
	},

	/**
	 * Returns the headers that should be added when sending the provided data
	 * @param data: The data that the header will be sent with
	 */
	getHeaders: function(data) {
		var header = {
			'content-type' : 'application/json',
			'X-Content-Type-Options': 'nosniff',
			'X-Frame-Options': 'DENY'
		};
		if(data && data.code == 401) {
			// Message was an auth fail so we want to give a hint on how to auth
			header['WWW-Authenticate'] =  'Basic user:pass';
		}
		return header;
	},

	/**
	 * Takes the auth header string and parses it into a username and password string
	 * @param authHeader: The header string to parse
	 * @returns: A dict containing the parsed auth details in the format {user: <string>, pass: <string}
	 */
	decodeAuthDetails: function(authHeader) {
		try {
			authHeader = authHeader || ""
			var authVals = new Buffer(authHeader.replace(/^[bB]asic[ ]*/, ''), 'base64').toString("utf8").split(':');
			if(authVals.length>=2) {
				return {
					user: authVals[0],
					pass: authVals[1]
				}
			}
		} catch(e) {
			// Meh, just return an empty dict if we error
		}

		return {}
	},

	checkAuthDetails: function(package, func, arg, authDetails) {
		var auth = true;
		if(this.packages[package].auth) {
			auth = this.packages[package].auth(authDetails.user, authDetails.pass, package, func, arg);
		} else if(this.packages[package].auth === false) {
			// Authentication specifically disabled for this package
		} else if(this.checkAuth) {
			auth = this.checkAuth(authDetails.user, authDetails.pass, package, func, arg);
		}

		return auth;
	},

	/**
	 * Writes the provided data into the response and closes the connection
	 * @param res: Response object to write the data to
	 * @param data: The data to reply with. Optionally data.code will be used as the response code and
	 * 				data.error or data.msg will be used as the status message.
	 * @returns: 
	 */
	writeResponse: function(res, data) {
		var header = this.getHeaders(data);
		var statusMsg = data.error || data.msg || 'success';
		var code = data.code || 200;
		res.writeHead(code, statusMsg, header);
		return res.end(JSON.stringify(data));
	},

	/**
	 * Creates a handler for processing an incoming data packet
	 * @param method: A string indicating the type of call we will handle, eg. 'GET' or 'POST'
	 * @param getData: A function that given a request will return the provided data from the client
	 * @returns: Returns a function that takes a request and response object and replies to the client
	 */
	process: function(method, getData) {
		var self = this;
		return function(req, res) {
			try {
				var responseData = self.checkParamsSupplied(req, res);
				var handler = responseData.handler; // May be undefined if no handler found
				var args = responseData.args

				if(responseData.ok) {
					var authDetails = self.decodeAuthDetails(req.headers.authorization);
					var auth = self.checkAuthDetails(req.params.package, req.params.func, req.params.arg, authDetails);

					if(!auth) {
						responseData = {code: 401, ok: false, error: "Auth failed"};
					}
				}

				if(!responseData.ok) {
					// Reply with the error we found when checking the request
					self.writeResponse(res, responseData);
				} else {
					// If we are still ok up to here then we can let the handler respond
					setTimeout(function() {
						var functionResponseData = handler(method, args, getData(req))
						self.writeResponse(res, functionResponseData);
					}, 0);
				}
			} catch(e) {
				// Something has gone wrong! Reply to the user with a generic error
				console.log(e);
				self.writeResponse(res, {
					ok: false,
					code: 500,
					error: 'Unknown internal server error'
				});
			}
		};
	},

	/**
	 * Sets the global authentication function
	 * @param f: The function to use to authenticate requests globally
	 */
	auth: function(f) {
		this.checkAuth = f;
	},

	/**
	 * Creates a authentication function that checks if a provided username & password is in the credentials dict
	 * @param credentials: A dict of valid username->password mappings
	 * @returns: A function that takes a username and password string and returns a bool indicating if it is valid
	 */
	authByJsonFunction: function(credentials) {
		// No one may pass
		if(!credentials) return function(){return false;}

		return function(user, pass) {
			if(!credentials[user]) {
				return false;
			} else if(Array.isArray(credentials[user])) {
				var i = credentials[user].length
				while(i--) {
					if(compare(credentials[user][i], pass)) return true;
				}
				return false;
			} else {
				return compare(credentials[user], pass);
			}
		}
	},

	/**
	 * Set the server to authenticate based on a dict of valid username->password mappings
	 * @param credentials: A dict of username->password mappings, the password value can be a string or a list of stringa
	 */
	authByJson: function(credentials) {
		return this.auth(this.authByJsonFunction(credentials))
	}
};

// Deprecated function names to be replaced in version 1.0.0
ApiQuick.prototype.getBasicHeader = ApiQuick.prototype.getHeaders;

module.exports = new ApiQuick();
