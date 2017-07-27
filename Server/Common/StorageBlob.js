'use strict';

var Promise = require('bluebird');
var storage = Promise.promisifyAll(require('azure-storage'));
var util = require('util');
var StorageException = require('./StorageException.js');

module.exports = {

    StorageBlob: function StorageBlob(connectionString) {
        this.connectionString = connectionString;

        this.createContainerIfNotExistsAsync = function createContainerIfNotExistsAsync(containerName){
            var blobService = this.getBlobService();
            return blobService.createContainerIfNotExistsAsync(containerName).catch(err => {
                throw new StorageException(err);
            });
        }

        this.getBlobService = function getBlobService() {
            return storage.createBlobService(this.connectionString);
        }

        this.foo = function foo(containerName, onCompleted){
            var blobService = this.getBlobService();
            blobService.createContainerIfNotExists(containerName, function(error, result, response){
                onCompleted(error, result, response);
            });
        }
    }
}