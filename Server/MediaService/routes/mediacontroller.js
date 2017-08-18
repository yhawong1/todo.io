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
        // TODO:
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
            var done = false;

            form.on('part', function(part) {
                if (part.filename){
                    var blobName = part.headers[headerNames.blobnameHeaderName] || uuid.v4();
                    var isReplace = part.headers[headerNames.blobnameHeaderName] !== undefined;
                    var key = part.name + '_' + part.filename;
                    var name = part.name;                    

                    if (isReplace){
                        logger.get().debug({req : req}, util.format('File: %s, Name: %s received. Blob %s already exists and will be replaced.', part.filename, part.name, blobName));
                    }
                    else{
                        logger.get().debug({req : req}, util.format('File: %s, Name: %s received. It will be uploaded as blob %s.', part.filename, part.name, blobName));
                    }

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
                            metadata : {
                                'originalFilename' : part.filename
                            }
                        })
                        .then(stream => {
                            stream.on('end', () => {
                                if (isReplace){
                                    logger.get().debug({req : req}, util.format('File: %s, Name: %s, Blob: %s replaced successfully.', part.filename, part.name, blobName));
                                }
                                else{
                                    logger.get().debug({req : req}, util.format('File: %s, Name: %s, Blob: %s uploaded successfully.', part.filename, part.name, blobName));
                                }
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
                resolve({fileUploadedSuccessfully : fileUploadedSuccessfully});
            });

            form.parse(req);
        });
    }

    return router;
}
