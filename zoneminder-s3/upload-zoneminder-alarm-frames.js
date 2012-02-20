/**
 * User: brian.roy
 * Date: 2/3/12
 * Time: 12:58 PM
 *
 * This Node.js app will scan for new alarm frames in Zoneminder.
 * When it finds them it uploads them to Amazon S3
 *
 *
 */

/* Get our Configuration... */


var zmConfig = require('./zms3Config').zms3Config();

/* Local stuff */

var isComplete = true;
var uploadIdx = 0;
var aryRows;
var t;
var countNotReady = 0;
var tLog;

/* DB Connection */
var mysql = require('mysql');
var client = mysql.createClient({
    user: zmConfig.DBUSR,
    password: zmConfig.DBPWD,
    host: zmConfig.DBHOST,
    database: zmConfig.DBNAME
});
if(typeof(zmConfig.mongoStoreConfig) != 'undefined') {
    var mDbs = require("./storetomongo").storeToMongo();

    mDbs.createMDB(zmConfig.mongoStoreConfig.host, zmConfig.mongoStoreConfig.port,
            zmConfig.mongoStoreConfig.db, zmConfig.mongoStoreConfig.collection,
            zmConfig.mongoStoreConfig.username, zmConfig.mongoStoreConfig.password, function(err) {

        tLog = require('./tLogger').tLogger();
        tLog.createLogger(zmConfig.LOGFILEBASE, true, zmConfig.mongoLogConfig);

        if(err) {
            tLog.writeErrMsg(err, "error");
            process.exit(1);
        }

        console.log("Logger created...");
        restartProcessing();
    });
} else {
    tLog = require('./tLogger').tLogger();
    tLog.createLogger("zmUpload", true, zmConfig.mongoLogConfig);

    if(err) {
        tLog.writeErrMsg(err, "error");
        process.exit(1);
    }

    console.log("Logger created...");
    restartProcessing();
}

function restartProcessing() {
    if(isComplete) {
        tLog.writeLogMsg("Getting more frames to process.", "info");
        countNotReady = 0;
        getFrames();
        t = setTimeout(restartProcessing,3000);
    } else {
        // tLog.writeLogMsg("Not ready for more frames yet...", "info");
        countNotReady = countNotReady + 1;
        t = setTimeout(restartProcessing,3000);
        if(countNotReady > 120) {
            isComplete = true;
            process.exit(1);
            countNotReady = 0;
        }
    }
}

function getFrames() {
    var q1s = new Date();
    q1s = q1s.getTime();
    var query1 = client.query(zmConfig.zmQuery, [zmConfig.FTYPE, zmConfig.MAXRECS]);

    var idx = 0;
    aryRows = new Array();
    query1.on('row', function gotRow(row) {
        // //tLog.writeLogMsg(row, "DEBUG");
        row.image_base_path = zmConfig.IMGBASEPATH;
        aryRows[idx] = row;
        idx = idx + 1;
    });

    query1.on("end", function doEnd1() {
        var ms = new Date();
        var dur =  ms.getTime() - q1s;
        tLog.writeLogMsg(aryRows.length + " un-uploaded frames found in: " + dur + " milliseconds", "info");
        // console.log("info: - " + Date().toString() + " - " + aryRows.length + " un-uploaded frames found in: " + dur + " milliseconds")

        uploadIdx = 0;
        if(aryRows.length == 0) {
            isComplete = true;
        } else {
            isComplete = false;
        }
        var maxInit = zmConfig.MAXCONCURRENTUPLOAD - 1;
        if(aryRows.length < zmConfig.MAXCONCURRENTUPLOAD) {
            maxInit = aryRows.length - 1
            isComplete = true;
        }
        if(aryRows.length == 0) {
            isComplete = true;
        } else {
            isComplete = false;
        }
        // maxInit = aryRows.length;
        for(var i=0; i<=maxInit; i=i+1) {
            // tLog.writeLog("Iteration number: " + i);
            /* Start child process to upload single file */
            /* insert to mongo... */
            var tRow = aryRows[i];
            tRow.upload_uxts = +new Date();
            tRow.upload_timestamp = Date().toString();
            if(typeof(zmConfig.mongoStoreConfig) != 'undefined') {
                mDbs.storeRow(tRow, function(err){
                    if(err) tLog.writeErrMsg(err, "warning");
                });
            }
            var zmImg = new require("./zmAlarmImage/zmalarmimage.js").zmAlarmImage();
            zmImg.create(aryRows[i], tLog);
            zmImg.simpleUploadFile(client, uploadNext);

        }
        // isComplete = true;
        uploadIdx = i;
    });
}

function uploadNext() {

    // Only recurs if there is another row to process.
    // tLog.writeLog(typeof(aryRows));
    if(typeof(aryRows[uploadIdx]) != 'undefined') {
        //tLog.writeLogMsg("Processing Upload Number: " + uploadIdx);
        var tRow = aryRows[uploadIdx];
        tRow.upload_uxts = +new Date();
        tRow.upload_timestamp = Date().toString();
        if(typeof(zmConfig.mongoStoreConfig) != 'undefined') {
            mDbs.storeRow(tRow, function(err){
                if(err) tLog.writeErrMsg(err, "warning");
            });
        }
        var zmImg = new require("./zmAlarmImage/zmalarmimage.js").zmAlarmImage();
        zmImg.create(aryRows[uploadIdx], tLog);
        uploadIdx = uploadIdx + 1;
        zmImg.simpleUploadFile(client, uploadNext);


    } else {
        //tLog.writeLogMsg("No more files to upload...", "info");
        isComplete = true;
    }
}
