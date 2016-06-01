# Release history

## Unreleased

+ Option for handler to return asynchronously if it takes a callback (but will behave as before if not) **(BREAKING)**
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
