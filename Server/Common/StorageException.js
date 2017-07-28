'use strict';

var errorcodes = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class StorageException extends ExceptionBase{  
    constructor(storageError){
        var httpcode = storageError.statusCode || 500;
        var errorcode = storageError.code || errorcodes.GenericStorageException;

        super(storageError.message, 'StorageException', errorcodes.GenericStorageException, httpcode, errorcode);
    }
}
