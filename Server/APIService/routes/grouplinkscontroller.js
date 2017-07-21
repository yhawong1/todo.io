'use strict'

module.exports = function(config, logger){
    var router = require('express').Router();
    var request = require('request-promise');
    var qs = require('qs');
    var cors = require('cors');
    var etag = require('etag');

    var constants = require('../../common/constants.json')['serviceNames'];
    var helpers = require('../../common/helpers.js');
    var corsOrigin = require('../../common/constants.json')['corsOrigin'];
    var BadRequestException = require('../../common/badrequestexception.js');
    var errorcode = require('../../common/errorcode.json');
    
    var corsOptions = {
      origin : corsOrigin, 
      methods : ['GET', 'PUT'],
      allowedHeaders : ['Content-Type', 'Authorization'],
      exposedHeaders : ['Version'],
      optionsSuccessStatus : 200,
      preflightContinue : true,
      credentials : true
    };

    var endpoint = config.groupLinksServiceEndpoint;

    router.get('/', cors(corsOptions), helpers.wrap(function *(req, res){
        var queryString = qs.stringify(req.query);

        if (!queryString || queryString.length <= 0){
            throw new BadRequestException('Query string is invalid.', errorcode.InvalidQueryString);
        }
        var url = endpoint + '/' + constants.groupLinksServiceUrlRoot + '?' + qs.stringify(req.query);
        var options = helpers.getRequestOption(req, url, 'GET'); 
        var results = yield *helpers.forwardHttpRequest(options, constants.groupLinksServiceName);
        res.setHeader('Etag', etag(results));
        res.status(200).json(JSON.parse(results));
    }));

    router.put('/:id', cors(corsOptions), helpers.wrap(function *(req, res){
        var options = helpers.getRequestOption(req,  endpoint + '/' + constants.groupLinksServiceUrlRoot + '/' + req.params.id, 'PUT'); 
        var results = yield *helpers.forwardHttpRequest(options, constants.groupLinksServiceName);
        res.status(200).json({id : req.params.id});
    }));

    return router;  
}