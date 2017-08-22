'use strict';

var bunyan = require('bunyan');
var helpers = require('./helpers.js');
var util = require('util');
var headerNames = require('./constants.json')['headerNames'];

module.exports = {
    
    Logger : function Logger(serviceName, loggerName, isDebug){

        var loggedHeaders = 
            [
                headerNames.versionHeaderName, 
                headerNames.idenityHeaderName, 
                'authorization',
                'content-type',
                'host',
                headerNames.activityidHeaderName
            ];

        this.serviceName = serviceName;     
        if (!loggerName){
            loggerName = serviceName + 'Logger';
        }

        if (!isDebug){
            isDebug = false;
        }
        
        this.internalLogger = bunyan.createLogger(
        {
            name : loggerName,
            src : isDebug
        });

        this.internalLogger.addSerializers({req : reqSerializer});
        this.internalLogger.addSerializers({exception : exceptionSerializer});
        this.internalLogger.addSerializers({accessLog : accessLogSerializer});        
        this.internalLogger.addSerializers({userAuth : userAuthSerializer});
        this.internalLogger.addSerializers({fileUploadResults : fileUploadResultsSerializer});

        if (isDebug) {
            this.internalLogger.addStream({stream : process.stdout, level : 'debug'});
        }

        this.get = function get(){
            var that = this;
            return that.internalLogger;
        }

        function reqSerializer(req) {
            if (!req || !req.headers){
                return req;
            }

            var headers = {};

            Object.keys(req.headers).forEach(function(key) {
                if (loggedHeaders.indexOf(key) > -1){
                    headers[key] = req.headers[key];
                }
            });

            return {
                method: req.method,
                url: req.originalUrl,
                headers: headers,                
            };
        }

        function exceptionSerializer(exception) {
            if (!exception){
                return exception;
            }

            if (exception.code){
                if (exception.code > 399){
                    return helpers.getExceptionResponseJson(exception, true, exception.code > 499);
                }
            }
            
            return exception;
        }

        function accessLogSerializer(accessLog){
            if (!accessLog){
                return accessLog;
            }
            return {
                method : accessLog.method,
                url : accessLog.url,
                status : accessLog.status,
                activityid : accessLog.activityid,
                authidentity : accessLog.authidentity,
                responsetime : accessLog.responsetime
            };
        }

        function userAuthSerializer(userAuth){
            if (!userAuth){
                return userAuth;
            }

            return {
                id : userAuth.id,
                email : userAuth.email,
                name : userAuth.name,
                firstTimeLogon : userAuth.firstTimeLogon
            };
        }

        function fileUploadResultsSerializer(fileUploadResults){
            if (!fileUploadResults){
                return fileUploadResults;
            }

            return {
                fields : fileUploadResults.fields,
                files : fileUploadResults.files,
            };            
        }
    }
}