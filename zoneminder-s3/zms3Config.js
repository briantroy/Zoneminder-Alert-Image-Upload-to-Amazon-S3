/**
 * User: brian.roy
 * Date: 2/20/12
 * Time: 12:58 PM
 *
 * Configuration for Zoneminder S3 Uploader.
 *
 *
 */

var zms3Config = function() {
    /*
    * Comment this out to disable logging to MongoDB
    *
    * MongoDB Log Configuration.
    */
    this.mongoLogConfig = {
        host: "127.0.0.1",
        db: "syslogs",
        collection: "zmUpload",
        username: "syslogger",
        password: "0okmju7"
    };

    /*
    * Comment this out to disable storage of rows to MongoDB
    *
    * MongoDB configuraiton for storage of the information about
    * every alarm image found/sent to Amazon S3
    *
    */
    this.mongoStoreConfig = {
        host: "localhost",
        port: 27017,
        db: "zmalarms",
        username: "zms3usr",
        password: "0okmju7",
        collection: 'alarm-files',
        options: {
            auto_reconnect: true,
            poolSize: 4,
            socketOptions: { keepAlive: 100 }
        }
    };

    /*
    * The "type" of frame to look for in the Zoneminder DB
    * This SHOULD NOT be changed.
    */
    this.FTYPE = "Alarm";
    /*
    * Maximum number of alarm frames to fetch from the DB in a single pass.
     */
    this.MAXRECS = 400;
    /* Database host (mysql) - zoneminder DB */
    this.DBHOST = "royhomepc02.santan.brianandkelly.ws";
    /* Database user name, must have select on zoneminder tables */
    this.DBUSR = "brian.roy";
    /* Database user's password */
    this.DBPWD = "Is@b3l10";
    /* Database name for zoneminder */
    this.DBNAME = "zm";
    /* Base path where your zoneminder events are stored. */
    this.IMGBASEPATH = "/u01/zoneminder/events";
    /* Max concurrent uploads... these will be executed non-blocking
    * and the next batch will wait until this batch has completed.
     */
    this.MAXCONCURRENTUPLOAD = 10;

    /*
    * The base path & file name prefix for your log files.
    * A .log and .err file will be created based on this.
     */
    this.LOGFILEBASE = "/Volumes/Workspace/Personal/nodejs/zoneminder-s3/trunk/zmUpload";

    /* Base query used to get alarm frames from the zoneminder DB.
    * Only change this if you:
    * 1) Have customized your zoneminder DB somehow
    * 2) REALLY know what you are doing.
     */
    this.zmQuery = "select f.frameid, f.timestamp as frame_timestamp, f.score, " +
        "e.name as event_name, e.starttime, m.name as monitor_name, " +
        "au.upload_timestamp, f.eventid " +
        "from Frames f " +
        "join Events e on f.eventid = e.id " +
        "join Monitors m on e.monitorid = m.id " +
        "left join alarm_uploaded au on (au.frameid = f.frameid and au.eventid = f.eventid) " +
        "where f.type = ? " +
        "and f.timestamp > '2012-02-05 00:00:00' and upload_timestamp is null limit 0,?";

    return this;
}

module.exports.zms3Config = zms3Config;