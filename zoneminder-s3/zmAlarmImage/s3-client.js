/**
 * User: brian.roy
 * Date: 2/4/12
 * Time: 2:16 PM
 *
 * The Amazon S3 (Knox) library client. Configure you secret here...
 */


var s3Client = function() {
    var knox = require("../node_modules/knox");
    var fs = require('fs');
    this.kclient = knox.createClient({
        key: '1QXAHK4F4BTZ495GQ3R2'
      , secret: 'CxNWwovKj4LBgvpN+/FZ7cwCYtEOEDY6PKbWioNz'
      , bucket: 'security-alarms'
    });

    return this;

}

module.exports.s3Client = s3Client;