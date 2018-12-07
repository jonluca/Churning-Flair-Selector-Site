const fs = require('fs');
const path = require('path');
const config = require("../config");
const RedditApi = require("./reddit");

const flairPath = `/r/${config.subreddit}/api/flair`;

const reddit = new RedditApi({
  app_id: config.mod_script_id,
  app_secret: config.mod_script_secret,
  redirect_uri: config.redirect
});
// Authenticate with username/password
reddit.passAuth(
  config.mod_username,
  config.mod_password,
  function (success) {
    if (success) {
      console.log("Successfully signed into mod account");
    } else {
      console.error("Error signing into mod account for flair assignment! Does config.js have the mod_username and mod_password fields?");
      process.exit(1);
    }
  }
);
const jsonPath = path.join(__dirname, '..', 'public', 'data', 'flairs.json');

let FlairController = {};
FlairController.flairs = [];

FlairController.loadFlairs = _ => {
  fs.readFile(jsonPath, 'utf8', (err, fileContent) => {
    if (err) {
      console.error("Error reading flairs JSON from disk! Does public/data/flairs.json exist?");
      console.error(err);
      process.exit(1);
    } else {
      try {
        FlairController.flairs = JSON.parse(fileContent.toString());
      } catch (e) {
        console.error("Error parsing flairs from JSON! Is public/data/flairs.json valid?");
        console.error(e);
        process.exit(1);
      }
    }
  });
};

FlairController.isValidFlair = flair => {
  for (const validFlair of FlairController.flairs) {
    if (validFlair.iata === flair) {
      return true;
    }
  }
  return false;
};

FlairController.setUserFlair = (user, flair, cb) => {
  // Call authenticated POST endpoint
  reddit.post(
    flairPath,
    {
      api_type: 'json',
      text: flair,
      name: user
    },
    function (error, response, body) {
      if (error) {
        console.error(error);
        return cb(false);
      }
      return cb(true);
    }
  );
};

module.exports = FlairController;