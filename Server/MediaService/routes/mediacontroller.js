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
    var Promise = require('bluebird');
    var multiparty = Promise.promisifyAll(require('multiparty'), {multiArgs:true});
    var util = require('util');
    var fs = Promise.promisifyAll(require('fs'));

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

        var form = new multiparty.Form({'encoding':'binary'});

        form.parseAsync(req).spread(function(fields, files){
            console.log(util.inspect(fields));
            console.log(util.inspect(files));

            console.log('Upload completed!');
            res.status(200).json({});
        });

        /*
        var count = 0;

        form.on('error', function(err) {
            throw new FileUploadException(err);
        });

        form.on('part', function(part) {
            if (!part.filename) {
                console.log('got field named ' + part.name);
                part.resume();
            }
            else {
                count++;
                console.log('got file named ' + part.filename);

                fs.openAsync('c:\\a\\' + part.filename, 'w+');

                fs.writeFileAsync('c:\\a\\' + part.filename, part);

                //throw new FileUploadException();
                //console.log(util.inspect(buf));

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

        form.on('close', function() {
            console.log('Upload completed!');
            res.status(200).json({});
        });

        form.parse(req);
        */
    }));

    router.delete('/', helpers.wrap(function *(req, res) {
        var result = yield storageBlob.createContainerIfNotExistsAsync('test');

        res.status(200).json(result);
    }));

    return router;
}

