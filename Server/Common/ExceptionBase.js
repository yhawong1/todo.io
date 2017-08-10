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
        var that = this;

        var returnedJson = 
        { 
            name : that.name, 
            message : that.message,
            code : that.code,
            errorcode : that.errorcode,
            activityid : that.activityid,
            serviceName: that.serviceName,
            isExceptionBase : that.isExceptionBase
        };

        if (that.innerException){
            if (that.innerException.isExceptionBase === true){
                returnedJson.innerException = that.innerException;        
            }
            else{
                if (displayFullUnknownErrorInfo){
                    returnedJson.innerException = util.inspect(that.innerException);
                }
                else{
                    returnedJson.innerException = {
                        code : 500,
                        message : 'Unknown server error.',
                        errorcode : errorcodes.GenericInternalServerException,
                        name : that.name
                    };                    
                }
            }
        }

        if (logStack === true){
            returnedJson.stack = that.stack;
        }

        return returnedJson;
    }
} 