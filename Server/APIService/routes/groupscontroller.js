'use strict'

module.exports = function(config, logger){
    var router = require('express').Router();
    var request = require('request-promise');
    var qs = require('qs');
    var cors = require('cors');
    var etag = require('etag');

    var serviceNames = require('../../common/constants.json')['serviceNames'];
    var urlNames = require('../../common/constants.json')['urlNames'];
    var helpers = require('../../common/helpers.js');
    var corsOrigin = require('../../common/constants.json')['corsOrigin'];
    var BadRequestException = require('../../common/badrequestexception.js');
    var errorcode = require('../../common/errorcode.json');
    
    var corsOptions = {
      origin : corsOrigin, 
      methods : ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders : ['Content-Type', 'Authorization'],
      exposedHeaders : ['Version'],
      optionsSuccessStatus : 200,
      preflightContinue : true,
      credentials : true
    };

    var endpoint = config.groupsServiceEndpoint;

    router.get('/:id', cors(corsOptions), helpers.wrap(function *(req, res){
        var url = endpoint + '/' + urlNames.groups + '/' + req.params.id;
        if (req.query){
            url += '?' + qs.stringify(req.query);
        }
        var options = helpers.getRequestOption(req, url, 'GET'); 
        var results = yield *helpers.forwardHttpRequest(options, serviceNames.groupsServiceName);
        res.setHeader('Etag', etag(results));
        res.status(200).json(JSON.parse(results));
    }));

    router.get('/', cors(corsOptions), helpers.wrap(function *(req, res){
        var queryString = qs.stringify(req.query);

        if (!queryString || queryString.length <= 0){
            throw new BadRequestException('Query string is invalid.', errorcode.InvalidQueryString);
        }
        var url = endpoint + '/' + urlNames.groups + '?' + queryString;
        var options = helpers.getRequestOption(req, url, 'GET'); 
        var results = yield *helpers.forwardHttpRequest(options, serviceNames.groupsServiceName);
        res.setHeader('Etag', etag(results));
        res.status(200).json(JSON.parse(results));
    }));

    router.post('/', cors(corsOptions), helpers.wrap(function *(req, res){
        var options = helpers.getRequestOption(req, endpoint + '/' + urlNames.groups, 'POST'); 
        var results = yield *helpers.forwardHttpRequest(options, serviceNames.groupsServiceName);
        res.status(201).json(JSON.parse(results));
    }));

    router.put('/:id', cors(corsOptions), helpers.wrap(function *(req, res){
        var options = helpers.getRequestOption(req,  endpoint + '/' + urlNames.groups + '/' + req.params.id, 'PUT'); 
        var results = yield *helpers.forwardHttpRequest(options, serviceNames.groupsServiceName);
        res.status(200).json({id : req.params.id});
    }));

    router.delete('/:id', cors(corsOptions), helpers.wrap(function *(req, res){
        var options = helpers.getRequestOption(req,  endpoint + '/' + urlNames.groups + '/' + req.params.id, 'DELETE'); 
        var results = yield *helpers.forwardHttpRequest(options, serviceNames.groupsServiceName);
        res.status(200).json({id : req.params.id});
    }));

    return router;  
}