'use strict'

module.exports = function(passport, config, logger){

    var router = require('express').Router();
    var TokenGenerator = new require('../../common/tokengenerator.js').TokenGenerator;
    var helpers = require('../../common/helpers.js');
    var ForbiddenException = require('../../common/forbiddenexception.js');

    var databaseName = config.documentdbDatabaseName;
    var collectionName = config.usersCollectionName;
    var documentdbEndpoint = config.documentdbEndpoint;
    var documentdbAuthKey = config.documentdbAuthKey;
    var DataAccessLayer = require('../../common/dal.js').DataAccessLayer;
    var dal = new DataAccessLayer(databaseName, collectionName, documentdbEndpoint, documentdbAuthKey);

    router.post('/', passport.authenticate('local'), helpers.wrap(function *(req, res){        
        logger.get().debug({req : req, userAuth : req.user}, 'User authenticatd.');

        if (req.user && req.user.email && req.user.id && req.user.name){

            var firstTimeLogon = !req.user.firstTimeLogon || req.user.firstTimeLogon === true;

            if (firstTimeLogon){
                logger.get().debug({req : req}, 'firstTimeLogon flag is either not found or true. Updating flag to false...');
                req.user.firstTimeLogon = false;
                yield dal.updateAsync(req.user.id, req.user);
                logger.get().debug({req : req}, 'firstTimeLogon flag is updated successfully.');
            }

            logger.get().debug({req : req}, 'Generating token...');
            var tokenGenerator = new TokenGenerator(config);
            var token = tokenGenerator.encode({ email : req.user.email, id : req.user.id, name : req.user.name, time : Date.now() });
            logger.get().debug({req : req}, 'Token generated successfully.');
            res.status(200).json({ token : token, id : req.user.id, name : req.user.name, firstTimeLogon : !firstTimeLogon});
        }
        else{
            throw new ForbiddenException('Forbidden');
        }   
    }));

    return router;
}
