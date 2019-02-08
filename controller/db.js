const sqlite3 = require('sqlite3');
const path = require('path');
// open the database
let db = null;
const log = require('simple-node-logger').createSimpleLogger(path.join(__dirname, '../logs/activity.log'));

const Database = {};

Database.init = (dbPath = path.join(__dirname, '../db.sqlite'), cb = _ => {
}) => {
  db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
      log.fatal(err.message);
      return process.exit(1);
    }
    log.info('Connected to the database.');
  });
  db.serialize(_ => {
    db.run(`CREATE TABLE IF NOT EXISTS scheduled_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          body TEXT, 
          title TEXT,
          frequency TEXT,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          time INT
  )`);

    db.run(`CREATE TABLE IF NOT EXISTS created_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          removed INTEGER DEFAULT 0,
          reddit_id TEXT, 
          title TEXT,
          link TEXT,
          created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          scheduled_post_id INTEGER NOT NULL,
          FOREIGN KEY(scheduled_post_id) REFERENCES scheduled_posts(id)
  )`);
    cb(true);
  });

};

Database.close = _ => {
  db.close();
};

Database.createNewScheduledPost = (post, cb) => {
  let params = [post.body, post.title, post.frequency, post.time, (new Date()).toISOString()];
  db.run('INSERT INTO scheduled_posts(body, title, frequency, time, last_updated) VALUES(?, ?, ?, ?, ?)', params, (err) => {
    if (err) {
      log.error(err.message);
      return cb(false);
    }
    log.info(`New automated post was added with title ${post.title}`);
    return cb(true);
  });
};

Database.insertCreatedPost = (redditId, title, link, scheduledId, cb) => {
  let params = [redditId, title, scheduledId];
  db.run('INSERT INTO created_posts(reddit_id, title, link, scheduled_post_id) VALUES(?, ?, ?, ?)', params, (err) => {
    if (err) {
      log.error(err.message);
      return cb(false);
    }
    log.info(`Inserted created post with reddit id ${redditId}`);
    return cb(true);
  });
};

Database.modifyScheduledPostById = (id, post, cb) => {
  let values = [post.body, post.title, post.frequency, post.time, (new Date).toISOString(), id];
  db.run('UPDATE scheduled_posts SET body=?, title=?, frequency=?, time=?, last_updated=? WHERE id=?', values, (err) => {
    if (err) {
      log.error(err.message);
      return cb(false);
    }
    log.info(`New automated post was added with title ${post.title}`);
    return cb(true);
  });
};

Database.deleteScheduledPostById = (id, cb) => {
  db.run('DELETE FROM scheduled_posts WHERE id=?', [id], (err) => {
    if (err) {
      log.error(err.message);
      return cb(false);
    }
    log.info(`Post deleted with ID ${id}`);
    return cb(true);
  });
};

Database.getAllScheduledPosts = (cb) => {
  db.all(`SELECT * FROM scheduled_posts;`, [], (err, posts) => {
    if (err) {
      log.error(err);
      return cb(false);
    }
    return cb(posts);
  });
};

Database.getCreatedPostsByScheduledId = (id, limit = 50, cb) => {
  db.all(`SELECT * FROM created_posts WHERE scheduled_post_id=? ORDER BY id DESC LIMIT ?;`, [id, limit], (err, posts) => {
    if (err) {
      log.error(err);
      return cb(false);
    }
    return cb(posts);
  });
};

Database.getCreatedPostsByScheduledIdNotRemoved = (id, limit = 50, cb) => {
  db.all(`SELECT * FROM created_posts WHERE scheduled_post_id=? AND removed=0 ORDER BY id DESC LIMIT ?;`, [id, limit], (err, posts) => {
    if (err) {
      log.error(err);
      return cb(false);
    }
    return cb(posts);
  });
};

Database.setPostAsRemoved = (id, removed = true, cb) => {
  db.run('UPDATE created_posts SET removed=? WHERE id=?', [+removed, id], (err) => {
    if (err) {
      log.error(err);
      return cb(false);
    }
    return cb(posts);
  });
};

Database.init();
module.exports = Database;