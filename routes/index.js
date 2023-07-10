const express = require("express");
const router = express.Router();
const RedditApi = require("../controller/reddit");
const FlairController = require("../controller/flair");
const config = require("../config");
const randomstring = require("randomstring");
const path = require("path");
const log = require("simple-node-logger").createSimpleLogger(
  path.join(__dirname, "../logs/activity.log")
);

const reddit = new RedditApi({
  app_id: config.web_app_id,
  app_secret: config.web_app_secret,
  redirect_uri: config.redirect,
});

const cookieOptions = {
  maxAge: 1000 * 60 * 15, // would expire after 15 minutes
  httpOnly: true, // The cookie only accessible by the web server
  signed: true, // Indicates if the cookie should be signed
};
FlairController.loadFlairs();
/* GET home page. */
router.get("/:var(about)?", function (req, res, next) {
  const state = randomstring.generate({
    length: 12,
    charset: "alphabetic",
  });

  // Set cookie
  res.cookie("state", state, cookieOptions);
  let redirecturl = reddit.oAuthUrl(state, "identity", "temporary");
  res.render("index", {
    redirect_url: redirecturl,
    subreddit: config.subreddit,
  });
});

/* GET auth callback page. */
router.get("/auth", function (req, res, next) {
  const state = req.query.state;
  const cookieState = req.signedCookies["state"];
  if (cookieState !== state) {
    res.status(400);
    return res.render("error", {
      message: "Invalid session state! Please try again later.",
      error: {},
      subreddit: config.subreddit,
    });
  }
  // Generate a new reddit instance so as to not pollute the global helper instance
  const redditUserInstance = new RedditApi({
    app_id: config.web_app_id,
    app_secret: config.web_app_secret,
    redirect_uri: config.redirect,
  });
  redditUserInstance.oAuthTokens(state, req.query, function (success) {
    if (!success) {
      res.status(500);
      return res.render("error", {
        message:
          "Unknown reddit authentication error occurred! Please try again later.",
        error: {},
        subreddit: config.subreddit,
      });
    }

    // Set cookie
    res.cookie("access_token", redditUserInstance.access_token, cookieOptions);

    // Redirect them to actual flair picker
    res.redirect("/flair");
  });
});

/* GET flair selector page. */
router.get("/flair", function (req, res, next) {
  if (!req.signedCookies["access_token"]) {
    res.status(301);
    return res.redirect("/");
  }

  // Generate a new reddit instance so as to not pollute the global helper instance
  const redditUserInstance = new RedditApi({
    app_id: config.web_app_id,
    app_secret: config.web_app_secret,
    redirect_uri: config.redirect,
    access_token: req.signedCookies["access_token"],
  });

  redditUserInstance.get("/api/v1/me", {}, function (error, response, body) {
    let user = body;
    if (typeof body === "string") {
      try {
        user = JSON.parse(body);
      } catch (e) {
        error = e;
      }
    }
    if (error || !user.name) {
      log.error("Error requesting personal account info!");
      log.error(error);
      res.status(500);
      return res.render("error", {
        message:
          "Error requesting reddit account information, please try again later!",
        error: {},
        subreddit: config.subreddit,
      });
    }

    return res.render("flair", {
      name: user.name,
      subreddit: config.subreddit,
    });
  });
});

function setFlair(redditUserInstance, flair, res) {
  redditUserInstance.get("/api/v1/me", {}, function (error, response, body) {
    let user = body;
    if (typeof body === "string") {
      try {
        user = JSON.parse(body);
      } catch (e) {
        error = e;
      }
    }
    if (error || !user.name) {
      log.error("Error requesting personal account info!");
      log.error(error);
      res.status(500);
      return res.render("error", {
        message:
          "Error requesting reddit account information, please try again later!",
        error: {},
      });
    }
    FlairController.setUserFlair(user.name, flair, (success) => {
      if (success) {
        return res.status(200).end();
      }
      return res.status(500).end();
    });
  });
}

/* GET flair selector page. */
router.post("/save", function (req, res, next) {
  const shouldDelete = req.body.delete;
  const flairSelection = req.body.flair;
  let flairs = [];
  if (!shouldDelete) {
    if (!flairSelection) {
      res.status(403);
      return res.end();
    }
    flairs = flairSelection.split(",");
    for (const flair of flairs) {
      if (!FlairController.isValidFlair(flair)) {
        res.status(403);
        return res.end();
      }
    }
  }

  // Generate a new reddit instance so as to not pollute the global helper instance
  const redditUserInstance = new RedditApi({
    app_id: config.web_app_id,
    app_secret: config.web_app_secret,
    redirect_uri: config.redirect,
    access_token: req.signedCookies["access_token"],
  });
  if (shouldDelete) {
    setFlair(redditUserInstance, "", res);
    return;
  }
  setFlair(redditUserInstance, flairs.join(", "), res);
});

module.exports = router;
