const path = require('path');
const config = require("../config");
const RedditApi = require("./reddit");
const db = require("./db");
const log = require('simple-node-logger').createSimpleLogger(path.join(__dirname, '../logs/activity.log'));

const reddit = new RedditApi({
  app_id: config.mod_script_id,
  app_secret: config.mod_script_secret,
  redirect_uri: config.redirect
});

let PostController = {};

PostController.createNewPost = (title, body, id, shouldSticky = true) => {

};

PostController.removePost = (post, cb) => {

};

PostController.archiveOldById = id => {

};
PostController.refreshToken = _ => {
  // Authenticate with username/password
  reddit.passAuth(
    config.mod_username,
    config.mod_password,
    function (success) {
      if (success) {
        log.info("Successfully signed into mod account");
      } else {
        log.error("Error signing into mod account for flair assignment! Does config.js have the mod_username and mod_password fields?");
        process.exit(1);
      }
    }
  );
};

PostController.refreshToken();

// Refresh the token every 30 minutes
setInterval(_ => {
  PostController.refreshToken();
  log.info("Refreshed access token");
}, 1000 * 60 * 30);

module.exports = PostController;