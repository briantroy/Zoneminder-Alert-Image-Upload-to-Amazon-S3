/**
 * User: brian.roy
 * Date: 2/7/12
 * Time: 5:02 PM
 *
 *
 */


var tLogger = function() {

    var consoleLog = false;
    var winston = require('winston');
    var lLog;
    var eLog;
    var eMongo;
    var useMongo = false;
    var mLog;



    this.createLogger = function(base_name, toConsole, mongoOpts) {
        if(typeof(toConsole) != 'undefined' && toConsole) consoleLog = true;
        if(typeof(mongoOpts) != 'undefined') useMongo = true;
        winston.loggers.add('logLogger', {
            file: {
                filename: base_name + ".log"
            }
        });
        winston.loggers.add('errLogger', {
            file: {
                filename: base_name + ".err"
            }
        });
        if(useMongo) {
            console.log("Using mongo logging...");
            var MongoDB = require('winston-mongodb').MongoDB;
            winston.loggers.add('mongoLogger', {
                MongoDB: mongoOpts
            });
            console.log("Mongo Logging Configured...");

            mLog = winston.loggers.get('mongoLogger');
            mLog.remove(winston.transports.Console);
        }


        lLog = winston.loggers.get('logLogger');
        eLog = winston.loggers.get('errLogger');
        // eLog.handleExceptions();

        if(! consoleLog) {
            lLog.remove(winston.transports.Console);
            eLog.remove(winston.transports.Console);
        }

        this.writeErrMsg("Staring error logger...", "notice");
        this.writeLogMsg("Starting logging...", "info");
    }


    this.writeLogMsg = function(tMsg, tSev) {
        var meta = new Object;
        meta.timestamp = Date().toString();
        meta.uxts = +new Date();
        meta.severity = tSev;
        lLog.log("info", tMsg, meta);
        if(useMongo) mLog.log("info", tMsg, meta);
    }
    this.writeErrMsg = function(tErr, tSev) {
        var meta = new Object;
        meta.timestamp = Date().toString();
        meta.severity = tSev;
        meta.uxts = +new Date()
        eLog.log("error", tErr, meta);
        if(useMongo) mLog.log("error", tErr, meta);
    }

    return this;
}

module.exports.tLogger = tLogger;



