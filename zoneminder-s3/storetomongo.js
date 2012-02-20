/**
 * User: brian.roy
 * Date: 2/7/12
 * Time: 5:02 PM
 *
 *
 */


var storeToMongo = function() {
    /* Config */

    var MHOST = "localhost"
    var MPORT = 27017;
    var MDB = "default";
    var MUSR = "";
    var MPWD = "";
    var COLLECTION_NAME = 'default';

    var mongodb     = require('mongodb');
    var Db          = mongodb.Db;
    var Connection  = mongodb.Connection;
    var Server      = mongodb.Server;
    var db;
    var col;

    var doSave = function(row, fn) {
        // If not configured explicitly, use defaults..
        if(!db) this.createMDB(MHOST, MPORT, MDB, COLLECTION_NAME, MUSR, MPWD, fn);

        col.insert(row, {safe:true}, function (err, records){
            if(err) fn(err);
            fn();
        });


    }

    this.storeRow = function(row, fn) {
        doSave(row, fn);
    }

    this.getCollection = function() {
        return col;
    }

    this.createMDB = function(host, port, db, collection, user, pwd, fn) {
        MHOST = host;
        MPORT = port;
        MDB = db;
        COLLECTION_NAME = collection;
        MUSR = user;
        MPWD = pwd;

        // set the new db object for SuperviseDB
        db = new Db(MDB, new Server(MHOST, MPORT , {}), {
            native_parser : false
        });

        db.open(function (error, db) {
            if(error) {
                error.inSrc = "storetomongo";
                db.close();
                fn(error);
            }
            db.slaveOk = false;
            db.authenticate(MUSR, MPWD, function(err, p_client) {
                if(err) {
                    console.log("Auth failed with: " + MUSR + ":" + MPWD);
                    err.intSrc = "storetomongo";
                    db.close();
                    fn(err);
                }
                col = new  mongodb.Collection(db, COLLECTION_NAME);
                fn(false, db);
            });


        });

    }



    return this;

}

module.exports.storeToMongo = storeToMongo;