'use strict'

var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var app = express();

var constants = require('../common/constants.json')['serviceNames'];
var Logger = require('../common/logger.js').Logger;
var logger = new Logger(constants.userAuthServiceName, null, app.get('env') === 'development');
var accesslogger = require('../common/accesslogger.js');

logger.get().debug('Starting %s.....', constants.userAuthServiceName);

app.use(accesslogger.getAccessLogger(logger));

var config = require('../common/config.json')[app.get('env') || 'production'];

require('./userauthpassport.js')(passport, config, logger);
var loginController = require('./routes/logincontroller.js')(passport, config, logger);
var userAuthController = require('./routes/userauthcontroller.js')(passport, config, logger);
var helpers = require('../common/helpers.js');

var NotFoundException = require('../common/notfoundexception.js');
var errorcode = require('../common/errorcode.json');

app.set('view engine', 'ejs');

app.use(bodyParser.json());

app.use(passport.initialize());

// login
app.use('/login', loginController);
app.use('/userauth', userAuthController);

// error handling for other routes
app.use(function(req, res, next) {
    next(new NotFoundException('Resource specified by URL cannot be located.', errorcode.GenericNotFoundException));
});

app.use(function(err, req, res, next) {
    helpers.handleServiceException(err, req, res, constants.userAuthServiceName, logger, true);
});

var port = process.env.PORT || config.userAuthServicePort;
var server = app.listen(port, function(){
    logger.get().debug('%s started at http://localhost:%d/', constants.userAuthServiceName, server.address().port);
});
