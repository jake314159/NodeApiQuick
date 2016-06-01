var compare = require('secure-compare');

var auth = {};

/**
 * Takes the auth header string and parses it into a username and password string
 * @param authHeader: The header string to parse
 * @returns: A dict containing the parsed auth details in the format {user: <string>, pass: <string}
 */
auth.decodeAuthDetails = function(authHeader) {
    try {
        authHeader = authHeader || "";
        var authVals = new Buffer(authHeader.replace(/^[bB]asic[ ]*/, ''), 'base64').toString("utf8").split(':');
        if(authVals.length>=2) {
            return {
                user: authVals[0],
                pass: authVals[1]
            }
        }
    } catch(e) {
        // Meh, just return an empty dict if we error
    }

    return {};
};

/**
 * Creates a authentication function that checks if a provided username & password is in the credentials dict
 * @param credentials: A dict of valid username->password mappings
 * @returns: A function that takes a username and password string and returns a bool indicating if it is valid
 */
auth.authByJsonFunction = function(credentials) {
    // No one may pass
    if(!credentials) return function() {return false;};

    return function(user, pass) {
        if(!credentials[user]) {
            return false;
        } else if(Array.isArray(credentials[user])) {
            var i = credentials[user].length;
            while(i--) {
                if(compare(credentials[user][i], pass)) return true;
            }
            return false;
        } else {
            return compare(credentials[user], pass);
        }
    };
};

module.exports = auth;
