const PostController = require('../controller/post');
const db = require('../controller/db');
const path = require('path');
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

PostController.refreshToken(async _ => {
  db.init(_ => {
    db.getAllScheduledPosts(posts => {
      if (!posts && !Array.isArray(posts)) {
        log.error("Error loading posts!");
        return;
      }
      for (const post of posts) {
        try {
          log.info("Posting scheduled post with title " + post.title);
          let d = new Date();
          let dateString = `${d.getMonthName()} ${d.getDate()}, ${d.getFullYear()}`;
          let fullTitle = post.title.replace("<DATE>", dateString);
          PostController.createNewPost(fullTitle, post.body, post.id, true);

        } catch (e) {
          log.error(`Error creating a scheduled post for title ${post.title}- ${e}`);
        }
      }
    });
  });
});
