    'use strict';

    var express = require('express');
    var app = express();

    var serviceNames = require('../common/constants.json')['serviceNames'];
    var urlNames = require('../common/constants.json')['urlNames'];
    var Logger = require('../common/logger.js').Logger;
    var logger = new Logger(serviceNames.groupsRecommendationServiceName, null, app.get('env') === 'development');
    var accesslogger = require('../common/accesslogger.js');

    logger.get().debug('Starting %s.....', serviceNames.groupsRecommendationServiceName);

    app.use(accesslogger.getAccessLogger(logger));

    var config = require('../common/config.json')[app.get('env') || 'production'];
    var helpers = require('../common/helpers.js');
    var BadRequestException = require('../common/badrequestexception.js');
    var InternalServerException = require('../common/internalserverexception.js');
    var NotFoundException = require('../common/notfoundexception.js');
    var errorcode = require('../common/errorcode.json');
    var cache = require('memory-cache');
    var constants = require('../common/constants.json');
    var bodyParser = require('body-parser');
    var co = require('co');
    var util = require('util');
    var groupsRecommendationController = require('./routes/groupsrecommendationcontroller.js')(config, logger, cache);

    app.set('view engine', 'ejs');

    app.use(bodyParser.json());

    co(function*() {
        yield *getImmediateChildrenAndPoplateCacheRecursive(cache, constants.emptyGuid);
        app.use('/groupsrecommendation', groupsRecommendationController);

        // error handling for other routes
        app.use(function(req, res, next) {
            next(new NotFoundException('Resource specified by URL cannot be located.', errorcode.GenericNotFoundException));
        });

        app.use(function(err, req, res, next) {
            helpers.handleServiceException(err, req, res, serviceNames.groupsRecommendationServiceName, logger, true);
        });

        var port = process.env.PORT || config.groupsRecommendationServicePort;
        var server = app.listen(port, function(){
            logger.get().debug('%s started at http://localhost:%d/', serviceNames.groupsRecommendationServiceName, server.address().port);
        });
    }).catch(function(err){
        logger.get().error({exception: err});
    });

    function *getImmediateChildrenAndPoplateCacheRecursive(cache, groupId){
        var groupsServiceUrl = config.groupsServiceEndpoint + '/' + urlNames.groups + '/' + groupId;
        var groupServiceCallOptions = getRequestOptions(groupsServiceUrl); 
        var groupsResults = yield *helpers.forwardHttpRequest(groupServiceCallOptions, serviceNames.groupsServiceName);

        if (groupsResults){
            groupsResults - JSON.parse(groupsResults);
        }

        var groupLinksServiceUrl = config.groupLinksServiceEndpoint + '/' + urlNames.grouplinks + '?groupid=' + groupId + '&distance=1';
        var groupLinkServiceCallOptions = getRequestOptions(groupLinksServiceUrl); 
        var groupLinksResults = yield *helpers.forwardHttpRequest(groupLinkServiceCallOptions, serviceNames.groupLinksServiceName);

        if (groupLinksResults){
            groupLinksResults = JSON.parse(groupLinksResults);
        }

        var group;    

        if (groupsResults && groupsResults.length > 0){
            group = groupsResults[0]
            group.children = [];
        }
        else{
            var children = [];
            group = {
                id : groupId,
                children : []
            };
        }

        if (groupLinksResults){
            for (var i in groupLinksResults){
                var groupLink = groupLinksResults[i];
                if (groupLink.descendant){
                    group.children.push(groupLink.descendant);
                }
            }
        }

        cache.put(group.id, group);

        if (groupLinksResults){
            for(var i in groupLinksResults){
                var groupLink = groupLinksResults[i];
                if (groupLink.descendant){
                    yield *getImmediateChildrenAndPoplateCacheRecursive(cache, groupLink.descendant);
                }
            }
        }
    }

    function getRequestOptions(targetEndpoint){
        return {
            method : 'GET',
            headers: {'content-type' : 'application/json; charset=utf-8' },
            url: targetEndpoint
        };
    }