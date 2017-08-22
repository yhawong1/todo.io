'use strict';

var errorcodes = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class ForbiddenException extends ExceptionBase{  
    constructor(message, errorcode, innerException){
        super(message, 'ForbiddenException', errorcodes.GenericForbiddenException, 403, errorcode, innerException);
    }
}
