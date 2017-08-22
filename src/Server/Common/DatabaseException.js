'use strict';

var errorcodes = require('./errorcode.json');
var ExceptionBase = require('./exceptionbase.js');

module.exports = class DatabaseException extends ExceptionBase{  
    constructor(docdbErr){
        var parsedBody;
        try{
            if (docdbErr){
                parsedBody = JSON.parse(docdbErr.body);
            }
        }
        catch(e){
        }

        var message;
        var httpcode = 503;
        var errorcode;

        if (typeof(docdbErr.code) === 'number'){
            httpcode = docdbErr.code;
        }
        else{
            errorcode = docdbErr.code;
        }
        if (parsedBody){
            message = parsedBody.message;
        }
        else{
            message = 'Unknown database error';
        }

        super(message, 'DatabaseException', errorcodes.GenericDatabaseException, httpcode, errorcode);
    }
}
