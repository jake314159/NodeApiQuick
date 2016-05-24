var compare = require('secure-compare');
var events = require('events');
var url = require('url');

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
		this.app = module.exports = express();
		var ok = true;  // TODO: Set this to false if there is an error

		this.middleware = [];

		var bodyParser = require('body-parser');
		this.use(bodyParser.json());       // to support JSON-encoded bodies
		this.use(bodyParser.urlencoded({     // to support URL-encoded bodies
		  extended: true
		}));

		this.app.use(function(req, res, next) {
			res.removeHeader('X-Powered-By');
			next();
		});

		// Init vars
		this.packages = {};
		this.checkAuth = false;
		this.ssl = false
		this.rateLimit = false;
		this.options = {}
		this.port = port || 8080
		this.prettyJson = false;
		this.consoleLog = 4;  // All but debug info

		this.logger = new events();

		// Deal with extra settings
		if(extra) {
			if(extra.ssl && extra.ssl.key && extra.ssl.cert) {
				var fs = require('fs');
				this.ssl = true;
				this.options.key = fs.readFileSync(extra.ssl.key);
				this.options.cert = fs.readFileSync(extra.ssl.cert);
			}
			if(extra.prettyJson !== undefined) {
				this.prettyJson = extra.prettyJson;
			}
			if(extra.consoleLog !== undefined) this.consoleLog = extra.consoleLog;
			if(extra.rateLimit) {
				this.startRateLimit(extra.rateLimit);
			}
		}

		if(this.consoleLog) {
			// Convert a string debug value to an int value for easy comparison
			switch(this.consoleLog) {
				case 'ERROR':
					this.consoleLog = 8;
					break;
				case 'WARN':
					this.consoleLog = 6;
					break;
				case 'INFO':
					this.consoleLog = 4;
					break;
				case 'DEBUG':
				case true:
					this.consoleLog = 2;
					break;
				default: // Leave it as it is
			}

			if(this.consoleLog <= 8) {
				this.logger.on('error', function(msg, data) {
					console.log('ERROR    ', new Date().toISOString(), '    ', msg, data);
				});
			}
			if(this.consoleLog <= 6) {
				this.logger.on('warn', function(msg, data) {
					console.log('WARN     ', new Date().toISOString(), '    ', msg, data);
				});
			}
			if(this.consoleLog <= 4) {
				this.logger.on('info', function(msg, data) {
					console.log('INFO     ', new Date().toISOString(), '    ', msg, data);
				});
			}
			if(this.consoleLog <= 2) {
				this.logger.on('debug', function(msg, data) {
					console.log('DEBUG    ', new Date().toISOString(), '    ', msg, data);
				});
			}
		}

		// Create handlers
		var getFunction = this.process('GET', function(req){return req.query})
		var postFunction = this.process('POST', function(req){return req.body})

		// Add routes
		this.app.get('/:package', getFunction);
		this.app.get('/:package/:func', getFunction);
		this.app.get('/:package/:func/:arg', getFunction);
		this.app.post('/:package', postFunction);
		this.app.post('/:package/:func', postFunction);
		this.app.post('/:package/:func/:arg', postFunction);

		// Start the server
		if(this.ssl) {
			require('https').createServer(this.options, this.app).listen(this.port);
		} else {
			//require('http').createServer(this.app).listen(this.port);
			require('http').createServer(getFunction).listen(this.port);
		}

		if(ok) {
			this.logger.emit('info', 'Listening to port ' + this.port, {});
		} else {
			// TODO: Pass in exception object
			this.logger.emit('error', 'Error in init(), unable to start server', {});
		}

		return this;
	},

	/**
	 * Add express compatible middleware to the api server that will run for every connection
	 * @param f: A function to run for every connection before it is handled by the api server
	 * 				Function is given the parameters req, res, next.
	 *				req: Express request object
	 *				res: Express response object
	 *				next: Callback function
	 */
	use: function(f) {
		this.app.use(f);
		this.middleware.push(f);
	},

	/**
	 * Add a listened for api server events
	 * @params type: Type of event to listen for ('error', 'warn', 'info', 'debug')
	 */
	on: function(type, f) {
		type = type.toLowerCase(type);
		this.logger.on(type, f);
	},

	/**
	 * Starts the rate limiter for all connections
	 * @param settings: Dict of rate limit settings or false to disable rate limiting
	 */
	startRateLimit: function(settings) {
		if(settings === undefined || settings === true) {
			settings = {}; // Default settings
		} else if(!settings) {
			this.rateLimit = undefined;
			return;
		}

		this.rateLimit = {};
		this.rateLimit.period = settings.period || 60;
		this.rateLimit.limit = settings.limit || 60;
		this.rateLimit.periodStart = Math.floor(Date.now() / 1000);
		this.rateLimitStore = {}
	},

	/**
	 * Adds a single specified endpoint to the api server
	 * @deprecated: To be removed for v1.0.0
	 * @param name: The first component of the endpoint url
	 * @param p: The rest of the package dict
	 * @param extra: Extra settings information for the provided dict
	 */
	addPackage: function (name, p, extra) {
		var endPoints = {}
		endPoints[name] = p;
		this.addEndpoints(endPoints, extra);
	},

	/**
	 * Takes a potentially multi-layer dict of functions and adds them as endpoints to the api server
	 * Replaces addPackage
	 * @param route: A potentially multi-layer dict of functions
	 * @param extra: An optional dict of options to apply to the provided endpoints
	 */
	addEndpoints: function(route, extra) {
		for(var key in route) {
			this.packages[key] = {'package': route[key]};
			if(extra) {
				if(extra.auth) {
					this.packages[key].auth = extra.auth;
				}
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
				this.logger.emit('debug', 'Rate limit reached', {ip: ip, count: this.rateLimitStore[ip]});
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
	 * @returns: A dict with an ok & code parameter and optionally an error string or a handler function
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
	 */
	checkParamsSupplied: function(req, path) {
		req.params = {}; // TODO: this is temporary
		var pack = path.shift();
		var func = path.shift();

		var returnDict = {
			ok: true,
			code: 200
		}
		if(!this.packages[pack]) {
			returnDict.ok = false;
			returnDict.code = 404;
			returnDict.error = "No package called " + pack
		} else if(typeof this.packages[pack].package == 'function') {
			// Single function package
			returnDict.handler = this.packages[pack]['package'];
			returnDict.handler.auth = this.packages[pack].auth // Add it to the handler
			returnDict.args = path;
			if(func) returnDict.args.unshift(func);
			//if(req.params.arg) returnDict.args.push(req.params.arg);
		} else if(!this.packages[pack]['package']) {
			returnDict.ok = false;
			returnDict.code = 501;
			returnDict.error = "Package object does not exist Q101"
		} else if(!this.packages[pack]['package'][func]) {
			returnDict.ok = false;
			returnDict.code = 405;
			returnDict.error = "No function "+req.params.func+" in package"
		} else {
			returnDict.handler = this.packages[pack]['package'][func];
			returnDict.handler.auth = this.packages[pack].auth // Add it to the handler
			returnDict.args = path;
			//if(req.params.arg) returnDict.args.push(req.params.arg);
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
			this.logger.emit('info', 'Unable to decode authentication details', {e: e});
		}

		return {}
	},

	checkAuthDetails: function(handler_auth, func, arg, authDetails) {
		var auth = true;
		if(handler_auth) {
			auth = handler_auth(authDetails.user, authDetails.pass, 'package', func, arg);
		} else if(handler_auth === false) {
			// Authentication specifically disabled for this package
		} else if(this.checkAuth) {
			auth = this.checkAuth(authDetails.user, authDetails.pass, 'package', func, arg);
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
		if(!data) data = '' + data;
		var header = this.getHeaders(data);
		var statusMsg = data.error || data.msg || 'success';
		var code = data.code || 200;
		var data_string = '';
		if(this.prettyJson) {
			data_string = JSON.stringify(data, null, 2);
		} else {
			data_string = JSON.stringify(data);
		}

		this.logger.emit('info', 'Making ' + code + ' response', data);

		res.writeHead(code, statusMsg, header);
		return res.end(data_string);
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
			



			// TODO: Also parse the post data
			var u = url.parse(req.url, true);
			req.query = u.query;

			var path = u.pathname.split('/');
			path.shift();  // Shift of the starting ''

			try {
				var responseData = {ok: true, code: 200};

				if(!self.handleRateLimit(req.connection.remoteAddress)) {
					// Rate limit reached
					responseData = {ok: false, code: 429, error: 'Rate limit reached'};
				}

				if(responseData.ok) {
					responseData = self.checkParamsSupplied(req, path);
					var handler = responseData.handler; // May be undefined if no handler found
					var args = responseData.args
				}


// TODO: Auth details should be passed from checkParamsSupplied at some point
				if(responseData.ok) {
					var authDetails = self.decodeAuthDetails(req.headers.authorization);
					var auth = self.checkAuthDetails(handler.auth, req.params.func, req.params.arg, authDetails);

					if(!auth) {
						responseData = {code: 401, ok: false, error: "Auth failed"};
						self.logger.emit('debug', 'Authentication fail', {credentials: authDetails});
					}
				}

				if(!responseData.ok) {
					// Reply with the error we found when checking the request
					self.writeResponse(res, responseData);
				} else {
					// If we are still ok up to here then we can let the handler respond
					setTimeout(function() {
						try{
							var functionResponseData = handler(method, args, getData(req))
							self.writeResponse(res, functionResponseData);
						}catch(e) {
							self.logger.emit('warn', 'Uncaught exception in handler', {e: e});
							self.writeResponse(res, {
								ok: false,
								code: 500,
								error: 'Internal server error'
							});
						}
					}, 0);
				}
			} catch(e) {
				// Something has gone wrong! Reply to the user with a generic error
				self.logger.emit('warn', 'Uncaught exception', {e: e});
				self.writeResponse(res, {
					ok: false,
					code: 500,
					error: 'Unknown internal server error'
				});
				throw e;
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
	 * @param credentials: A dict of username->password mappings, the password value can be a string or a list of strings
	 */
	authByJson: function(credentials) {
		return this.auth(this.authByJsonFunction(credentials))
	}
};

// Deprecated function names to be replaced in version 1.0.0
ApiQuick.prototype.getBasicHeader = ApiQuick.prototype.getHeaders;
ApiQuick.prototype.handleRateLimitHelper = ApiQuick.prototype.handleRateLimit;

module.exports = new ApiQuick();
