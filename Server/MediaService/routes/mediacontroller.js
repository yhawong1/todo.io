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
    var multiparty = require('multiparty');
    var util = require('util');
    var fs = require('fs');
    var uuid = require('node-uuid');

    var totalFilesSizeLimit = 30 * 1024 * 1024;
    var totalFieldsSizeLimit = 1 * 1024 * 1024;
    var multipartyOptions = { 'encoding' : 'binary', 'maxFieldsSize' : totalFieldsSizeLimit };

    router.post('/:type/:id', helpers.wrap(function *(req, res, errorHandler) {

        logger.get().debug({req : req}, 'Processing file upload request...');
/*
        var result = yield storageBlob.createContainerIfNotExistsAsync('test');

        result = yield storageBlob.createAppendBlobFromLocalFileAsync('test', 'testblob', 'c:/a/GetMedia (8).jpg');
        var created = result.created;
*/
        var identity = req.headers[headerNames.identityHeaderName];

        if (!identity){
            throw new ForbiddenException('Identity is not found.');
        }

        processFileUploadRequestAsync(req)
            .then((fileUploadResult) => {
                logger.get().debug({req : req}, 'Multipart file upload completed.');
                res.status(200).json(fileUploadResult);
            })
            .catch(fileUploadError => {
                errorHandler(new FileUploadException(fileUploadError.error, fileUploadError.fileUploadedSuccessfully));
            });
    }));

    router.delete('/', helpers.wrap(function *(req, res) {
        var result = yield storageBlob.createContainerIfNotExistsAsync('test');

        res.status(200).json(result);
    }));

    function processFileUploadRequestAsync(req){
        if (req.headers['content-length'] > totalFilesSizeLimit){
            throw new FileUploadException({statusCode : 413, message : 'Content is too big.'});
        }

        return new Promise((resolve, reject) => {
            var form = new multiparty.Form(multipartyOptions);
            var fileUploadedSuccessfully = [];
            var containerName = (req.params.type + req.params.id).toLowerCase();

            logger.get().debug({req : req}, 'Start uploading files to container: ' + containerName);

            form.on('part', function(part) {
                if (part.filename){
                    var blobName = uuid.v4();
                    var name = part.name;

                    logger.get().debug({req : req}, 'File ' + blobName +  ' data stream received.');

                    part.on('error', err => {
                         // forward part error to form error
                        form.emit('error', err);
                    });   

                    storageBlob.persistDataToWriteStreamAsync(
                        containerName, 
                        blobName, 
                        {
                            contentSettings: {
                                contentType: part.headers[headerNames.contenttypeHeaderName]
                            },
                            metadata : [ {
                                'originalFilename' : part.filename
                            }]
                        })
                        .then(stream => {
                            stream.on('end', () => {
                                fileUploadedSuccessfully.push(
                                { 
                                    containerName : containerName,
                                    blobName : blobName,
                                    name : name,
                                    originalFilename: part.filename
                                });
                                part.resume();
                            });

                            stream.on('error', err => {
                                part.emit('error', err);
                            });

                            part.pipe(stream);
                        })
                        .catch(err => {
                            part.emit('error', err);
                        });
                }
                else{
                    part.resume();
                }                    
            });

            form.on('field', (name, value) => {
                logger.get().debug({req : req}, 'Field (' + name + ', ' + value + ') received.');
            });

            form.on('error', err => {
                reject({ error : err, fileUploadedSuccessfully : fileUploadedSuccessfully});
            });

            form.on('close', () => {
                //resolve({fileUploadedSuccessfully : fileUploadedSuccessfully});
            });

            form.parse(req);
        });
    }

    return router;
}
