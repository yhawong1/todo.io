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
    //var multiparty = Promise.promisifyAll(require('multiparty'), {multiArgs:true});
    var multiparty = require('multiparty');
    var util = require('util');
    var fs = require('fs');
    var azureStorage = require('azure-storage')

    var totalFilesSizeLimit = 10 * 1024 * 1024;
    var totalFieldsSizeLimit = 1 * 1024 * 1024;
    var multipartyOptions = { 'encoding' : 'binary', 'maxFieldsSize' : totalFieldsSizeLimit };

    router.post('/:id', helpers.wrap(function *(req, res, errorHandler) {

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

        parseFileUploadRequestAsync(req)
            .then(() => {
                logger.get().debug({req : req}, 'Multipart file upload completed.');
                res.status(200).json({});
            })
            .catch(fileUploadError => {
                errorHandler(new FileUploadException(fileUploadError.error, fileUploadError.fileUploadedSuccessfully));
            });
    }));

    router.delete('/', helpers.wrap(function *(req, res) {
        var result = yield storageBlob.createContainerIfNotExistsAsync('test');

        res.status(200).json(result);
    }));

    function parseFileUploadRequestAsync(req){
        if (req.headers['content-length'] > totalFilesSizeLimit){
            throw new FileUploadException({statusCode : 413, message : 'Content is too big.'});
        }

        var blobService = azureStorage.createBlobService(config.azureStorageBlobConnectionString);

        return new Promise((resolve, reject) => {
            var form = new multiparty.Form(multipartyOptions);
            var done = false;
            var fileUploadedSuccessfully = [];

            form.on('part', function(part) {

                if (part.filename){
                    /*
                    totalByteCount += part.byteCount;

                    if (totalByteCount > totalFilesSizeLimit){
                        form.emit('error', {statusCode : 413});
                    }
                    */
                    var name = part.filename;

                    logger.get().debug({req : req}, 'File ' + name +  ' data stream received.');

                    part.on('end', () => {
                        fileUploadedSuccessfully.push(name);
                    });

                    part.on('error', err => {
                         // forward part error to form error
                        form.emit('error', err);
                    });   

                    var stream = blobService.createWriteStreamToBlockBlob(req.params.id, name);

                    part.pipe(stream);
                }
                    
                part.resume();             
            });

            form.on('field', (name, value) => {
                logger.get().debug({req : req}, 'Field ' + name + ' received.');
            });

            form.on('error', err => {
                reject({ error : err, fileUploadedSuccessfully : fileUploadedSuccessfully});
            });

            form.on('close', () => {
                resolve();
            });

            form.parse(req);
        });
    }

    function isEmptyObject(obj) {
      return !Object.keys(obj).length;
    }

    function wrapStreamDataEventHandler(genFunc){
        var cr = Promise.coroutine(genFunc); 
        return function (chunk) {
            cr(chunk);
        }
    }    

    function wrapPartDataEventHandler(genFunc){
        var cr = Promise.coroutine(genFunc); 
        return function (part) {
            cr(part);
        }
    }    

    return router;
}
