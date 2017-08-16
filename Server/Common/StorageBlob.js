'use strict';

var Promise = require('bluebird');
var storage = Promise.promisifyAll(require('azure-storage'));
var util = require('util');
var StorageException = require('./StorageException.js');

module.exports = {

    StorageBlob: function StorageBlob(connectionString) {
        this.connectionString = connectionString;
        this.blobService = storage.createBlobService(this.connectionString);

        this.createContainerIfNotExistsAsync = function createContainerIfNotExistsAsync(containerName){
            return this.blobService.createContainerIfNotExistsAsync(containerName).catch(err => {
                throw new StorageException(err);
            });
        }

        this.createAppendBlobFromLocalFileAsync = function createAppendBlobFromLocalFileAsync(containerName, blobName, fileName){
            return this.blobService.createAppendBlobFromLocalFileAsync(containerName, blobName, fileName).catch(err => {
                throw new StorageException(err);
            });
        }

        this.createAppendBlobFromStreamAsync = function createAppendBlobFromStreamAsync(containerName, blobName, fileName){
            return this.blobService.createAppendBlobFromLocalFileAsync(containerName, blobName, fileName).catch(err => {
                throw new StorageException(err);
            });
        }

        this.createBlockBlobFromStreamAsync = function createBlockBlobFromStreamAsync(containerName, fileName, stream, size, options){
            return this.blobService.createBlockBlobFromStreamAsync(containerName, fileName, stream, size, options).catch(err => {
                throw new StorageException(err);
            });
        }

        this.createAppendBlobFromStreamAsync = function createAppendBlobFromStreamAsync(containerName, fileName, stream, size, options){
            return this.blobService.createAppendBlobFromStreamAsync(containerName, fileName, stream, size, options).catch(err => {
                throw new StorageException(err);
            });
        }

        this.getWritableStreamToBlockBlobAsync = function getWritableStreamToBlockBlobAsync(containerName, blob){
            return this.blobService.createContainerIfNotExistsAsync(containerName)
                .then(() => {
                    return this.blobService.createWriteStreamToBlockBlobAsync(containerName, blob, {});
                })
                .catch(err => {
                    throw new StorageException(err);
                });
        }

        this.getWritableStreamToAppendBlobAsync = function getWritableStreamToAppendBlobAsync(containerName, blob){
            return this.blobService.createContainerIfNotExistsAsync(containerName)
                .then(() => {
                    return this.blobService.createWriteStreamToNewAppendBlobAsync(containerName, blob, {});
                })
                .catch(err => {
                    throw new StorageException(err);
                }); 
        }

        this.getBlobService = function getBlobService() {
            return storage.createBlobService(this.connectionString);
        }
    }
}