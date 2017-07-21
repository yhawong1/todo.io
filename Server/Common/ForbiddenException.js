'use strict'

var errorcode = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class ForbiddenException extends ExceptionBase{  
    constructor(message, errorcode, innerException){
        super(message, 'ForbiddenException', errorcode.GenericForbiddenException, 403, errorcode, innerException);
    }
}
