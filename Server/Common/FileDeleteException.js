'use strict';

var errorcodes = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class FileDeleteException extends ExceptionBase{  
    constructor(error){
        super(error.message, 'FileDeleteException', errorcodes.GenericFileDeleteException, 400, error);
    }
}
