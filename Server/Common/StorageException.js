'use strict'

var errorcodes = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class StorageException extends ExceptionBase{  
    constructor(storageError){
        var parsedBody;
        try{
            if (storageError){
                parsedBody = JSON.parse(storageError.body);
            }
        }
        catch(e){
        }

        var message;
        var httpcode = 503;
        var errorcode;

        if (typeof(storageError.code) === 'number'){
            httpcode = storageError.code;
        }
        else{
            errorcode = storageError.code;
        }
        if (parsedBody){
            message = parsedBody.message;
        }
        else{
            message = 'Unknown storage error';
        }

        super(message, 'StorageException', errorcodes.GenericStorageException, httpcode, errorcode);
    }
}
