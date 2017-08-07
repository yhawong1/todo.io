'use strict';

var errorcodes = require('./errorcode.json');
var util = require('util');

module.exports = class ExceptionBase extends Error{
    constructor(message, name, defaultErrorCode, httpCode, errorCode, innerException){
        super();
        if (typeof(errorCode) === 'object'){
            innerException = errorCode;
            errorCode = defaultErrorCode;
        }

        this.code = httpCode;
        Error.captureStackTrace(this, this.constructor);
        this.name = name;
        this.errorcode = errorCode || defaultErrorCode;
        this.message = message;                
        
        if (innerException){    
            this.code = innerException.code || httpCode;
            this.errorCode = innerException.errorcode || defaultErrorCode;
        }
        this.innerException = innerException;    
        this.isExceptionBase = true;
    }

    getResponseJson(displayFullUnknownErrorInfo, logStack){
        var returnedJson = 
        { 
            name : this.name, 
            message : this.message,
            code : this.code,
            errorcode : this.errorcode,
            activityid : this.activityid,
            serviceName: this.serviceName,
            isExceptionBase : this.isExceptionBase
        };

        if (this.innerException){
            if (this.innerException.isExceptionBase === true){
                returnedJson.innerException = this.innerException;        
            }
            else{
                if (displayFullUnknownErrorInfo){
                    returnedJson.innerException = util.inspect(this.innerException);
                }
                else{
                    returnedJson.innerException = {
                        code : 500,
                        message : 'Unknown server error.',
                        errorcode : errorcodes.GenericInternalServerException,
                        name : this.name
                    };                    
                }
            }
        }

        if (logStack === true){
            returnedJson.stack = this.stack;
        }

        return returnedJson;
    }
} 