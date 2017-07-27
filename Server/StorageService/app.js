'use strict'

var express = require('express');
var app = express();

var constants = require('../common/constants.json')['serviceNames'];
var Logger = require('../common/logger.js').Logger;
var logger = new Logger(constants.storageServiceName, null, app.get('env') === 'development');
var accesslogger = require('../common/accesslogger.js');

logger.get().debug('Starting %s.....', constants.storageServiceName);

app.use(accesslogger.getAccessLogger(logger));

var bodyParser = require('body-parser');
var config = require('../common/config.json')[app.get('env')];
var helpers = require('../common/helpers.js');

var storageController = require('./routes/storagecontroller.js')(config, logger);
var BadRequestException = require('../common/badrequestexception.js');
var ForbiddenException = require('../common/forbiddenexception.js');
var NotFoundException = require('../common/notfoundexception.js');
var errorcode = require('../common/errorcode.json');

app.set('view engine', 'ejs');

app.use(bodyParser.json());

app.use('/storage', storageController);

// error handling for other routes
app.use(function(req, res, next) {
    next(new NotFoundException('Resource specified by URL cannot be located.', errorcode.GenericNotFoundException));
});

app.use(function(err, req, res, next) {
	console.log(err);
    helpers.handleServiceException(err, req, res, constants.storageServiceName, logger, true);
});

var port = process.env.PORT || config.storageServicePort;
var server = app.listen(port, function(){
    logger.get().debug('%s started at http://localhost:%d/', constants.storageServiceName, server.address().port);
});
