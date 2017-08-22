'use strict';

var errorcodes = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class UnauthorizedException extends ExceptionBase{  
    constructor(message, errorcode, innerException){
        super(message, 'UnauthorizedException', errorcodes.GenericUnauthorizedException, 401, errorcode, innerException);
    }
}
