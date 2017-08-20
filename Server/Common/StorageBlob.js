'use strict';

var Promise = require('bluebird');
var storage = Promise.promisifyAll(require('azure-storage'));
var util = require('util');
var StorageException = require('./StorageException.js');

module.exports = {

    StorageBlob: function StorageBlob(connectionString) {
        this.connectionString = connectionString;

        this.createContainerIfNotExistsAsync = function createContainerIfNotExistsAsync(containerName){
            return this.getBlobService().createContainerIfNotExistsAsync(containerName).catch(err => {
                throw new StorageException(err);
            });
        }

        this.writeRangedBlobToStreamAsync = function writeRangedBlobToStreamAsync(containeName, blobName, stream, startPos, endPos){
            return new Promise((resolve, reject) => {
                this.getBlobService().getBlobToStream(
                    containerName,
                    blobName,
                    stream,
                    { 
                        rangeStart : startPos,
                        rangeEnd : endPos
                    }, 
                    (err, blob) =>{
                        if (err){
                            reject(err);
                        }
                        else{
                            resolve(blob);
                        }
                    });
            });
        }

        this.getBlobPropertiesAsync = function getBlobPropertiesAsync(containerName, blobName){
            return new Promise((resolve, reject) =>{
                var blobProperties = this.getBlobService().getBlobProperties(containerName, blobName, (error, blobProperties) => {
                        if (error) {
                            reject(new StorageException(error));
                        }
                        else {
                            resolve(blobProperties);
                        }
                    }
                );
            });
        }

        this.writePartialBlobToStreamAsync = function writePartialBlobToStreamAsync(containerName, blobName, stream, rangeStart, rangeEnd){
            return new Promise((resolve, reject) =>{
                this.getBlobService().getBlobToStream(
                    containerName,
                    blobName,
                    stream,
                    { 
                        rangeStart : rangeStart,
                        rangeEnd : rangeEnd
                    }, 
                    (err, blob) =>{
                        if (err){
                            reject(err);
                        }
                        else{
                            resolve(blob);
                        }
                    });
            });            
        } 

        this.writeBlobToStreamAsync = function writeBlobToStreamAsync(containerName, blobName, stream, chunkSize){
            return new Promise((resolve, reject) =>{
                var blobProperties = this.getBlobService().getBlobProperties(containerName, blobName, (error, blob) => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            var blobSize = blob.contentLength;
                            this.getPartialBlobToStream(
                                containerName, 
                                blobName, 
                                stream, 
                                0,
                                chunkSize, 
                                blobSize, 
                                err => { reject(err); },
                                () => resolve());
                        }
                    }
                );

            });
        }

        this.getPartialBlobToStream = function getPartialBlobToStream (containerName, blobName, stream, startPos, chunkSize, blobSize, onError, onComplete){
            var endPos = startPos + chunkSize - 1;
            var lastChunk = false;
            if (endPos >= blobSize - 1){
                endPos = blobSize - 1;
                lastChunk = true;
            }

            console.log('[startPos, endPos]=[' + startPos + ',' + endPos + ']');
            this.getBlobService().getBlobToStream(
                containerName,
                blobName,
                stream,
                { 
                    rangeStart : startPos,
                    rangeEnd : endPos
                }, 
                (err, blob) =>{
                    if (err){
                        if (onError){
                            onError(new StorageException(err));
                        }
                    }
                    else{
                        if (lastChunk){
                            if (onComplete){
                                onComplete();
                            }
                        }
                        else{
                            this.getPartialBlobToStream(containerName, blobName, stream, endPos + 1, chunkSize, blobSize);                            
                        }
                    }
                });
        } 

        this.deleteBlobAsync = function deleteBlobAsync(containerName, blobName){
            return new Promise((resolve, reject) => {
                this.getBlobService().deleteBlob(containerName, blobName, (err, response) => {
                    if (err){
                        reject(new StorageException(err));
                    }
                    else{
                        resolve(response);
                    }
                });
            });
        }

        this.persistDataToWriteStreamAsync = function persistDataToWriteStreamAsync(containerName, blob, options){     
            return new Promise((resolve, reject) => {
                this.createContainerIfNotExistsAsync(containerName)
                    .then(result => {
                        if (options === undefined){
                            options = {}; 
                        }

                        var stream = this.getBlobService().createWriteStreamToBlockBlob(containerName, blob, options, (error, result, response) =>{
                            if (error){
                                reject(new StorageException(error));
                            }
                        });
                        resolve(stream);
                    })
                    .catch(err => {
                        reject(new StorageException(err));
                    })
            });    
        }

        this.getBlobService = function getBlobService() {
            return storage.createBlobService(this.connectionString);
        }
    }
}