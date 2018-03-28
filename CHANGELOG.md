# Release history

## Unreleased

+ Able to add custom headers to requests (for all requests and for specific endpoints) with the ```headers``` init option
+ Added option to change cacheControl header with '''cacheControl''' init option. **Documentation TODO**
+ Added ```Access-Control-Allow-Origin: *``` header by default as it's required for common use cases

## v0.3.3 (2017-04-02)

+ Reduce dependencies
+ Fix leaking x-powered-by header
+ Various bug fixes
+ More tests

## v0.3.2 (2016-06-14)
+ Performance benchmarks
+ Documentation improvements

## v0.3.1 (2016-06-12)

+ Fixup error in README
+ Expose client IP address in request data
+ Option to pass all request information to the handler
+ Performance benchmark conducted and details included in ```docs/performance.md```

## 0.3.0 BETA (2016-06-06)

+ Option for handler to return asynchronously if it takes a callback (but will behave as before if not) **(BREAKING)**
+ Authentication functions run asynchronously via a callback **(BREAKING)**
+ Only allow 1 argument by default **(BREAKING)**
+ Handlers function given a single object with all the request details **(BREAKING)**
+ Support for express compatible middleware
+ Gzip compression support
+ Pretty json output
+ Removed dependency on express
+ Infinite depth endpoint urls
+ Improved log event system
+ Logs to standard out by default

## 0.2.0 BETA (2016-05-21)

+ Mark *addPackage* as **deprecated**, due to be removed v1.0.0
+ Implement addEndpoints which will replace addPackage
+ Major code refactor
+ Tests for the full program
+ Disable auth by setting ```auth: false```
+ Fix dependency versions
+ Update readme


## 0.1.2 BETA (2016-05-17)

**Security update (LOW severity)**

+ Use a constant time string comparison for API keys as part of the authByJson function. Fixes a potential timing leak relating to the use of authByJson that could theoretically reduce the number of attempts required to brute force an api key.
+ Adds an extra requirement for 'secure-compare'

## 0.1.1 BETA

+ Fix a bug in the standard auth code

## 0.1.0 BETA

+ Initial commit
