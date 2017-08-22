'use strict';

module.exports = function(config, logger, cache){

    var express = require('express');
    var router = express.Router();

    var helpers = require('../../common/helpers.js');
    var BadRequestException = require('../../common/badrequestexception.js');
    var errorcode = require('../../common/errorcode.json');
    var constants = require('../../common/constants.json');
    var util = require('util');

    router.get('/:parentgroupid', helpers.wrap(function *(req, res) {     
        var parentgroupid = req.params.parentgroupid;   
        logger.get().debug({req : req}, 'Retriving all recommended groups for parent group id %s...', parentgroupid);

        var group = cache.get(parentgroupid);

        if (!group){
            group = {};
        }
        else
        {
            var populatedChildren = [];
            if (group.children){
                for (var c in group.children){
                    var child = group.children[c];
                    var cachedChild = cache.get(c.id);
                    if (cachedChild){
                        populatedChildren.push(cachedChild);
                    }
                }
            }

            group.children = populatedChildren;
        }


        logger.get().debug({req : req, group : group}, 'Recommended groups object retrieved successfully.');
        res.status(200).json(group);
    }));

    return router;
}

