# Release history

## Unreleased

+ Update readme
+ Major code refactor
+ Tests for the full program
+ Disable auth by setting ```auth: false```
+ Fix dependency versions
+ Mark addPackage as deprecated, due to be removed v1.0.0
+ Implement addEndpoints which will replace addPackage

## 0.1.2 BETA (2016-05-17)

**Security update (LOW severity)**

+ Use a constant time string comparison for API keys as part of the authByJson function. Fixes a potential timing leak relating to the use of authByJson that could theoretically reduce the number of attempts required to brute force an api key.
+ Adds an extra requirement for 'secure-compare'

## 0.1.1 BETA

+ Fix a bug in the standard auth code

## 0.1.0 BETA

+ Initial commit