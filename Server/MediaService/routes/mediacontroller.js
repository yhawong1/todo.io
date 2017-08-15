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

        parseFileUploadRequestAsync(req)
            .then(() => {
                logger.get().debug({req : req}, 'Multipart file upload completed.');
                res.status(200).json({});
            })
        .catch(err => {
            errorHandler(new FileUploadException(err));
        });
    }));

    router.delete('/', helpers.wrap(function *(req, res) {
        var result = yield storageBlob.createContainerIfNotExistsAsync('test');

        res.status(200).json(result);
    }));

    function parseFileUploadRequestAsync(req){

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
        if (req.headers['content-length'] > totalFilesSizeLimit){
            throw new FileUploadException({statusCode : 413, message : 'Content is too big.'});
        }

        return new Promise((resolve, reject) => {
            var form = new multiparty.Form(multipartyOptions);
            var totalByteCount = 0;
            var done = false;

            form.on('part', function(part) {

                var buffers = {};

                if (part.filename){
                    totalByteCount += part.byteCount;

                    if (totalByteCount > totalFilesSizeLimit){
                        form.emit('error', {statusCode : 413});
                    }

                    logger.get().debug({req : req}, 'File ' + part.filename +  ' data stream received.');

                    part.on('data', chunk => {
                        var name = part.filename;
                        var size = chunk.length;

                        if (!buffers[part.filename]){
                            buffers[part.filename] = [chunk];
                        }
                        else{
                            buffers[part.filename].push(chunk);
                        }
                    });

                    part.on('end', () => {
                        if (buffers[part.filename]){
                            var buffer = Buffer.concat(buffers[part.filename]); 
                            var size = buffer.length;
                            console.log('size of ' + part.filename + ' = ' + size);

                            storageBlob.uploadFileAsBlockBlob(req.params.id, part.filename, buffer, size)
                                .then(() => {
                                    delete buffers[part.filename];
                                    if (done && isEmptyObject(buffers)){
                                        resolve();
                                    }                            
                                })
                                .catch(err => {
                                   form.emit('error', err);
                                });
                        }
                    });

                    part.on('error', err => {
                        // forward part error to form error
                        form.emit('error', err);
                    });   
                }
                    
                part.resume();             
            });

            form.on('field', function(name, value) {
                logger.get().debug({req : req}, 'Field ' + name + ' received.');
            });

            form.on('error', function(err) {
                reject(err);
            });

            form.on('close', () => {
                done = true;
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
