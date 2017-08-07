'use strict';

var bunyan = require('bunyan');
var helpers = require('./helpers.js');
var util = require('util');
var headerNames = require('../common/constants.json')['headerNames'];

module.exports = {
    
    Logger : function Logger(serviceName, loggerName, isDebug){

        var loggedHeaders = [headerNames.versionHeaderName, headerNames.idenityHeaderName, 'authorization', headerNames.activityidHeaderName];

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

        if (isDebug) {
            this.internalLogger.addStream({stream : process.stdout, level : 'debug'});
        }

        this.get = function get(){
            return this.internalLogger;
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
                url: req.url,
                headers: headers
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
    }
}