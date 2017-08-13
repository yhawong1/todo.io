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

        yield *parseFileUploadRequest(req, res, errorHandler);
    }));

    router.delete('/', helpers.wrap(function *(req, res) {
        var result = yield storageBlob.createContainerIfNotExistsAsync('test');

        res.status(200).json(result);
    }));

    function *parseFileUploadRequest(req, res, errorHandler){

        if (req.headers['content-length'] > totalFilesSizeLimit){
            throw new FileUploadException({statusCode : 413});
        }

        var form = new multiparty.Form(multipartyOptions);

        var totalByteCount = 0;

        form.on('error', function(err) {
            errorHandler(new FileUploadException(err));
        });

        form.on('part', wrapPartDataEventHandler(function *(part) {

            if (part.filename){
                logger.get().debug({req : req}, 'File ' + part.filename + ' received.');
                totalByteCount += part.byteCount;

                if (totalByteCount > totalFilesSizeLimit){
                    form.emit('error', {statusCode : 413});
                }

                part.on('data', wrapStreamDataEventHandler(function *(chunk) {
                    var size = part.byteCount - part.byteOffset;
                    var name = part.filename;

                    yield storageBlob.createContainerIfNotExistsAsync(req.params.id);

                    yield storageBlob.createBlockBlobFromStreamAsync(req.params.id, name, chunk, size);
                }));

                part.on('error', function(err) {
                    // forward part error to form error
                    form.emit('error', err);
                });                
            }
            else{
                form.handleError(part);
            }
        }));

        form.on('field', function(name, value) {
            logger.get().debug({req : req}, 'Field ' + name + ' received.');
        });

        form.on('close', function() {
            logger.get().debug({req : req}, 'Multipart Request completed.');
            res.status(200).json({});
        });

        /*
        form.parseAsync(req).spread((fields, files) => {
            var fileUploadResults = { fields : fields, files : files};
            logger.get().debug({req : req, fileUploadResults : fileUploadResults},
                'Uploaded files received.');

            return fileUploadResults;
        })
        .then(r => {
            res.status(200).json(r);
        })
        .catch(err => {
            errorHandler(new FileUploadException(err));
        });
        */
        yield form.parse(req);
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
