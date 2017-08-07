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
    var FileUploadException = require('../../common/fileuploadexception.js');
    var errorcode = require('../../common/errorcode.json');
    var StorageBlob = require('../../common/StorageBlob.js').StorageBlob;
    var storageBlob = new StorageBlob(config.azureStorageBlobConnectionString);
    var headerNames = require('../../common/constants.json')['headerNames'];
    var fs = require('fs');
    var multiparty = require('multiparty');
    var util = require('util');

    router.post('/', helpers.wrap(function *(req, res) {

        logger.get().debug({req : req}, 'Saving file object...');
/*
        var result = yield storageBlob.createContainerIfNotExistsAsync('test');

        result = yield storageBlob.createAppendBlobFromLocalFileAsync('test', 'testblob', 'c:/a/GetMedia (8).jpg');
        var created = result.created;
*/
        var identity = req.headers[headerNames.identityHeaderName];

        if (!identity){
            //throw new ForbiddenException('Identity is not found.');
        }

        var count = 0;
        var form = new multiparty.Form();

        form.on('error', function(err) {
            throw new FileUploadException(err);
        });


        // Parts are emitted when parsing the form
        form.on('part', function(part) {
            // You *must* act on the part by reading it
            // NOTE: if you want to ignore it, just call "part.resume()"

            if (!part.filename) {
                console.log('got field named ' + part.name);
                part.resume();
            }
            else {
                // filename is defined when this is a file
                count++;
                console.log('got file named ' + part.filename);
                console.log(util.inspect(part));
                part.resume();
            }

            part.on('error', function(err) {
                throw new FileUploadException(err);
            });
        });

        form.on('aborted', function(){
            // aborted response
        });

        form.on('progress', function(bytesReceived, bytesExpected){
            console.log('progress ' + bytesReceived + ' ' + bytesExpected);
        });

        // Close emitted after form parsed
        form.on('close', function() {
            console.log('Upload completed!');
            res.status(200).json({});
        });

        // Parse req
        form.parse(req);
    }));

    router.delete('/', helpers.wrap(function *(req, res) {
        var result = yield storageBlob.createContainerIfNotExistsAsync('test');

        res.status(200).json(result);
    }));

    return router;
}

