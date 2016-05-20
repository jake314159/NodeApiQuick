#NodeApiQuick

Create a simple json based api server supporting both GET and POST requests quickly and easily.

##Install me

Install using [npm](https://www.npmjs.com/package/api-quick) with the command

```bash
npm install api-quick --save
```

##Basic api server

Time for a quick 6 line example! The below code creates an api server that responds to the port 8080 and returns the current date-time with the url "http://127.0.0.1:8080/date".

```javascript
var api = require('../lib/ApiQuick').init(8080);
api.addPackage('date', 
  function(method, arg, params) {
    return {date: new Date().toUTCString()};
  }
);
```

Doing a GET request on the above url will then return the data:

```
{"time":"Tue, 17 May 2016 17:11:07 GMT"}
```

## URL Layout

The components of the url that are provided to your function is shown below

Example url:
```
http://127.0.0.1:8080/:package/:function/:arg?:params
```

Maps to the function arguments:
```javascript
function(method, arg, params)
```

+ **method**: 'GET' or 'POST'
+ **arg**: String for the third element in the url (or undefined if not specified). 
+ **params**: is either the url encoded paramiters for GET requests or the posted data for POST requests in a JSON format.

Function should return a json structure to return to the client.

## Basic auth

QuickApi uses basic auth because it is simple and secure (if handled correctly). Just a quick overview of basic auth, the username and password is joined with a ':' between and then encoded with base64. This is then put into the header '*Authorization*'. An example of sending the username and password 'test' with curl is shown below:
```
curl -H "Authorization: Basic dXNlcjpwYXNz" 127.0.0.1:8080/date/now
```

Google for proper secure uses of Basic auth, it's up to you to do it right. ApiQuick also supports SSL, scroll down for more information.

The authentication works by you supplying a function that returns either *true* or *false* indicating if the username and password is valid. There are a few methods of doing auth with ApiQuick.

###One

By providing username and password pairs in a json format. This will be applied as a global auth function.

```javascript
api.authByJson({'username':'password'});
```

Multiple password keys can also be supplied for one user with an array.

```javascript
api.authByJson({ 'username': ['key1', 'key2'] });
```

###Two

By using a global auth function which applies to all packages.

```javascript
api.auth(function(user,pass) {
  return pass=='test';
});
```

###Three

By doing a package specific function (supplied in the extra paramiter)

```javascript
api.addPackage('date', 
  {
    'now': function(method, arg, params) {
      var currentDate = new Date();
      return {time:currentDate.toUTCString()};
    }
  }, 
  {
    'auth':function(){return true;}
  }
);
```



Package specific auth functions are used if present and if not then the global function is used. If there are no auth functions then all requests are authorised.

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

## Dependencies

+ fs
+ express
+ body-parser
+ http
+ https
+ secure-compare

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
