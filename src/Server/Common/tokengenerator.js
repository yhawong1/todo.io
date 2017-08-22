'use strict';

var jwtSimple = require('jwt-simple');
var helpers = require('./helpers.js');
var InternalServerException = require('./internalserverexception.js');

module.exports = {
    
    TokenGenerator : function TokenGenerator(config){
        var that = this;

        that.config = config;

        this.encode = function encode(decodedObject){
            if (typeof(decodedObject) !== 'object'){
                throw new InternalServerException('decodedObject passed in is not an object.');
            }

            return jwtSimple.encode(JSON.stringify(decodedObject), that.config.jwtSecret)
        }

        this.decode = function decode(encodedToken){
            if (typeof(encodedToken) !== 'string'){
                throw new InternalServerException('encodedToken passed in is not an string.');
            }
            return JSON.parse(jwtSimple.decode(encodedToken, that.config.jwtSecret));
        }
    }   
}