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
    var FileDownloadException = require('../../common/filedownloadexception.js');
    var FileDeleteException = require('../../common/filedeleteexception.js');
    var errorcode = require('../../common/errorcode.json');
    var StorageBlob = require('../../common/StorageBlob.js').StorageBlob;
    var storageBlob = new StorageBlob(config.azureStorageBlobConnectionString);
    var headerNames = require('../../common/constants.json')['headerNames'];
    var Promise = require('bluebird');
    var multiparty = require('multiparty');
    var util = require('util');
    var fs = require('fs');
    var uuid = require('node-uuid');

    const totalFilesSizeLimit = 30 * 1024 * 1024;
    const totalFieldsSizeLimit = 1 * 1024 * 1024;
    const blockSize = 64 * 1024;
    var multipartyOptions = { 'encoding' : 'binary', 'maxFieldsSize' : totalFieldsSizeLimit };

    router.head('/:type/:id/:blobName', helpers.wrap(function *(req, res, errorHandler) {
        var containerName = getContainerName(req);
        var blobName = req.params.blobName;

        logger.get().debug({req : req}, 'Processing file head request...');
        var identity = req.headers[headerNames.identityHeaderName];

        if (!identity){
            throw new ForbiddenException('Identity is not found.');
        }

        storageBlob.getBlobPropertiesAsync(containerName, blobName)
            .then(properties => {
                var contentLength = properties.contentLength;
                logger.get().debug({req : req}, util.format('Size of blob %s in container %s: %d', blobName, containerName, contentLength));
                res.set(headerNames.contentlengthHeaderName, contentLength);

                // HEAD request doesn't return any body
                res.status(200).end();
            })
            .catch(err => {
                errorHandler(new FileDownloadException(err));
            });
    }));

    router.get('/:type/:id/:blobName', helpers.wrap(function *(req, res, errorHandler) {
        logger.get().debug({req : req}, 'Processing file get request...');
        var identity = req.headers[headerNames.identityHeaderName];

        if (!identity){
            throw new ForbiddenException('Identity is not found.');
        }

        var rangeStart = parseInt(req.headers[headerNames.rangestartHeaderName], 10);
        var rangeEnd = parseInt(req.headers[headerNames.rangeendHeaderName], 10);

        if (rangeEnd - rangeStart > blockSize){
            throw new FileDownloadException({statusCode : 413, message: util.format('Data requested too large. Maximum block size is %d.', blockSize) })
        }

        processFileGetRequestAsync(req, res, rangeStart, rangeEnd)
            .catch(err =>{
                errorHandler(new FileDownloadException(err));                
            })
    }));

    router.post('/:type/:id', helpers.wrap(function *(req, res, errorHandler) {
        logger.get().debug({req : req}, 'Processing file upload request...');
        var identity = req.headers[headerNames.identityHeaderName];

        if (!identity){
            throw new ForbiddenException('Identity is not found.');
        }

        processFileUploadRequestAsync(req)
            .then((fileUploadResult) => {
                logger.get().debug({req : req}, 'Multipart file upload completed.');
                res.status(201).json(fileUploadResult);
            })
            .catch(fileUploadError => {
                errorHandler(new FileUploadException(fileUploadError.error, fileUploadError.fileUploadedSuccessfully));
            });
    }));

    router.delete('/:type/:id/:blobName', helpers.wrap(function *(req, res, errorHandler) {
        logger.get().debug({req : req}, 'Processing file delete request...');
        var identity = req.headers[headerNames.identityHeaderName];

        if (!identity){
            throw new ForbiddenException('Identity is not found.');
        }

        var containerName = getContainerName(req);
        var blobName = req.params.blobName;

        storageBlob.deleteBlobAsync(containerName, blobName)
            .then(response => {
                logger.get().debug({req : req}, util.format('File at containerName %s blob %s deleted successfully', containerName, blobName));
                res.status(200).json(
                    {
                        containerName : containerName,
                        blobName : blobName,
                    });
            })
            .catch(err => {
                errorHandler(new FileDeleteException(err));
            });
    }));

    function processFileGetRequestAsync(req, res, rangeStart, rangeEnd){
        var containerName = getContainerName(req);
        var blobName = req.params.blobName;

        return new Promise((resolve, reject) => {

            logger.get().debug({req : req}, util.format('Start downloading file from container %s blob %s', containerName, blobName));

            res.on('error', err => {
                reject(err);
            });

            storageBlob.writePartialBlobToStreamAsync(containerName, blobName, res, rangeStart, rangeEnd)
                .then(() => {
                    logger.get().debug({req : req}, util.format('File downloading completed from container %s blob %s', containerName, blobName));
                    resolve();
                })  
                .catch(err => {
                    reject(err);
                });
        });
    }

    function processFileUploadRequestAsync(req){
        if (req.headers['content-length'] > totalFilesSizeLimit){
            throw new FileUploadException({statusCode : 413, message : 'Content is too big.'});
        }

        return new Promise((resolve, reject) => {
            var form = new multiparty.Form(multipartyOptions);
            var fileUploadedSuccessfully = [];
            var filesBeingUploaded = {};
            var containerName = getContainerName(req);

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

                    if (!filesBeingUploaded[key]){
                        filesBeingUploaded[key] = key;
                    }

                    storageBlob.persistDataToWriteStreamAsync(
                        containerName, 
                        blobName, 
                        {
                            contentSettings: {
                                contentType: part.headers[headerNames.contenttypeHeaderName]
                            },
                            metadata : {
                                'originalFilename' : part.filename
                            },
                            blockSize : blockSize
                        })
                        .then(stream => {
                            stream.on('finish', () => {
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
                                    isReplace : isReplace,
                                    originalFilename: part.filename
                                });

                                if (filesBeingUploaded[key]){
                                    delete filesBeingUploaded[key];
                                }

                                if (done && isEmptyObject(filesBeingUploaded)){
                                    resolve(fileUploadedSuccessfully);
                                }

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
                done = true;
                if (isEmptyObject(filesBeingUploaded)){
                    resolve({fileUploadedSuccessfully : fileUploadedSuccessfully});
                }
            });

            form.parse(req);
        });
    }

    function getContainerName(req){
        return (req.params.type + req.params.id).toLowerCase();
    }

    function isEmptyObject(obj) {
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                return false;
            }
        }
        return true;
    }

    return router;
}
