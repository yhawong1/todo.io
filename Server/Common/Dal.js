'use strict';

var DocumentClient = require('documentdb-q-promises').DocumentClientWrapper;
var DatabaseException = require('./databaseexception.js');

module.exports = {

    DataAccessLayer: function DataAccessLayer(databaseName, collectionName, documentdbEndpoint, documentdbAuthKey) {
        var that = this;
        that.databaseName = databaseName;
        that.collectionName = collectionName;
        that.documentdbEndpoint = documentdbEndpoint;
        that.documentdbAuthKey = documentdbAuthKey;

        var collectionLink = 'dbs/' + databaseName + '/colls/' + collectionName;

        this.insertAsync = function insertAsync(obj, options, errorHandler) {
            var client = this.getClient();

            if (typeof(options) === 'function' && typeof(errorHandler) === 'undefined'){
                errorHandler = options;
                options = {};
            }
            else if (typeof(options) === 'undefined'){
            	options = {};
            }

            return client.createDocumentAsync(collectionLink, obj, options).catch(function(err){
                if (typeof(errorHandler) === 'function'){
                    errorHandler(err);
                }
                else{
                    throw new DatabaseException(err);
                }
            });
        }

        this.getAsync = function getAsync(querySpec, options) {
            var client = this.getClient();
            if (typeof(options) === 'undefined'){
            	options = {};
            }
            return client.queryDocuments(collectionLink, querySpec, options).toArrayAsync().catch(function(err){
                throw new DatabaseException(err);
            });
        }


        this.updateAsync = function updateAsync(id, document, options) {
            // this assumes that all objects have id property
            var client = this.getClient();
            var documentLink = collectionLink + '/docs/' + id;
            if (typeof(options) === 'undefined'){
            	options = {};
            }
            return client.replaceDocumentAsync(documentLink, document, options).catch(function(err){
                throw new DatabaseException(err);
            });
        }

        // delete is a reserved keyword
        this.removeAsync = function removeAsync(id, options) {
            // this assumes that all objects have id property
            var client = this.getClient();
            var documentLink = collectionLink + '/docs/' + id;
            if (typeof(options) === 'undefined'){
            	options = {};
            }
            return client.deleteDocumentAsync(documentLink, options).catch(function(err){
                throw new DatabaseException(err);
            });
        }

        this.executeStoredProcedureAsync = function executeStoredProcedureAsync(storedProcedureName, params, options){
            var client = this.getClient();

            var storedProcedureLink = collectionLink + '/sprocs/' + storedProcedureName;
            if (typeof(options) === 'undefined'){
                options = {};
            }
            return client.executeStoredProcedureAsync(storedProcedureLink, params, options).catch(function(err){
                throw new DatabaseException(err);
            });
        }

        this.getClient = function getClient() {
            var that = this;
            return new DocumentClient(that.documentdbEndpoint, { "masterKey": that.documentdbAuthKey });
        }
    }
}