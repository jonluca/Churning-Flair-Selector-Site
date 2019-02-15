const path = require('path');
const log = require('simple-node-logger').createSimpleLogger(path.join(__dirname, '../logs/activity.log'));
const Database = require('./db');
const PostController = require('./post');
const ArchiveController = require('./archive');
const schedule = require('node-schedule');

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
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6
};

let Scheduler = {};
Scheduler.rules = [];

Scheduler.refresh = _ => {
  log.log("Rescheduling posts");
  for (const rule of Scheduler.rules) {
    rule.cancel();
  }
  Database.getAllScheduledPosts(posts => {
    if (!posts && !Array.isArray(posts)) {
      log.error('Error loading posts!');
      return;
    }
    for (const post of posts) {
      try {
        let splitTime = post.time.split(':');
        const hour = parseInt(splitTime[0]);
        const minute = parseInt(splitTime[1]);
        const rule = new schedule.RecurrenceRule();
        rule.minute = minute;
        rule.hour = hour;
        if (post.frequency !== 'ALL') { // Daily post
          rule.dayOfWeek = dayMap[post.frequency];
        }
        const job = schedule.scheduleJob(rule, function () {
          log.info('Posting scheduled post with title ' + post.title);
          let d = new Date();
          let dateString = `${d.getMonthName()} ${d.getDate()}, ${d.getFullYear()}`;
          let fullTitle = post.title.replace('<DATE>', dateString);
          PostController.archiveOldById(post.id);
          PostController.createNewPost(fullTitle, post.body, post.id, true);
          ArchiveController.createArchiveHtml();
        });
        Scheduler.rules.push(job);
      } catch (e) {
        log.error(`Error creating a scheduled post for title ${post.title}- ${e}`);
      }
    }
  });
};

module.exports = Scheduler;
