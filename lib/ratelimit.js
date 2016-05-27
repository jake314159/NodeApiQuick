
var rl = function(){
    this.middleware = [];
};

rl.prototype = {
    /**
     * Starts the rate limiter for all connections
     * @param settings: Dict of rate limit settings or false to disable rate limiting
     */
    startRateLimit: function(settings) {
        if(settings === undefined || settings === true) {
            settings = {}; // Default settings
        } else if(!settings) {
            this.rateLimit = undefined;
            return;
        }

        this.rateLimit = true;
        this.period = settings.period || 60;
        this.limit = settings.limit || 60;
        this.periodStart = Math.floor(Date.now() / 1000);
        this.rateLimitStore = {}
    },

    /**
     *  Takes an ip address and handles the rate limit store, recording 1 api call from that ip
     *  @param ip: IP address of the client that will be the key of the rate limit
     *  @returns true for ALLOW and false for DENY
     */
    handleRateLimit: function(ip) {
        if(this.rateLimit) {
            var now = Math.floor(Date.now() / 1000);
            if(now > this.periodStart+this.period) {
                // We have started a new period so clear the limit store
                this.periodStart = now;
                this.rateLimitStore = {}
            }

            // Check if the rate limit has been reached
            if(this.rateLimitStore[ip] && this.rateLimitStore[ip] >= this.limit) {
                return false;
            }

            // Increment the api call count for this ip
            if(this.rateLimitStore[ip]){
                this.rateLimitStore[ip] += 1;
            } else {
                this.rateLimitStore[ip] = 1;
            }
        }
        return true;  // All ok, the user may continue
    }
};

module.exports = rl;
