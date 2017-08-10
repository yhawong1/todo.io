'use strict';

var errorcodes = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class HttpRequestException extends ExceptionBase{  
    constructor(message, url, innerException){
    	var that = this;
        super(message, 'HttpRequestException', errorcodes.GenericHttpRequestException, 503, errorcodes.GenericHttpRequestException, innerException);
        that.url = url;
    }

    getResponseJson(displayFullUnknownErrorInfo, logStack){
        var responseJson = super.getResponseJson(displayFullUnknownErrorInfo, logStack);
        responseJson.url = that.url;

        return responseJson;
    }
}