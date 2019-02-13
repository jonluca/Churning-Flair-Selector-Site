const db = require("./db");
const ejs = require('ejs');
const path = require('path');
const template = path.join(__dirname, '../views/archive.ejs');
const ArchiveController = {};

ArchiveController.createArchiveHtml = () => {
  db.getAllScheduledPosts(posts => {
    ejs.renderFile(template, {posts}, (err, html) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(html);
    });
  });
};

module.exports = ArchiveController;
