'use strict';

module.exports = function(config, logger){
    var express = require('express');
    var router = express.Router();

    var helpers = require('../../common/helpers.js');
    var databaseName = config.documentdbDatabaseName;
    var collectionName = config.eventsCollectionName;
    var BadRequestException = require('../../common/badrequestexception.js');
    var ForbiddenException = require('../../common/forbiddenexception.js');
    var BadRequestException = require('../../common/badrequestexception.js');
    var errorcode = require('../../common/errorcode.json');
    var Validator = require('../../common/bodyschemavalidator.js');
    var emailSchema = require('./email.schema.json');

    var bodyschemavalidator = new Validator.BodySchemaValidator();
    bodyschemavalidator.addSchema(emailSchema, 'email');

    router.post('/', bodyschemavalidator.validateSchema('email'), helpers.wrap(function *(req, res) {
        if (req.query.action === 'send'){
            var fromAddress = req.body.fromAddress;
            var toAddress = req.body.toAddress;
            var subject = req.body.subject;
            var textEmailBody = req.body.textEmailBody;
            var htmlEmailBody = req.body.htmlEmailBody;

            logger.get().debug({req : req}, 'Sending email to %s...', toAddress);
            yield helpers.sendMail(fromAddress, toAddress, subject, textEmailBody, htmlEmailBody);

            logger.get().debug({req : req}, 'Email sent successfully to %s.', toAddress);
            res.status(200).json({});
        }
        else{
            throw new BadRequestException('action is not specified or unknown in query string.', errorcode.InvalidSendMailAction);
        }         
    }));

    return router;
}

