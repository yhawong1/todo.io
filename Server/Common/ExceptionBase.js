'use strict';

var errorcodes = require('./errorcode.json');
var util = require('util');

module.exports = class ExceptionBase extends Error{
    constructor(message, name, defaultErrorCode, httpCode, errorCode, innerException){
        var that = this;
        super();
        if (typeof(errorCode) === 'object'){
            innerException = errorCode;
            errorCode = defaultErrorCode;
        }

        that.code = httpCode;
        Error.captureStackTrace(that, that.constructor);
        that.name = name;
        that.errorcode = errorCode || defaultErrorCode;
        that.message = message;                
        
        if (innerException){    
            that.code = innerException.code || httpCode;
            that.errorCode = innerException.errorcode || defaultErrorCode;
        }
        that.innerException = innerException;    
        that.isExceptionBase = true;
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