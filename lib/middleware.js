
var mw = function(){
    this.middleware = [];
};
mw.prototype = {
    add: function(f) {
        this.middleware.push(f)
    },
    run: function(req, res, callback) {
        var m = this.middleware;
        if(!m || !m.length) return;
        var i = 0;
        var cb = function() {
            i = i + 1;
            if(i < m.length) {
                m[i](req, res, cb);
            } else {
                callback();
            }
        };
        m[0](req, res, cb);  // Start off the chain
    }
};
mw.prototype.use = mw.prototype.add;
/*
// Example usage
var m = new mw();
m.add(function(req, res, cb) {
    console.log(2 * req);
    cb();
});
m.add(function(req, res, cb) {
    console.log(2 * res);
    cb();
});
m.add(function(req, res, cb) {
    console.log(req * res);
    cb();
});

m.run(1,2);
console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~')
m.run(5,10);
console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~')
*/
module.exports = mw;