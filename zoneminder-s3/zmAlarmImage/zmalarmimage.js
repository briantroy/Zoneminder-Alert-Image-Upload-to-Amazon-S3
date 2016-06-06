
var zmAlarmImage = function () {

    var imgData;
    var tLog = "false";
    this.req;

    var buildFilePath = function () {
        var dtFrame = new Date(imgData.starttime);
        var frameId = imgData.frameid;
        var monitorName = imgData.monitor_name;
        /* get a two digit year for the file path */
        var tYear = dtFrame.getFullYear();
        tYear = String(tYear).slice(2);
        /* Month with leading zeros */
        var tMonth = String(dtFrame.getMonth() + 1);
        if (tMonth.length == 1) tMonth = "0" + tMonth;
        /* Day with leading zeros */
        var tDay = String(dtFrame.getDate());
        if (tDay.length == 1) tDay = "0" + tDay;
        /* Hours with leading zeros */
        var tHour = String(dtFrame.getHours());
        if (tHour.length == 1) tHour = "0" + tHour;
        /* Minutes... */
        var tMin = String(dtFrame.getMinutes());
        if (tMin.length == 1) tMin = "0" + tMin;
        /* Seconds ... */
        var tSec = String(dtFrame.getSeconds());
        if (tSec.length == 1) tSec = "0" + tSec;

        frameId = String(frameId);
        if (frameId.length == 1) frameId = "0000" + frameId;
        if (frameId.length == 2) frameId = "000" + frameId;

        return imgData.image_base_path + "/" + monitorName +
            "/" + tYear + "/" + tMonth +
            "/" + tDay + "/" + tHour + "/" + tMin +
            "/" + tSec + "/" + frameId + "-capture.jpg";
    }

    var that = this;

    this.create = function (data, tLogger) {
        if(typeof(tLogger) != 'undefined') tLog = tLogger;
        imgData = data;
    }

    this.getFilePath = function () {
        return buildFilePath();
    }

    this.getFrameID = function () {
        return imgData.frameid;
    }

    this.simpleUploadFile = function (mysql_client, fn) {
            if (typeof(imgData) == 'undefined' || typeof(imgData.frame_timestamp) == 'undefined') {
                if(tLog != "false") {
                    tLog.writeLogMsg("This Image is bad:", "warning");
                    tLog.writeLogMsg(imgData, "warning");
                } else {
                    console.log("NOTICE-ZMALARMIMAGE-ERROR: " + Date().toString() + " - This Image is bad: ");
                    console.log("NOTICE-ZMALARMIMAGE: " + Date().toString() + " - " + imgData);
                }
                fn();
                return;
            }

            dtFrame = new Date(imgData.frame_timestamp);
            dtStartEv = new Date(imgData.starttime);
            /* Make our folder name */
            var awsFolder = imgData.monitor_name + "-" + dtFrame.getFullYear() +
                "-" + (dtFrame.getMonth() + 1) + "-" + dtFrame.getDate() + "/hour-" + dtFrame.getHours();
            if(imgData.event_name == "New Event") imgData.event_name = "New_Event";
            var awsFile = imgData.event_name + "-" + imgData.eventid + "-" + "frame" + imgData.frameid + "-" +
                dtFrame.getHours() + "-" + dtFrame.getMinutes() + "-" +
                dtFrame.getSeconds() + ".jpg";


            var fileName = buildFilePath();
            if(tLog != "false") {
                tLog.writeLogMsg("The file: " + fileName + " will be saved to: " + awsFolder + "/" + awsFile, "info");
            } else {
                console.log("NOTICE-ZMALARMIMAGE: " + Date().toString() + " - The file: " + fileName + " will be saved to: " + awsFolder + "/" + awsFile);
            }
            //console.log("DEBUG-ZMALARMIMAGE: " + Date().toString() + " - Getting file...");

            //console.log("DEBUG-ZMALARMIMAGE: " + Date().toString() + " - Getting client...");
            var s3client = new require("./s3-client.js").s3Client();
            var reqHead = {
                                    'Content-Type':'image/jpeg',
                                    'x-amz-acl':'private',
                                    'x-amz-storage-class':'REDUCED_REDUNDANCY'

            };
            s3client.kclient.putFile(fileName, ("/" + awsFolder + "/" + awsFile), reqHead, function(err) {
                if (err) {
                    tLog.writeErrMsg(err, "error");
                    fn();
                    // throw err;
                } else {
                    if(tLog != "false") {
                        tLog.writeLogMsg("The file: " + fileName + " was saved to " + (awsFolder + "/" + awsFile), "info");
                    } else {
                        console.log("NOTICE-ZMALARMIMAGE: " + Date().toString() + " - The file: " + fileName + " was saved to " + (awsFolder + "/" + awsFile));
                    }
                    var query = "insert into alarm_uploaded(frameid,eventid,upload_timestamp) " +
                        "values(?,?,now())";
                    var aryBind = new Array(imgData.frameid, imgData.eventid);
                    var insQuery = mysql_client.query(query, aryBind, function (err, results) {
                        // console.log(results);
                        if (err) {
                            if(tLog != "false") {
                                tLog.writeErrMsg(err, "warning");
                            } else {
                                console.log("NOTICE-ZMALARMIMAGE-ERROR: " + Date().toString() + " - " + err);
                            }
                        } else {
                            if(tLog != "false") {
                                tLog.writeLogMsg("Insert Query Complete. FrameID: " +
                                    imgData.frameid + " EventID: " + imgData.eventid, "info");
                            } else {
                                console.log("NOTICE-ZMALARMIMAGE: " + Date().toString() + " - Insert Query Complete. FrameID: " +
                                    imgData.frameid + " EventID: " + imgData.eventid);
                            }
                            /* do the recursive call */
                            fn();
                        }

                    });
                }

            });
        }


    return this;
};


module.exports.zmAlarmImage = zmAlarmImage;
