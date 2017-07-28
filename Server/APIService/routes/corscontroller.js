'use strict';

module.exports = function(config, logger){
    var router = require('express').Router();
    var helpers = require('../../common/helpers.js');
    var corsOrigin = require('../../common/constants.json')['corsOrigin'];
    var cors = require('cors');

    var corsOptions = {
      origin : corsOrigin, 
      methods : ['POST'],
      optionsSuccessStatus : 200
    };

    router.options('/login', cors(corsOptions));

    corsOptions = {
      origin : corsOrigin, 
      methods : ['POST', 'PUT', 'DELETE'],
      optionsSuccessStatus : 200
    };

    router.options('/userauth', cors(corsOptions));
    router.options('/userauth/*', cors(corsOptions));

    corsOptions = {
      origin : corsOrigin, 
      methods : ['GET', 'POST', 'PUT', 'DELETE'],
      optionsSuccessStatus : 200
    };

    router.options('/userdetails', cors(corsOptions));
    router.options('/userdetails/*', cors(corsOptions));

    router.options('/groups', cors(corsOptions));
    router.options('/groups/*', cors(corsOptions));

    router.options('/events', cors(corsOptions));
    router.options('/events/*', cors(corsOptions));

    corsOptions = {
      origin : corsOrigin, 
      methods : ['GET', 'PUT'],
      optionsSuccessStatus : 200
    };

    router.options('/grouplinks', cors(corsOptions));

    return router;  
}
