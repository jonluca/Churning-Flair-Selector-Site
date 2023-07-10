const express = require("express");
const router = express.Router();
const Scheduler = require("../controller/scheduler");
const db = require("../controller/db");
const ArchiveController = require("../controller/archive");

db.init((_) => {
  Scheduler.refresh();
  ArchiveController.createArchiveHtml();
});

/* GET auth callback page. */
router.get("/", function (req, res, next) {
  res.render("admin.ejs");
});

router.get("/posts", function (req, res, next) {
  db.getAllScheduledPosts((posts) => {
    if (!posts && !Array.isArray(posts)) {
      return res.status(500).end();
    }
    return res.send(posts);
  });
});

router.post("/posts/new", function (req, res, next) {
  let post = {};
  post.body = req.body.body;
  post.title = req.body.title;
  post.frequency = req.body.frequency;
  post.time = req.body.time;
  if (
    [post.body, post.title, post.frequency, post.time].indexOf(undefined) !== -1
  ) {
    return res.status(401);
  }
  db.createNewScheduledPost(post, (status) => {
    Scheduler.refresh();
    if (!status) {
      return res.status(500).end();
    }
    return res.status(200).end();
  });
});

router.post("/posts/update", function (req, res, next) {
  let post = {};
  post.body = req.body.body;
  post.title = req.body.title;
  post.frequency = req.body.frequency;
  post.time = req.body.time;
  const id = req.body.id;
  if (
    [post.body, post.title, post.frequency, post.time, id].indexOf(
      undefined
    ) !== -1
  ) {
    return res.status(401);
  }
  db.modifyScheduledPostById(id, post, (status) => {
    Scheduler.refresh();
    if (!status) {
      return res.status(500).end();
    }
    return res.status(200).end();
  });
});

router.delete("/posts/post", async function (req, res, next) {
  let id = req.body.id;
  if (!id) {
    return res.status(401);
  }
  await db.deleteScheduledPostById(id, (status) => {
    Scheduler.refresh();
    if (!status) {
      return res.status(500).end();
    }
    return res.status(200).end();
  });
});

module.exports = router;
