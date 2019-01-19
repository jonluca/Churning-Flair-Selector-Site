const path = require('path');
const config = require("../config");
const RedditApi = require("./reddit");
const db = require("./db");
const log = require('simple-node-logger').createSimpleLogger(path.join(__dirname, '../logs/activity.log'));

const postPath = '/api/submit';
const reddit = new RedditApi({
  app_id: config.mod_script_id,
  app_secret: config.mod_script_secret,
  redirect_uri: config.redirect
});

let PostController = {};

PostController.createNewPost = (title, body, id, shouldSticky = true, cb) => {
// Call authenticated POST endpoint
  reddit.post(
    postPath,
    {
      api_type: 'json',
      kind: 'self',
      nsfw: false,
      text: body,
      title: title,
      sr: config.subreddit
    },
    function (error, response, body) {
      console.log(body);
      if (error) {
        log.error(error);
        return cb(false);
      }
      const resp = JSON.parse(body);
      const data = resp.json.data;

      db.insertCreatedPost(data.id, title, id, resp => {
        if (resp) {
          log.info(`Successfully saved post with id: ${data.id} in db`);
          return;
        }
        log.error(`Error saving post with id: ${data.id} in db!`);
      });

      log.info(`Submitted post at ${(new Date()).toISOString()} with link ${data.url}`);
      return cb(true);
    }
  );
};

PostController.removePost = (post, cb) => {

};

PostController.archiveOldById = id => {

};
PostController.refreshToken = (cb = _ => {
}) => {
  // Authenticate with username/password
  reddit.passAuth(
    config.mod_username,
    config.mod_password,
    function (success) {
      if (success) {
        log.info("Successfully signed into mod account");
        cb(true);
      } else {
        log.error("Error signing into mod account for flair assignment! Does config.js have the mod_username and mod_password fields?");
        process.exit(1);
      }
    }
  );
};

PostController.refreshToken(_ => {
  PostController.createNewPost("bot test", "# testing markdown\nand new lines", 0, true, _ => {
  });
});

// Refresh the token every 30 minutes
setInterval(_ => {
  PostController.refreshToken();
  log.info("Refreshed access token");
}, 1000 * 60 * 30);

module.exports = PostController;