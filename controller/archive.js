const db = require("./db");
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const template = path.join(__dirname, '../views/archive.ejs');
const log = require('simple-node-logger').createSimpleLogger(path.join(__dirname, '../logs/activity.log'));

Date.prototype.getMonthName = function (lang) {
  lang = lang && (lang in Date.locale) ? lang : 'en';
  return Date.locale[lang].month_names[this.getMonth()];
};

Date.locale = {
  en: {
    month_names: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    month_names_short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  }
};

const dayMap = {
  "Sunday": 0,
  "Monday": 1,
  "Tuesday": 2,
  "Wednesday": 3,
  "Thursday": 4,
  "Friday": 5,
  "Saturday": 6
};

const ArchiveController = {};

ArchiveController.createArchiveHtml = () => {
  db.getAllScheduledPosts(posts => {
    if (!posts || !posts.length) {
      console.log("No posts!");
      return;
    }
    const formattedPosts = [];
    for (const post of posts) {
      formattedPosts.push({
        href: '/post/' + post.id,
        title: post.title
      });
    }
    ejs.renderFile(template, {
      posts: formattedPosts,
      title: "Post Archives"
    }, (err, html) => {
      if (err) {
        console.error(err);
        return;
      }
      const archivePath = path.join(__dirname, '../public/archives/index.html');
      fs.writeFileSync(archivePath, html);
      log.info("Wrote archive index");
      for (const post of posts) {
        ArchiveController.createPostArchive(post);
      }
    });
  });
};

ArchiveController.createPostArchive = (post) => {
  db.getCreatedPostsByScheduledId(post.id, 99999, posts => {
    if (!posts) {
      console.error(`Error creating post: ${post.id} - ${post.title}`);
      return;
    }
    const formattedPosts = [];
    for (const post of posts) {
      formattedPosts.push({
        href: post.link,
        title: post.title
      });
    }
    let d = new Date();
    let dateString = `${d.getMonthName()} ${d.getDate()}, ${d.getFullYear()}`;
    let fullTitle = post.title.replace("<DATE>", dateString);
    ejs.renderFile(template, {
      posts: formattedPosts,
      title: fullTitle
    }, (err, html) => {
      if (err) {
        console.error(err);
        return;
      }
      const archivePath = path.join(__dirname, '../public/archives/' + post.id + '.html');
      fs.writeFileSync(archivePath, html);
      log.info("Wrote archive post " + post.id);
    });
  });
};

module.exports = ArchiveController;
