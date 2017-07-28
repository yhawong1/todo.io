'use strict';

var errorcode = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class EmailException extends ExceptionBase{  
    constructor(emailError){
        super('Email could not be sent.', 'EmailException', errorcode.SendEmailError, 503);
        this.errno = emailError.errno;
        this.syscall = emailError.syscall;
        this.address = emailError.hostname || emailError.address;
        this.port = emailError.port;
        this.command = emailError.command;
	}

    getResponseJson(displayFullUnknownErrorInfo, logStack){
        var responseJson = super.getResponseJson(displayFullUnknownErrorInfo, logStack);
        responseJson.errno = this.errno;
        responseJson.syscall = this.syscall;
        responseJson.address = this.address;
        responseJson.port = this.port;
        responseJson.command = this.command;

        return responseJson;
    }
}