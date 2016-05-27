var events = require('events');
var url = require('url');
var bodyParser = require('body-parser');

var middleware = require('./middleware');
var ratelimit = require('./ratelimit');
var Auth = require('./auth');

var ApiQuick = function () {};

ApiQuick.prototype = {

    /**
     * Initilizes the api server
     * @param port: An optional port for the server to listen to, default: 8080
     * @param extra: An optional dict containing extra settings for the api server
     */
    init: function(port, extra) {
        var self = this;

        this.logger = new events();
        this.middleware = new middleware();
        this.ratelimit = new ratelimit();

        // First handle the rate limits with middleware
        if(extra.rateLimit) {
            this.ratelimit.startRateLimit(extra.rateLimit);
            this.use(function (req, res, next) {
                if (!self.ratelimit.handleRateLimit(req.connection.remoteAddress)) {
                    // Rate limit reached
                    self.writeResponse({ok: false, code: 429, error: 'Rate limit reached'});
                } else {
                    next();
                }
            });
        }

        this.use(bodyParser.json());
        this.use(bodyParser.urlencoded({
            extended: true
        }));

        this.use(function(req, res, next) {
            res.removeHeader('X-Powered-By');
            next();
        });

        // Init vars
        this.routes = {};
        this.checkAuth = false;
        this.ssl = false;
        this.options = {};
        this.port = port || 8080;
        this.prettyJson = false;
        this.consoleLog = 4;  // All but debug info
        this.maxDepth = 1;

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
            if(extra.maxDepth !== undefined) {
                this.maxDepth = extra.maxDepth;
            }
            if(extra.consoleLog !== undefined) {
                this.consoleLog = extra.consoleLog;
            }
        }

        if(this.consoleLog) {
            this._startConsoleLogging(this.consoleLog);
        }

        // Create handler
        var processRequest = this.process('GET');

        // Start the server
        if(this.ssl) {
            //require('https').createServer(this.options, this.app).listen(this.port);
            require('https').createServer(this.options, processRequest).listen(this.port);
        } else {
            //require('http').createServer(this.app).listen(this.port);
            require('http').createServer(processRequest).listen(this.port);
        }

        this.logger.emit('info', 'Listening to port ' + this.port, {});

        return this;
    },

    _startConsoleLogging: function(level) {
        // Convert a string debug value to an int value for easy comparison
        switch(level) {
            case 'ERROR':
                level = 8;
                break;
            case 'WARN':
                level = 6;
                break;
            case 'INFO':
                level = 4;
                break;
            case 'DEBUG':
            case true:
                level = 2;
                break;
            default: // Leave it as it is
        }

        if(level <= 8) {
            this.logger.on('error', function(msg, data) {
                console.log('ERROR    ', new Date().toISOString(), '    ', msg, data);
            });
        }
        if(level <= 6) {
            this.logger.on('warn', function(msg, data) {
                console.log('WARN     ', new Date().toISOString(), '    ', msg, data);
            });
        }
        if(level <= 4) {
            this.logger.on('info', function(msg, data) {
                console.log('INFO     ', new Date().toISOString(), '    ', msg, data);
            });
        }
        if(level <= 2) {
            this.logger.on('debug', function(msg, data) {
                console.log('DEBUG    ', new Date().toISOString(), '    ', msg, data);
            });
        }
    },

    /**
     * Add express compatible middleware to the api server that will run for every connection
     * @param f: A function to run for every connection before it is handled by the api server
     *                 Function is given the parameters req, res, next.
     *                req: Express request object
     *                res: Express response object
     *                next: Callback function
     */
    use: function(f) {
        //this.app.use(f);
        this.middleware.add(f);
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
     * Adds a single specified endpoint to the api server
     * @deprecated: To be removed for v1.0.0
     * @param name: The first component of the endpoint url
     * @param p: The rest of the package dict
     * @param extra: Extra settings information for the provided dict
     */
    addPackage: function (name, p, extra) {
        var endPoints = {};
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
        var stack = [];
        var self = this;
        function _r(d) {
            for(var k in d) {
                stack.push(k);
                if(!d[k]) {
                    // Base case so do nothing (except pop the stack after this function has run)
                } else if(typeof d[k] == 'function') {
                    if(extra && extra.auth) {
                        d[k].auth = extra.auth;
                    }
                    self.routes['/' + stack.join('/')] = d[k];
                } else {
                    //It's a dict to recursively search deeper
                    _r(d[k]);
                }
                stack.pop();
            }
        }

        _r(route);
    },

    /**
     * Takes a request object and checks that it has a valid handler
     * Will also return the handler if one can be found
     * @param req: The request object
     * @returns: A dict with an ok & code parameter and optionally an error string or a handler function
     */
    checkParamsSupplied: function(req) {
        var endpoint = req.u.pathname;
        if(endpoint[endpoint.length-1] == '/') {
            // remove the end slash
            endpoint = endpoint.substring(0, endpoint.length-1);
        }

        var returnDict = {
            ok: false,
            code: 404,
            error: "No endpoint " + endpoint
        };

        var args = [];
        var depth = 0;

        // Look down the endpoint url until a valid handler is found
        // This is expensive when there is no handler so keep maxDepth as low as possible
        while(!returnDict.ok && depth <= this.maxDepth) {
            if(this.routes[endpoint]) {
                returnDict.ok = true;
                returnDict.handler = this.routes[endpoint];
                returnDict.handler.auth = returnDict.handler && returnDict.handler.auth
                returnDict.args = args;
                returnDict.error = undefined;
            } else {
                depth++;
                if(depth > this.maxDepth) break; // No point doing any more we have reached the limit
                var endIndex = endpoint.lastIndexOf('/');
                if(endIndex !== 0) {
                    args.unshift(endpoint.substring(endIndex+1, endpoint.length))
                    endpoint = endpoint.substring(0, endpoint.lastIndexOf('/'));
                } else {
                    break;
                }
            }
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

    checkAuthDetails: function(handler_auth, authDetails) {
        var auth = true;
        if(handler_auth) {
            auth = handler_auth(authDetails.user, authDetails.pass);
        } else if(handler_auth === false) {
            // Authentication specifically disabled for this package
        } else if(this.checkAuth) {
            auth = this.checkAuth(authDetails.user, authDetails.pass);
        }

        return auth;
    },

    /**
     * Writes the provided data into the response and closes the connection
     * @param res: Response object to write the data to
     * @param data: The data to reply with. Optionally data.code will be used as the response code and
     *                 data.error or data.msg will be used as the status message.
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
    process: function(method) {
        var self = this;
        return function(req, res) {
            try {
                self.middleware.run(req, res, function() {
                    req.u = url.parse(req.url, true);
                    if(req.method == 'GET') req.body = req.u.query;

                    var responseData = {ok: true, code: 200};

                    if(responseData.ok) {
                        responseData = self.checkParamsSupplied(req);
                        var handler = responseData.handler; // May be undefined if no handler found
                        var args = responseData.args
                    }

                    if(responseData.ok) {
                        var authDetails = Auth.decodeAuthDetails(req.headers.authorization);
                        var auth = self.checkAuthDetails(handler.auth, authDetails);

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
                                handler({method: method, args: args, body: req.body}, function(err, result) {
                                    self.writeResponse(res, result);
                                });
                            } catch(e) {
                                self.logger.emit('warn', 'Uncaught exception in handler', {e: e});
                                self.writeResponse(res, {
                                    ok: false,
                                    code: 500,
                                    error: 'Internal server error'
                                });
                            }
                        }, 0);
                    }
                });
            } catch(e) {
                // Something has gone wrong! Reply to the user with a generic error
                self.logger.emit('error', 'Uncaught exception', {e: e});
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
     * Set the server to authenticate based on a dict of valid username->password mappings
     * @param credentials: A dict of username->password mappings, the password value can be a string or a list of strings
     */
    authByJson: function(credentials) {
        return this.auth(this.authByJsonFunction(credentials))
    }
};

// Deprecated function names to be replaced in version 1.0.0
ApiQuick.prototype.getBasicHeader = ApiQuick.prototype.getHeaders;
ApiQuick.prototype.handleRateLimitHelper = function(ip) {
    return this.ratelimit.handleRateLimit(ip);
};

module.exports = new ApiQuick();
