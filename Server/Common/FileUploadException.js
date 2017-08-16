'use strict';

var errorcodes = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class FileUploadException extends ExceptionBase{  
    constructor(error, successfulFileUpload){
        var httpcode = error.statusCode || 400;
        super(error.message, 'FileUploadException', errorcodes.GenericStorageException, httpcode, errorcodes.GenericStorageException);
    }
}
