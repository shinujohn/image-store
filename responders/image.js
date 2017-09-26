let fs = require('fs');
let Busboy = require('busboy');
let shortId = require('shortid');
let Factory = require('./../providers/factory');
let nconf = require('nconf');

let locator = global.locator;

/**
 * Handles APIs related to image store
 */
class ImageResponder {

    constructor() {
    }

    /**
     * Registeres the APIs
     */
    handle(app) {

        let _this = this;
        let logger = global.locator.logger;

        /**
         * To upload the file (image), saves the file from request to configured storage, and details to database
         */
        app.post('/api/images', function (req, res, next) {


            // Collecting data from request
            var data = {
                id: shortId.generate()
            };
            var busboy = new Busboy({ headers: req.headers });

            // File
            busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {

                // Get the file details
                file.on('end', function () {
                    data['media'] = {
                        filename: filename,
                        encoding: encoding,
                        mimetype: mimetype
                    }
                    logger.debug('File [' + fieldname + '] Finished');
                });

                // Save to the storge
                file.pipe(Factory.getStorageProvider(nconf.get('storage:type')).getWritableStream(data.id, function () { }));
            });

            // Other form data
            busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
                data[fieldname] = val;
            });

            // All done
            busboy.on('finish', function () {

                // Now update the database with the data collected so far
                global.locator.db.insert('image', data).then(function () {

                    // Let everyone know that a new image has been uploaded
                    locator.queue.publish('imageUploaded', data);
                    res.sendStatus(200);
                });
            });

            req.pipe(busboy);
        });

        /**
         * To download the image with given ID, gets the details from database and reads the file from the storage
         */
        app.get('/api/images/:id', function (req, res, next) {

            // Get the image properties from DB first
            global.locator.db.findOne('image', { id: req.params.id }).then(function (result) {

                // Read file from storage and write to response
                res.setHeader('Content-disposition', 'attachment; filename=' + result.media.filename);
                res.setHeader('Content-type', result.media.mimetype);
                Factory.getStorageProvider(nconf.get('storage:type')).getReadableStream(result.id, res, function (error, result, response) { });
            });
        })
    }
}

module.exports = new ImageResponder();