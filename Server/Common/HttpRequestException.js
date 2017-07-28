'use strict';

var errorcode = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class HttpRequestException extends ExceptionBase{  
    constructor(message, url, innerException){
        super(message, 'HttpRequestException', errorcode.GenericHttpRequestException, 503, errorcode.GenericHttpRequestException, innerException);
        this.url = url;
    }

    getResponseJson(displayFullUnknownErrorInfo, logStack){
        var responseJson = super.getResponseJson(displayFullUnknownErrorInfo, logStack);
        responseJson.url = this.url;

        return responseJson;
    }
}