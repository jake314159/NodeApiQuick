#NodeApiQuick

Create a simple json based api server supporting both GET and POST requests quickly and easily.

##Install me

```bash
npm install https://github.com/jake314159/NodeApiQuick.git
```

##Basic api server

Time for a quick example! The below code creates an api server that responds to the port 8080 and returns the current date-time with the url "http://host/date/now"

```javascript
var api = require('ApiQuick');
api.init(8080);
api.addPackage('date', {
  'now': function(method, arg, params) {
    var currentDate = new Date();
    return {time:currentDate.toUTCString()};
  }
});
```

Function arguments are
> http://127.0.0.1:8080/:package/:function/:arg,?:params
+ method: 'GET' or 'POST'
+ arg: String for the third element in the url (or undefined if not specified). Params is either the url encoded paramiters for GET requests or the posted data for POST requests in a JSON format.

Function should return a json structure to return to the client 

## Basic auth

QuickApi uses basic auth because it is simple and secure (if handled correctly). Just a quick overview of basic auth, the username and password is encoded with base64 and joined with a ':' between. This is then put into the header 'Authorization'. An example of sending the username and password 'test' with curl is shown below:
```
curl -H "Authorization: dGVzdA:dGVzdA" 127.0.0.1:8080/date/now
```

Google for proper secure uses of Basic auth, it's up to you to do it right.

There are two methods of doing auth.

### One

By using a global auth function

```javascript
api.auth(function(user,pass) {
  return pass=='test';
});
```

### Two

By doing a package specific function

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

Package specific auth functions are used if present and if not then the global function is used.


## Dependencies

+ express
+ body-parser


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
