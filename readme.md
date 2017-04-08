# Node api-quick


Create a simple JSON based API server in as little as 6 lines with built in support for *SSL*, *Basic auth* & *rate limiting*. Capable of handling up to **2200 requests/sec** on a single core ([more info](docs/performance.md)).


[![npm](https://img.shields.io/npm/v/api-quick.svg?maxAge=2592000)](https://www.npmjs.com/package/api-quick)
[![GitHub issues](https://img.shields.io/github/issues/jake314159/NodeApiQuick.svg)](https://github.com/jake314159/NodeApiQuick/issues)
[![travis](https://travis-ci.org/jake314159/NodeApiQuick.svg?branch=travis-setup)](https://travis-ci.org/jake314159/NodeApiQuick)
[![travis](https://david-dm.org/jake314159/NodeApiQuick.svg)](https://david-dm.org/)



## Install me

Install using [npm](https://www.npmjs.com/package/api-quick) with the command

```bash
npm install api-quick --save
```

## Basic API server

Time for a quick 6 line example! The below code creates an api server that responds to the port 8080 and returns the current date-time with the url "http://127.0.0.1:8080/date".

```javascript
var api = require('api-quick').init(8080);
var endpoints = {};
endpoints.date = function() {
  return {date: new Date().toUTCString()};
};
api.addEndpoints(endpoints);
```

Doing a GET request on the above url will then return the data:

```
{"date":"Tue, 17 May 2016 17:11:07 GMT"}
```

## Multi-level endpoints


It is also possible to have a longer multi-level url path with nested Objects as shown below

```javascript
var api = require('api-quick').init(8080);
var endpoints = {
    date: {
        utc: function() {
            return {date: new Date().toUTCString()};
        },
        iso: function() {
            return {date: new Date().toISOString()};
        },
    }
};
api.addEndpoints(endpoints);
```

GET http://127.0.0.1:8080/date/utc

```
{"date":"Sat, 11 Jun 2016 15:04:55 GMT"}
```

GET http://127.0.0.1:8080/date/iso

```
{"date":"2016-06-11T15:04:55.418Z"}
```

## Parameters

Another way of allowing different date formats might be to be specified might be my using url parameters, for example:

```javascript
var api = require('api-quick').init(8080);
var endpoints = {};
endpoints.date = function(req) {
    if(req.body.format === 'utc') {
        return {date: new Date().toUTCString()};
    } else {
        return {date: new Date().toISOString()};
    }
};
api.addEndpoints(endpoints);
```

GET http://127.0.0.1:8080/date?format=utc

```
{"date":"Sat, 11 Jun 2016 15:04:55 GMT"}
```

GET http://127.0.0.1:8080/date?format=iso

```
{"date":"2016-06-11T15:04:55.418Z"}
```


## Callbacks

The handler can also return the result by taking a callback function as an argument, for example:

```javascript
var api = require('api-quick').init(8080);
var endpoints = {};
endpoints.date = function(req, callback) {
    var data = {date: new Date().toISOString()};
    callback(null, data);
};
api.addEndpoints(endpoints);
```

Note that the first argument to the callback is an optional Error object and the second is the data to return.

## URL Layout

The components of the url that are provided to your function is shown below

Example url:
```
http://127.0.0.1:8080/<:function_route:>/<:args:>?<:params:>
```

Maps to the function arguments:
```javascript
function(req, callback)
```

+ **req.method**: 'GET' or 'POST'
+ **req.args**: An array of strings for the elements of the url not used to find the handler function.
+ **req.body**: is either the url encoded parameters for GET requests or the posted data for POST requests in a JSON format.




So for the basic example above the url:

```
http://127.0.0.1:8080/date/now/utc?format=json
```

will call the handler function with the following arguments:

```javascript
{
  'date': function(req, cb) {
    console.log(req.method); // == 'GET'
    console.log(req.args); // == ['now', 'utc']
    console.log(req.body); // == {'format': 'json'}
  }
}
```

The hander function should return a json structure to return to the client.

## SSL

To use SSL simply give the paths to the key and certificate files in the initialisation data.

```javascript
var api = require('api-quick');
api.init(8080,{
    'ssl': {
        'key': './key.pem',
        'cert': './cert.pem'
    }
});
```

## Rate limits

Also included is some basic rate limit functionality, disabled by default. There are two ways of doing this...

Using the default values:

```javascript
api.init(8080, {'rateLimit': true});
```

or using your own custom values:

```javascript
api.init(8080, {
    'rateLimit': {
        'period': 60, //Seconds
        'limit': 60
    }
});
```


## Basic auth

ApiQuick supports basic auth which is where a username and password is encoded with base64 and put into the '*Authorization*' header. An example of sending the username and password 'test' with curl is shown below:
```
curl -H "Authorization: Basic dXNlcjpwYXNz" 127.0.0.1:8080/date
```

The authentication works by running an authentication function that returns (via a callback) either *true* or *false* indicating if the username and password given is valid. There are a few method of doing this.

### One

By providing username and password pairs in a json format. This will be applied as a global auth function.

```javascript
api.authByJson({'username': 'password'});
```

Multiple password keys can also be supplied for one user with an array.

```javascript
api.authByJson({'username': ['key1', 'key2']});
```

### Two

By using a global auth function which applies to all endpoints.

```javascript
api.auth(function(user, pass, callback) {
  callback(pass == 'test');
});
```

### Three

By doing an endpoint specific function (supplied in the extra paramiter)

```javascript
api.addEndpoints(endpoints, {
  'auth': function(user, pass, callback) {
    callback(pass == 'passw0rd');
  }
});
```

Endpoint specific auth functions are used if present and if not then the global function is used. If there are no auth functions then all requests are authorised.


## Initialisation options

| Field      | Description                                               | Default |
|:---------- |:--------------------------------------------------------- | ------- |
| SSL        | Specifies SSL encryption settings (see above)             | false   |
| rateLimit  | Specifies rate limit settings (see above)                 | false   |
| prettyJson | Pretty print the JSON response data                       | false   |
| consoleLog | Log events to standard out for debugging                  | 'info'  |
| compress   | Compress all connections with gzip                        | false   |
| maxDepth   | Maximum number of url arguments to allow                  | 1       |
| debug      | Include extra error error information in responses        | false   |
| fullRequest| Include all the request information avalible              | false   |

## Dependencies

+ secure-compare
+ events
+ url
+ compression

## License

Copyright 2015 Jacob Causon

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
