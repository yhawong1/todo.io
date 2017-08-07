'use strict';

var errorcodes = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class NotFoundException extends ExceptionBase{  
    constructor(message, errorcode, innerException){
        super(message, 'NotFoundException', errorcodes.GenericNotFoundException, 404, errorcode, innerException);
    }
}
