'use strict';

var errorcode = require('./errorcode.json');

module.exports = {

    ExceptionBase : function ExceptionBase(message, name, defaultErrorCode, defaultHttpCode, errorCode, innerException){
        if (typeof(errorCode) === 'object'){
            innerException = errorCode;
            errorCode = defaultErrorCode;
        }

        this.code = defaultHttpCode;
        this.constructor.prototype.__proto__ = Error.prototype;
        Error.captureStackTrace(this, this.constructor);
        this.name = name;
        this.errorcode = errorCode;
        this.message = message;                
        
        if (innerException){    
            this.code = innerException.code || defaultHttpCode;
            this.errorCode = innerException.errorcode || defaultErrorCode;
        }
        this.innerException = innerException;
    },


    BadRequestException : function BadRequestException (message, errorcode, innerException) {
        if (typeof(errorcode) === 'object'){
            innerException = errorcode;
            errorcode = errorcode.GenericBadRequestException;
        }
        const defaultHttpCode = 400;
        this.code = defaultHttpCode;
        this.constructor.prototype.__proto__ = Error.prototype;
        Error.captureStackTrace(this, this.constructor);
        this.name = 'BadRequestException';
        this.errorcode = errorcode;
        this.message = message;                
        if (innerException){    
            this.code = innerException.code || defaultHttpCode;
            this.errorcode = innerException.errorcode || errorcode.GenericBadRequestException;
        }
        this.innerException = innerException;
    },

    NotFoundException : function NotFoundException (message, errorcode, innerException) {
        if (typeof(errorcode) === 'object'){
            innerException = errorcode;
            errorcode = errorcode.GenericNotFoundException;
        }
        const defaultHttpCode = 404;
        this.code = defaultHttpCode;
        this.constructor.prototype.__proto__ = Error.prototype;
        Error.captureStackTrace(this, this.constructor);
        this.name = 'NotFoundException';
        this.errorcode = errorcode;
        this.message = message;
        if (innerException){    
            this.code = innerException.code || defaultHttpCode;
            this.errorcode = innerException.errorcode || errorcode.GenericNotFoundException;
        }
        this.innerException = innerException;
    },

    ForbiddenException : function ForbiddenException (message, innerException) {
        const defaultHttpCode = 403;
        this.code = defaultHttpCode;
        this.constructor.prototype.__proto__ = Error.prototype;
        Error.captureStackTrace(this, this.constructor);
        this.name = 'ForbiddenException';
        this.errorcode = errorcode.GenericForbiddenException;
        this.message = message;
        if (innerException){    
            this.code = innerException.code || defaultHttpCode;
            this.code = innerException.errorcode || errorcode.GenericForbiddenException;
        }
        this.innerException = innerException;
    },

    UnauthorizedException : function UnauthorizedException (message, errorcode, innerException){
        if (typeof(errorcode) === 'object'){
            innerException = errorcode;
            errorcode = errorcode.GenericUnauthorizedException;
        }
        const defaultHttpCode = 401;
        this.code = defaultHttpCode;
        this.constructor.prototype.__proto__ = Error.prototype;
        Error.captureStackTrace(this, this.constructor);
        this.name = 'UnauthorizedException';
        this.errorcode = errorcode;
        this.message = message;
        if (innerException){    
            this.code = innerException.code || defaultHttpCode;
            this.errorcode = innerException.errorcode || errorcode.GenericUnauthorizedException; 
        }
        this.innerException = innerException;
    },

    InternalServerException : function InternalServerException (message, innerException){
        const defaultHttpCode = 500;
        this.code = defaultHttpCode;
        this.constructor.prototype.__proto__ = Error.prototype;
        Error.captureStackTrace(this, this.constructor);
        this.name = 'InternalServerException';
        this.message = message;
        this.errorcode = errorcode.GenericInternalServerException;
        if (innerException){    
            this.code = innerException.code || defaultHttpCode;
            this.errorcode = innerException.errorcode || errorcode.GenericInternalServerException;
        }
        this.innerException = innerException;
    },

    DatabaseException : function DatabaseException (docdbErr){
        this.constructor.prototype.__proto__ = Error.prototype;
        Error.captureStackTrace(this, this.constructor);
        this.name = 'DatabaseException';
        this.code = docdbErr.code;
        this.errorcode = errorcode.GenericDatabaseException;

        var parsedBody;
        try{
            parsedBody = JSON.parse(docdbErr.body);
        }
        catch(e){
        }

        if (parsedBody){
            this.message = parsedBody.message;
            if (parsedBody.errorcode){
                this.errorcode = parsedBody.errorcode;
            }
        }
        else{
            this.message = 'Unknown database error';
        }
        // intentionally left innerError undefined.
    },

    EmailException : function EmailException (emailError){
        this.constructor.prototype.__proto__ = Error.prototype;
        Error.captureStackTrace(this, this.constructor);
        this.name = 'EmailException';
        this.code = 503; //ServiceUnavailable
        this.message = 'Email could not be sent.';
        this.errorcode = errorcode.SendEmailError;
        this.errno = emailError.errno;
        this.syscall = emailError.syscall;
        this.address = emailError.hostname || emailError.address;
        this.port = emailError.port;
        this.command = emailError.command;
        // intentionally left innerError undefined.
    },

    HttpRequestException : function HttpRequestException(message, url, innerException){
        const defaultHttpCode = 503;
        this.code = defaultHttpCode;
        this.constructor.prototype.__proto__ = Error.prototype;
        Error.captureStackTrace(this, this.constructor);
        this.name = 'HttpRequestException';
        this.errorcode = errorcode.GenericHttpRequestException;
        this.message = message;
        if (innerException){    
            this.code = innerException.code || defaultHttpCode;
            this.errorcode = innerException.errorcode || errorcode.GenericHttpRequestException;
        }
        this.innerException = innerException;   
        this.url = url;     
    }
}
