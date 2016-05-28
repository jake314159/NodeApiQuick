# Node api-quick


Create a simple JSON based API server in as little as 6 lines with built in support for *SSL*, *Basic auth* & *rate limiting*.


[![npm](https://img.shields.io/npm/v/api-quick.svg?maxAge=2592000)](https://www.npmjs.com/package/api-quick)
[![GitHub issues](https://img.shields.io/github/issues/jake314159/NodeApiQuick.svg)](https://github.com/jake314159/NodeApiQuick/issues)
[![travis](https://travis-ci.org/jake314159/NodeApiQuick.svg?branch=travis-setup)](https://travis-ci.org/jake314159/NodeApiQuick)
[![travis](https://david-dm.org/jake314159/NodeApiQuick.svg)](https://david-dm.org/)



##Install me

Install using [npm](https://www.npmjs.com/package/api-quick) with the command

```bash
npm install api-quick --save
```

##Basic api server

Time for a quick 6 line example! The below code creates an api server that responds to the port 8080 and returns the current date-time with the url "http://127.0.0.1:8080/date".

```javascript
var api = require('../lib/ApiQuick').init(8080);
var endpoints = {};
endpoints.date = function(req, cb) {
	cb(null, {date: new Date().toUTCString()});
};
api.addEndpoints(endpoints);
```

Doing a GET request on the above url will then return the data:

```
{"date":"Tue, 17 May 2016 17:11:07 GMT"}
```

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

First you need to generate a key and certificate. Click [here](http://docs.nodejitsu.com/articles/HTTP/servers/how-to-create-a-HTTPS-server) for instructions on how to make a self-signed certificate and [this](http://datacenteroverlords.com/2012/03/01/creating-your-own-ssl-certificate-authority/) is good for doing it with your own root CA. You could also use [LetsEncrypt](https://letsencrypt.org/) to create and sign your certificates for free. Go google about SSL if you don't know what this means. You may want to get your ssl certificate signed by a CA. This would make sense for production but consider if it's needed. Self-signing and adding your personal certificate to each device may be a better idea, especially if you are the only one using the api.

To use ssl simply give the paths to the key and cert in the extra data as shown below. Note the standard port for ssl is 443 NOT 80 so set that appropriately. You might also need to add '*https://*' to the url you use, when using ssl the api will NOT accept non secure connections.

```javascript
var api = require('ApiQuick');
api.init(8080,{
    'ssl': {
        'key':'./key.pem',
        'cert':'./cert.pem'
    }
});
```

## Rate limits

Also included is some basic rate limit functionality, disabled by default. There are two ways of doing this...

Using the default values:

```javascript
api.init(8080, {'rateLimit':true});
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

QuickApi uses basic auth because it is simple and secure (if handled correctly). Just a quick overview of basic auth, the username and password is joined with a ':' between and then encoded with base64. This is then put into the header '*Authorization*'. An example of sending the username and password 'test' with curl is shown below:
```
curl -H "Authorization: Basic dXNlcjpwYXNz" 127.0.0.1:8080/date
```

Google for proper secure uses of Basic auth, it's up to you to do it right. ApiQuick also supports SSL, scroll down for more information.

The authentication works by you supplying a function that returns either *true* or *false* indicating if the username and password is valid. There are a few methods of doing auth with ApiQuick.

###One

By providing username and password pairs in a json format. This will be applied as a global auth function.

```javascript
api.authByJson({'username': 'password'});
```

Multiple password keys can also be supplied for one user with an array.

```javascript
api.authByJson({'username': ['key1', 'key2']});
```

###Two

By using a global auth function which applies to all endpoints.

```javascript
api.auth(function(user,pass) {
  return pass=='test';
});
```

###Three

By doing an endpoint specific function (supplied in the extra paramiter)

```javascript
api.addEndpoint(endpoints, {
  'auth': function(user, pass) {
    return pass == 'passw0rd';
  }
});
```



Endpoint specific auth functions are used if present and if not then the global function is used. If there are no auth functions then all requests are authorised.


##Initialisation options

| Field      | Description                                               | Default |
|:-----------|:----------------------------------------------------------|---------|
| prettyJson | Pretty print the JSON response                            | false   |
| consoleLog | Log events to the console                                 | 'info'  |
| compress   | Compress connections with gzip                            | false   |

## Dependencies

+ fs
+ http
+ https
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
