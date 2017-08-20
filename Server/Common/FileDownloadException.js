'use strict';

var errorcodes = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class FileDownloadException extends ExceptionBase{  
    constructor(error){
		var httpcode = error.statusCode || 400;
        super(error.message, 'FileDownloadException', errorcodes.GenericFileDownloadException, httpcode, errorcodes.GenericFileDownloadException);
    }
}
