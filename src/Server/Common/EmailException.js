'use strict';

var errorcodes = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class EmailException extends ExceptionBase{  
    constructor(emailError){
        super('Email could not be sent.', 'EmailException', errorcodes.SendEmailError, 503);
        this.errno = emailError.errno;
        this.syscall = emailError.syscall;
        this.address = emailError.hostname || emailError.address;
        this.port = emailError.port;
        this.command = emailError.command;
	}

    getResponseJson(displayFullUnknownErrorInfo, logStack){
        var that = this;
        var responseJson = super.getResponseJson(displayFullUnknownErrorInfo, logStack);
        responseJson.errno = that.errno;
        responseJson.syscall = that.syscall;
        responseJson.address = that.address;
        responseJson.port = that.port;
        responseJson.command = that.command;

        return responseJson;
    }
}