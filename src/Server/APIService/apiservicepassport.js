'use strict';

module.exports = function(passport, config, logger){
    var helpers = require('../common/helpers.js');
    var BearerStrategy = require('passport-http-bearer').Strategy;
    var TokenGenerator = require('../common/tokengenerator.js').TokenGenerator;
    var UnauthorizedException = require('../common/unauthorizedexception.js');
    var errorcode = require('../common/errorcode.json');

    passport.use('token-bearer', new BearerStrategy(
        function(token, done) {
            logger.get().debug('Attempt to decode token %s.', token);
            var tokenGenerator = new TokenGenerator(config);
            try{
                var decodedObject = tokenGenerator.decode(token);
                    
                if (!decodedObject || !decodedObject.id){
                    return done(new UnauthorizedException('Invalid token', errorcode.InvalidToken), false);
                }
            }
            catch(err){
                return done(new UnauthorizedException('Invalid token', errorcode.InvalidToken), false);                
            }

            logger.get().debug('Successfully decode token %s to user id %s.', token, decodedObject.id);
            return done(null, decodedObject.id);
        }
    ));
}