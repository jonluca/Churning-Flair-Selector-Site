const path = require("path");
const config = require("../config");
const RedditApi = require("./reddit");
const db = require("./db");
const log = require("simple-node-logger").createSimpleLogger(
  path.join(__dirname, "../logs/activity.log")
);

const postPath = "/api/submit";
const removePath = "/api/remove";

const reddit = new RedditApi({
  app_id: config.mod_script_id,
  app_secret: config.mod_script_secret,
  redirect_uri: config.redirect,
});

let PostController = {};

PostController.createNewPost = (
  title,
  body,
  id,
  shouldSticky = true,
  cb = new Function()
) => {
  // Call authenticated POST endpoint
  reddit.post(
    postPath,
    {
      api_type: "json",
      kind: "self",
      nsfw: false,
      text: body,
      title: title,
      sr: "churningtest", // set it to churning test during testing week
      // sr: config.subreddit
    },
    function (error, response, body) {
      if (error) {
        log.error(error);
        return cb(false);
      }
      const resp = JSON.parse(body);
      const data = resp.json.data;

      db.insertCreatedPost(data.name, title, data.url, id, (resp) => {
        if (resp) {
          log.info(`Successfully saved post with id: ${data.id} in db`);
          return;
        }
        log.error(`Error saving post with id: ${data.id} in db!`);
      });

      log.info(
        `Submitted post at ${new Date().toISOString()} with link ${data.url}`
      );
      return cb(true);
    }
  );
};

PostController.removePost = (redditId, cb = new Function()) => {
  reddit.post(
    removePath,
    {
      id: redditId,
      spam: false,
    },
    function (error, response, body) {
      if (error) {
        log.error(error);
        return cb(false);
      }
      const resp = JSON.parse(body);
      console.log(resp);
      return cb(true);
    }
  );
};

PostController.archiveOldById = (id) => {
  db.getCreatedPostsByScheduledIdNotRemoved(id, 10, (posts) => {
    for (const post of posts) {
      PostController.removePost(post.reddit_id, (didSucceed) => {
        if (!didSucceed) {
          log.error(
            `Error removing post ${post.title} with id ${post.reddit_id}`
          );
          return;
        }
        db.setPostAsRemoved(post.id, true, (removed) => {
          if (!removed) {
            log.error(
              `Error removing post ${post.title} with id ${post.reddit_id}`
            );
            return;
          }
          log.info(`Removed post ${post.title} with id ${post.reddit_id}`);
        });
      });
    }
  });
};
PostController.refreshToken = (cb = (_) => {}) => {
  // Authenticate with username/password
  reddit.passAuth(config.mod_username, config.mod_password, function (success) {
    if (success) {
      log.info("Successfully signed into mod account");
      cb(true);
    } else {
      log.error(
        "Error signing into mod account for flair assignment! Does config.js have the mod_username and mod_password fields?"
      );
      process.exit(1);
    }
  });
};

// Refresh the token every 30 minutes
setInterval((_) => {
  PostController.refreshToken();
  log.info("Refreshed access token");
}, 1000 * 60 * 30);
PostController.refreshToken((_) => {});

module.exports = PostController;
