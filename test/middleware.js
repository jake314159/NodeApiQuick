var should = require('should');
var middleware = require('../lib/middleware');

describe('Middleware', function () {

    it('No middleware', function (done) {
        var i = 0;
        var mw = new middleware();
        mw.run({}, {}, function() {
            done();
        });
    });

    it('Single middleware', function (done) {
        var i = 0;
        var mw = new middleware();
        mw.add(function(res, req, cb) {
            i++;
            cb();
        });
        mw.run({}, {}, function() {
            i.should.equal(1, "Middleware did not run");
            done();
        });
    });

    it('Many middleware', function (done) {
        var i = 0;
        var mw = new middleware();
        for(var j=0; j<100; j++) {
            mw.add(function (res, req, cb) {
                i++;
                cb();
            });
        }
        mw.run({}, {}, function() {
            i.should.equal(100, "Middleware did not run");
            done();
        });
    });

    it('Access request', function (done) {
        var i = 0;
        var mw = new middleware();
        mw.add(function(req, res, cb) {
            should.exist(req);
            should.exist(req.a);
            should.exist(req.b);
            req.a.should.equal(1);
            req.b.should.equal(2);
            i++;
            cb();
        });
        mw.run({a: 1, b: 2}, {}, function() {
            i.should.equal(1, "Middleware did not run");
            done();
        });
    });

    it('Set response', function (done) {
        var i = 0;
        var mw = new middleware();
        mw.add(function(req, res, cb) {
            res.c = 10;
            res.d = 11;
            i++;
            cb();
        });

        var res = {};
        mw.run({}, res, function() {
            i.should.equal(1, "Middleware did not run");
            should.exist(res);
            should.exist(res.c);
            should.exist(res.d);
            res.c.should.equal(10);
            res.d.should.equal(11);
            done();
        });
    });

    it('Set response and is given back to callback', function (done) {
        var i = 0;
        var mw = new middleware();
        mw.add(function(req, res, cb) {
            res.c = 10;
            res.d = 11;
            i++;
            cb();
        });
        
        mw.run({}, {}, function(req, res) {
            i.should.equal(1, "Middleware did not run");
            should.exist(res);
            should.exist(res.c);
            should.exist(res.d);
            res.c.should.equal(10);
            res.d.should.equal(11);
            done();
        });
    });

});
