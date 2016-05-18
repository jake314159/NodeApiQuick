# Release history

## Unreleased

+ Update readme
+ Code layout & implementation improvements

## 0.1.2 BETA (2016-05-17)

**Security update (LOW severity)**

+ Use a constant time string comparison for API keys as part of the authByJson function. Fixes a potential timing leak relating to the use of authByJson that could theoretically reduce the number of attempts required to brute force an api key.
+ Adds an extra requirement for 'secure-compare'

## 0.1.1 BETA

+ Fix a bug in the standard auth code

## 0.1.0 BETA

+ Initial commit