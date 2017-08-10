'use strict';

var errorcodes = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class FileUploadException extends ExceptionBase{  
    constructor(multipartErr){
        var httpcode = multipartErr.statusCode || 400;
        super(multipartErr.message, 'FileUploadException', errorcodes.GenericStorageException, httpcode, errorcodes.GenericStorageException);
    }
}
