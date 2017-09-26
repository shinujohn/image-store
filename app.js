// imports
let express = require('express');
let shortId = require('shortid');
let path = require("path");
let fs = require('fs');
let nconf = require('nconf');

let app = express();
let setupFilesPath = path.join(__dirname, "setup");
let respondersPath = path.join(__dirname, "responders");
let setpInProgress = [];

nconf.argv()
    .env()
    .file({ file: path.join(__dirname, 'config.json') });

// Run all setup
fs.readdirSync(setupFilesPath).forEach(function (setupFile) {
    setpInProgress.push(require(`./setup/${setupFile}`).init(app));
});

// Wait for the setup to complete
Promise.all(setpInProgress).then(function () {

    let logger = global.locator.logger;
    logger.debug('setup complete');

    // Register APIs
    fs.readdirSync(respondersPath).forEach(function (responder) {
        require(`./responders/${responder}`).handle(app);
        logger.debug(`${responder}`);
    });

    // Now start the web app
    let port = process.env.PORT || 3030;
    app.listen(port, function () {
        logger.debug(`app listening on port ${port}!`);
    });

}).catch(function (err) {
    console.error('setup error: ');
    console.error(err);
});