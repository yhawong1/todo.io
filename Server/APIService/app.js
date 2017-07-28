'use strict';

var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var request = require('request-promise');
var uuid = require('node-uuid');
var path = require('path');
var qs = require('qs');

var app = express();

var serviceNames = require('../common/constants.json')['serviceNames'];
var urlNames = require('../common/constants.json')['urlNames'];
var Logger = require('../common/logger.js').Logger;
var logger = new Logger(serviceNames.apiServiceName, null, app.get('env') === 'development');
var accesslogger = require('../common/accesslogger.js');
var etag = require('etag');
app.use(accesslogger.getAccessLogger(logger));

var config = require('../common/config.json')[app.get('env') || 'production'];
require('./apiservicepassport.js')(passport, config, logger);
var cors = require('cors');
var loginController = require('./routes/logincontroller.js')(config, logger);
var userAuthController = require('./routes/userauthcontroller.js')(config, logger);
var userDetailsController = require('./routes/userdetailscontroller.js')(config, logger);
var eventsController = require('./routes/eventscontroller.js')(config, logger);
var groupsController = require('./routes/groupscontroller.js')(config, logger);
var grouplinksController = require('./routes/grouplinkscontroller.js')(config, logger);
var corsController = require('./routes/corscontroller.js')(config, logger);
var helpers = require('../common/helpers.js');
var BadRequestException = require('../common/badrequestexception.js');
var NotFoundException = require('../common/notfoundexception.js');
var ForbiddenException = require('../common/forbiddenexception.js');
var UnauthorizedException = require('../common/unauthorizedexception.js');
var HttpRequestException = require('../common/httprequestexception.js');
var errorcode = require('../common/errorcode.json');
var corsOrigin = require('../common/constants.json')['corsOrigin'];

logger.get().debug('Starting %s.....', serviceNames.apiServiceName);

app.set('view engine', 'ejs');

app.use(passport.initialize());

// enable CORS for all requests first
app.use('/', corsController);

var defaultCorsOptions = {
    origin : corsOrigin, 
    methods : ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders : ['Content-Type'],
    exposedHeaders : ['Version'],
    optionsSuccessStatus : 200,
    preflightContinue : true,
    credentials : true
};

app.use('/', cors(defaultCorsOptions), bodyParser.json(), function (req, res, err, next){
    if (err){
        throw new BadRequestException('Invalid Body', errorcode.InvalidBody);
    }
    else{
        next();
    }    
});

// attach activity id to all requests
app.use('/', cors(defaultCorsOptions), function (req, res, next){
    var activityid = uuid.v4();
    req.headers['activityid'] = activityid;
    logger.get().debug({req : req}, 'Attach ActivityId %s to request.', activityid);
    next();
});

// all requests are subject to version header check
app.use('/', cors(defaultCorsOptions), function (req, res, next){
    if (!req.headers['version']){
        throw new BadRequestException('Cannot find version in header.', errorcode.VersionNotFoundInHeader);
    }
    else{
        next();
    }
});

var getEventsCorsOptions = {
    origin : corsOrigin, 
    methods : ['GET'],
    allowedHeaders : ['Content-Type'],
    exposedHeaders : ['Version'],
    optionsSuccessStatus : 200,
    preflightContinue : true,
    credentials : true
};

// anonymous events retrieval
app.get('/events', cors(getEventsCorsOptions), helpers.wrap(function *(req, res, next){
    var queryString = qs.stringify(req.query);

    if (!queryString || queryString.length <= 0){
        var url = config.eventsServiceEndpoint + '/' + urlNames.events;
        var options = helpers.getRequestOption(req, url, 'GET'); 
        var results = yield *helpers.forwardHttpRequest(options, serviceNames.eventsServiceName);
        res.setHeader('Etag', etag(results));
        res.status(200).json(JSON.parse(results));
    }
    else{
        next();
    }
}));

app.use('/login', loginController);

var userAuthCorsOptions = {
    origin : corsOrigin, 
    methods : ['POST', 'PUT', 'DELETE'],
    allowedHeaders : ['Content-Type'],
    exposedHeaders : ['Version'],
    optionsSuccessStatus : 200,
    preflightContinue : true,
    credentials : true
};

// forward this to userAuth service before token authenication
// kicks in because this is userAuth creation
app.post('/userauth', cors(userAuthCorsOptions), helpers.wrap(function *(req, res){
    var options = helpers.getRequestOption(req, config.userAuthServiceEndpoint + '/userauth', 'POST'); 
    var results = yield *helpers.forwardHttpRequest(options, serviceNames.userAuthServiceName);
    res.status(201).json(JSON.parse(results));
}));

// all other urls - all APIs are subject to token authentication
app.use('/', cors(defaultCorsOptions), helpers.wrap(function *(req, res, next){
    passport.authenticate('token-bearer', { session: false }, function (err, user, info){
        if (err){
            // token authentication fail.
            throw new UnauthorizedException('Token authentication failed.', errorcode.InvalidToken);
        }
        else{
            // set auth-identity header so that internal services
            // know the caller's identity
            req.headers['auth-identity'] = user;
            logger.get().debug({req : req}, 'Attach auth-identity %s to request header.', user);
            // continue calling middleware in line
            next();
        }
    })(req, res, next);
}));

// other routes
app.use('/userauth', userAuthController);
app.use('/userdetails', userDetailsController);
app.use('/events', eventsController);
app.use('/groups', groupsController);
app.use('/grouplinkss', grouplinksController);

// error handling for other routes
app.use(function(req, res, next) {
    next(new NotFoundException('Resource specified by URL cannot be located.', errorcode.GenericNotFoundException));
});

app.use(function(err, req, res, next) {
    helpers.handleServiceException(err, req, res, serviceNames.apiServiceName, logger, app.get('env') === 'development');
});

var port = process.env.PORT || config.apiServicePort;
var server = app.listen(port, function(){
    logger.get().debug('%s started at http://localhost:%d/', serviceNames.apiServiceName, server.address().port);
});
