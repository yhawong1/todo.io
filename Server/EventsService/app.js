﻿'use strict'

var express = require('express');
var app = express();

var constants = require('../common/constants.json')['serviceNames'];
var Logger = require('../common/logger.js').Logger;
var logger = new Logger(constants.eventsServiceName, null, app.get('env') === 'development');
var accesslogger = require('../common/accesslogger.js');

logger.get().debug('Starting %s.....', constants.eventsServiceName);

app.use(accesslogger.getAccessLogger(logger));

var bodyParser = require('body-parser');
var config = require('../common/config.json')[app.get('env')];
var helpers = require('../common/helpers.js');
var eventsController = require('./routes/eventscontroller.js')(config, logger);
var BadRequestException = require('../common/badrequestexception.js');
var ForbiddenException = require('../common/forbiddenexception.js');
var NotFoundException = require('../common/notfoundexception.js');
var errorcode = require('../common/errorcode.json');

app.set('view engine', 'ejs');

app.use(bodyParser.json());

app.use('/events', eventsController);

// error handling for other routes
app.use(function(req, res, next) {
    next(new NotFoundException('Resource specified by URL cannot be located.', errorcode.GenericNotFoundException));
});

app.use(function(err, req, res, next) {
    helpers.handleServiceException(err, req, res, constants.eventsServiceName, logger, true);
});

var port = process.env.PORT || config.eventsServicePort;
var server = app.listen(port, function(){
    logger.get().debug('%s started at http://localhost:%d/', constants.eventsServiceName, server.address().port);
});
