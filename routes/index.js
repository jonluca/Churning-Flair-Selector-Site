const express = require('express');
const router = express.Router();
const RedditApi = require('../controller/reddit');
const FlairController = require('../controller/flair');
const config = require("../config");
const randomstring = require("randomstring");

const reddit = new RedditApi({
  app_id: config.web_app_id,
  app_secret: config.web_app_secret,
  redirect_uri: config.redirect
});
FlairController.loadFlairs();
/* GET home page. */
router.get('/:var(about)?', function (req, res, next) {
  req.session.state = randomstring.generate({
    length: 12,
    charset: 'alphabetic'
  });
  let redirecturl = reddit.oAuthUrl(req.session.state, 'identity', 'temporary');
  res.render('index', {
    redirect_url: redirecturl
  });
});

/* GET home page. */
router.get('/temp', function (req, res, next) {
  return res.render('flair', {
    name: 'jonluca'
  });
});

/* GET auth callback page. */
router.get('/auth', function (req, res, next) {
  const state = req.query.state;
  if (req.session.state !== state) {
    res.status(400);
    return res.render('error', {
      message: "Invalid session state! Please try again later.",
      error: {}
    });
  }
  // Generate a new reddit instance so as to not pollute the global helper instance
  const redditUserInstance = new RedditApi({
    app_id: config.web_app_id,
    app_secret: config.web_app_secret,
    redirect_uri: config.redirect
  });
  redditUserInstance.oAuthTokens(
    state,
    req.query,
    function (success) {
      if (!success) {
        res.status(500);
        return res.render('error', {
          message: "Unknown reddit authentication error occurred! Please try again later.",
          error: {}
        });
      }
      // Set access and refresh tokens in user state
      req.session.access = redditUserInstance.access_token;
      req.session.refresh = redditUserInstance.refresh_token;

      // Redirect them to actual flair picker
      res.redirect("/flair");
    }
  );
});

/* GET flair selector page. */
router.get('/flair', function (req, res, next) {
  if (!req.session.access) {
    res.status(301);
    return res.redirect('/');
  }

  // Generate a new reddit instance so as to not pollute the global helper instance
  const redditUserInstance = new RedditApi({
    app_id: config.web_app_id,
    app_secret: config.web_app_secret,
    redirect_uri: config.redirect,
    access_token: req.session.access,
    refresh_token: req.session.refresh
  });

  redditUserInstance.get(
    '/api/v1/me',
    {},
    function (error, response, body) {
      let user = body;
      if (typeof body === "string") {
        try {
          user = JSON.parse(body);
        } catch (e) {
          error = e;
        }
      }
      if (error || !user.name) {
        console.error("Error requesting personal account info!");
        console.error(error);
        res.status(500);
        return res.render('error', {
          message: "Error requesting reddit account information, please try again later!",
          error: {}
        });
      }

      return res.render('flair', {
        name: user.name
      });
    }
  );

});

/* GET flair selector page. */
router.post('/save', function (req, res, next) {
  // if (!req.session.access) {
  //   res.status(301);
  //   return res.redirect('/');
  // }
  const flairSelection = req.body.flair;

  if (!flairSelection || !FlairController.isValidFlair(flairSelection)) {
    res.status(403);
    return res.end();
  }

  // Generate a new reddit instance so as to not pollute the global helper instance
  const redditUserInstance = new RedditApi({
    app_id: config.web_app_id,
    app_secret: config.web_app_secret,
    redirect_uri: config.redirect,
    access_token: req.session.access,
    refresh_token: req.session.refresh
  });

  redditUserInstance.get(
    '/api/v1/me',
    {},
    function (error, response, body) {
      let user = body;
      if (typeof body === "string") {
        try {
          user = JSON.parse(body);
        } catch (e) {
          error = e;
        }
      }
      if (error || !user.name) {
        console.error("Error requesting personal account info!");
        console.error(error);
        res.status(500);
        return res.render('error', {
          message: "Error requesting reddit account information, please try again later!",
          error: {}
        });
      }
      FlairController.setUserFlair(user.name, flairSelection, success => {
        if (success) {
          return res.status(200).end();
        }
        return res.status(500).end();
      });
    }
  );

});
module.exports = router;