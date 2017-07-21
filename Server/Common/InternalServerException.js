'use strict'

var errorcode = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class InternalServerException extends ExceptionBase{  
    constructor(message, errorcode, innerException){
        super(message, 'InternalServerException', errorcode.GenericInternalServerException, 500, errorcode, innerException);
    }
}
