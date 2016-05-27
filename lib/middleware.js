
var mw = function(){
    this.middleware = [];
};

mw.prototype = {

    /**
     * Adds a middleware function to be run
     * The same as middleware.use(..)
     * @param f Function to run for every call of run(), takes a request, response and callback in that order
     */
    add: function(f) {
        this.middleware.push(f)
    },

    /**
     * Run all of the middleware functions
     * @param req Request object
     * @param res Response object
     * @param callback Callback that is called once complete
     */
    run: function(req, res, callback) {
        var m = this.middleware;
        if(!m || !m.length) return;
        var i = 0;
        var cb = function() {
            i = i + 1;
            if(i < m.length) {
                m[i](req, res, cb);
            } else {
                callback(req, res);
            }
        };
        m[0](req, res, cb);  // Start off the chain
    }
};
mw.prototype.use = mw.prototype.add;

module.exports = mw;
