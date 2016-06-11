
# Method

All rate limits were tested on a single $5 [Digital Ocean](https://www.digitalocean.com/) VM with the following specifications:

```
RAM:    512 MB
CPUs:   1
SSD:    20 GB
OS:     Ubuntu 14.04
Node:   v4.4.3
```

The test api server code is shown below:

```
var api = require('api-quick').init(8080);
var endpoints = {};
endpoints.ping = function() {
  return "pong";
};
api.addEndpoints(endpoints);
```

To test the maximum capacity of the api server a second VM of the same specifications (and in the same region) used ```httperf``` to test the maximum capacity of the server. The exact command run is shown with the results.

# Results (v0.3.0)

## 200 simultaneous connections

**2209 replies/sec**

```
httperf --server=<ADDRESS> uri=/pong --port=8080 --num-conn 200 --num-call=150
```

```
Request rate: 2289.8 req/s (0.4 ms/req)
Reply rate [replies/s]: min 1972.7 avg 2209.0 max 2445.4 stddev 334.3 (2 samples)
Connection rate: 15.3 conn/s (65.5 ms/conn, <=1 concurrent connections)
Connection time [ms]: min 40.6 avg 65.5 max 101.6 median 63.5 stddev 16.9
Connection time [ms]: connect 0.4
Connection length [replies/conn]: 150.000
Errors: total 0 client-timo 0 socket-timo 0 connrefused 0 connreset 0
```

## 2000 simultaneous connections

**1830 replies/sec**

```
httperf --server=<ADDRESS> uri=/pong --port=8080 --num-conn 2000 --num-call=10
```

```
Request rate: 1817.0 req/s (0.6 ms/req)
Reply rate [replies/s]: min 1726.3 avg 1830.9 max 1935.5 stddev 147.9 (2 samples)
Connection rate: 181.7 conn/s (5.5 ms/conn, <=1 concurrent connections)
Connection time [ms]: min 3.0 avg 5.5 max 17.5 median 5.5 stddev 1.5
Connection time [ms]: connect 0.3
Connection length [replies/conn]: 10.000
Errors: total 0 client-timo 0 socket-timo 0 connrefused 0 connreset 0
```

