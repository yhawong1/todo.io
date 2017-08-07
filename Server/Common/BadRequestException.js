'use strict';

var errorcodes = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class BadRequestException extends ExceptionBase{  
    constructor(message, errorcode, innerException){
        super(message, 'BadRequestException', errorcodes.GenericHttpRequestException, 400, errorcode, innerException);
    }
}
