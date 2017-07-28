'use strict';

var Promise = require('bluebird');
var request = require('request-promise');
var ForbiddenException = require('./forbiddenexception.js');
var UnauthorizedException = require('./unauthorizedexception.js');
var InternalServerException = require('./internalserverexception.js');
var HttpRequestException = require('./httprequestexception.js');
var EmailException = require('./emailexception.js');
var nodemailer = require('nodemailer');
var sendMailConfig = require('./sendmailconfig.json');
var errorcode = require('./errorcode.json');
var uuid = require('node-uuid');

module.exports = {

    wrap : function (genFn) { 
        var cr = Promise.coroutine(genFn);
        return function (req, res, errorHandler) {
            cr(req, res, errorHandler).catch(errorHandler);
        }
    },

    wrapLocalStrategyAuth : function (genFunc){
        var cr = Promise.coroutine(genFunc); 
        return function (req, email, password, done) {
            cr(req, email, password, done).catch(function(err){
                done(err, null);
            });
        }
    },

    getRequestOption : function (req, targetEndpoint, method){
        return {
            method : method,
            headers: {'content-type' : 'application/json; charset=utf-8',
                      'auth-identity' : req.headers['auth-identity'],
                      'version' : req.headers['version'],
                      'activityid' : req.headers['activityid']},
            url: targetEndpoint,
            body: JSON.stringify(req.body)
        };
    },

    removeDuplicatedItemsById : function (results){
        if (results){
            var filteredResults = {};

            // de-dupe uisng dictionary
            for (var i in results){
                var obj = results[i];
                if (!filteredResults.hasOwnProperty(obj.id)){
                    filteredResults[obj.id] = obj;
                }
            }

            return Object.keys(filteredResults).map(key => filteredResults[key]);
        }
        return [];
    },

    convertFieldSelectionToConstraints : function (prefix, fields){
        if (fields){
            var arr = [];
            for(var i in fields){
                arr.push(prefix + '.' + fields[i]);
            }

            if (arr.length > 0){
                return ',' + arr.join(', ');
            }
        }
        return '';
    },

    forwardHttpRequest : function *(options, serviceName){
        if (!options.headers['activityid']){
            var activityid = uuid.v4();
            options.headers['activityid'] = activityid;
        }
        return yield request(options).catch(function(err){
            try{
                var extractedException = JSON.parse(err.error);
            }
            catch(e){
            }

            if (!extractedException){
                extractedException = err;
            }
            throw new HttpRequestException('Request to ' + serviceName + ' failed.', options.url, extractedException);
        });
    },

    handleServiceException : function (ex, req, res, serviceName, logger, logStack){
        ex.serviceName = serviceName;
        ex.activityid = req.headers['activityid'];

        if (!ex.isExceptionBase){
            ex = new InternalServerException('Fatal error.', errorcode.GenericInternalServerException, ex);
        }

        // logStack always false for json returned in response
        var exceptionJson = this.getExceptionResponseJson(ex, false, false);
        
        if (ex && ex.code < 500){
            logger.get().info({exception : ex});
        }
        else{        
            logger.get().error({exception : ex});
        }

        res.status(ex.code || 500).json(exceptionJson);
    },

    getExceptionResponseJson : function(ex, displayFullUnknownErrorInfo, logStack){
        if (ex.isExceptionBase === true){  
            return ex.getResponseJson(displayFullUnknownErrorInfo, logStack);
        }
        else{
            if (displayFullUnknownErrorInfo){
                return util.inspect(ex);
            }
            else{
                var internalServerEx = new InternalServerException(
                    'Unknown Server Error.', 
                    errorcode.GenericInternalServerException);

                return internalServerEx.getResponseJson(false, false);
            }
        }
    },

    sendMail : function (fromAddress, toAddress, subject, textEmailBody, htmlEmailBody) {
        if (sendMailConfig.service){
            var transportConfig = {
                service : sendMailConfig.service
            };
        }
        else{
            var transportConfig = {
                host : sendMailConfig.host,
                port : sendMailConfig.port
            };            
        }

        var transporter = nodemailer.createTransport(transportConfig);

        var mailContent = {
            from: fromAddress,
            to: toAddress,
            subject: subject,
            text: textEmailBody,
            html: htmlEmailBody,
            auth: {
                user: sendMailConfig.user,
                pass: sendMailConfig.password
            }            
        };

        return transporter.sendMail(mailContent)
            .then(function(){
                transporter.close();
            })
            .catch(function(err){
                throw new EmailException(err);            
            });
    }
}