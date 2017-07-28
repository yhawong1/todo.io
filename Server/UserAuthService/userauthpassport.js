'use strict';

module.exports = function(passport, config, logger){
    var helpers = require('../common/helpers.js');
    var LocalStrategy = require('passport-local').Strategy;

    var databaseName = config.documentdbDatabaseName;
    var collectionName = config.usersCollectionName;
    var documentdbEndpoint = config.documentdbEndpoint;
    var documentdbAuthKey = config.documentdbAuthKey;
    var DataAccessLayer = require('../common/dal.js').DataAccessLayer;
    var dal = new DataAccessLayer(databaseName, collectionName, documentdbEndpoint, documentdbAuthKey);
    var errorcode = require('../common/errorcode.json');

    var PasswordCrypto = require('./passwordcrypto.js').PasswordCrypto;
    var UnauthorizedException = require('../common/unauthorizedexception.js');

    passport.use('local', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        }, 
        helpers.wrapLocalStrategyAuth(function *(req, email, password, done){
            var querySpec = getUserQuerySpecFromEmail(email);

            var documentResponse = yield dal.getAsync(querySpec);
            var results = documentResponse.feed;

            var passwordCrypto = new PasswordCrypto();

            if (results && results.length > 0){
                // should yield only one result if found
                var user = results[0];
                if (passwordCrypto.compareValues(password, user.passwordHash)){                    
                    return done(null, user);
                }
            }
            return done(new UnauthorizedException('Login failed', errorcode.LoginFailed), null);
        })));
    
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        var querySpec = getUserQuerySpecFromId(id);
        dal.getAsync(querySpec)
            .then(function(documentResponse){
                done(null, user);
            })
            .fail(function(err){
                done(err);
            });
    });
}

function getUserQuerySpecFromEmail(email){
    if (typeof(email) !== 'string'){
        throw new InternalServerException('email is not a string.');
    }

    var queryString = "SELECT e.id, e.email, e.name, e.passwordHash, e.firstTimeLogon FROM root e WHERE e.email = @email";
                    
    var parameters = [
        {
            name: "@email",
            value: email
        }
    ];

    return {
        query: queryString,
        parameters: parameters
    };
}

function getUserQuerySpecFromId(id){
    if (typeof(id) !== 'string'){
        throw new InternalServerException('id is not a string.');
    }

    var queryString = "SELECT e.id, e._self, e.email, e.name, e.passwordHash, e.firstTimeLogon FROM root e WHERE e.id = @id";
                    
    var parameters = [
        {
            name: "@id",
            value: id
        }
    ];

    return {
        query: queryString,
        parameters: parameters
    };
}
