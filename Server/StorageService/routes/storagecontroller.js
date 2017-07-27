'use strict';

module.exports = function(config, logger){
    var express = require('express');
    var router = express.Router();

    var helpers = require('../../common/helpers.js');
    var databaseName = config.documentdbDatabaseName;
    var collectionName = config.eventsCollectionName;
    var BadRequestException = require('../../common/badrequestexception.js');
    var ForbiddenException = require('../../common/forbiddenexception.js');
    var BadRequestException = require('../../common/badrequestexception.js');
    var errorcode = require('../../common/errorcode.json');
    var StorageBlob = require('../../common/StorageBlob.js').StorageBlob;
    var storageBlob = new StorageBlob(config.azureStorageBlobConnectionString);

    router.post('/', helpers.wrap(function *(req, res) {
        var result = yield storageBlob.createContainerIfNotExistsAsync('test');

        res.status(200).json(result);

    }));

    return router;
}

