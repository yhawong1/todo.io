'use strict';

var errorcode = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class UnauthorizedException extends ExceptionBase{  
    constructor(message, errorcode, innerException){
        super(message, 'UnauthorizedException', errorcode.GenericUnauthorizedException, 401, errorcode, innerException);
    }
}
