'use strict';

var morgan = require('morgan');
var headerNames = require('./constants.json')['headerNames'];

module.exports = {

    'getAccessLogger' : function getAccessLogger(logger){
         return morgan(function(tokens, req, res){
            return JSON.stringify({
                method : tokens.method(req, res),
                url: tokens.url(req, res),
                status: tokens.status(req, res),
                activityid : tokens.req(req, res, headerNames.activityidHeaderName),
                authidentity : tokens.req(req, res, headerNames.identityHeaderName),
                responsetime: tokens['response-time'](req, res) + 'ms'
            });
        },
        {
            'stream': {
                write: function(accessLog) {
                    logger.get().info({accessLog : JSON.parse(accessLog)});
                }
            }
        });
    }
}
    
