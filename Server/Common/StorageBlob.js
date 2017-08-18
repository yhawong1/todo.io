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


        this.persistDataToWriteStreamAsync = function persistDataToWriteStreamAsync(containerName, blob){     
            return new Promise((resolve, reject) => {
                this.createContainerIfNotExistsAsync(containerName)
                    .then(result => {
                        var stream = this.getBlobService().createWriteStreamToBlockBlob(containerName, blob, (error, result, response) =>{
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