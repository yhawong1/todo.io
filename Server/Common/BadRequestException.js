'use strict'

var errorcode = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class BadRequestException extends ExceptionBase{  
    constructor(message, errorcode, innerException){
        super(message, 'BadRequestException', errorcode.GenericHttpRequestException, 400, errorcode, innerException);
    }
}
