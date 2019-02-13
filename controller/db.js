const sqlite3 = require('sqlite3');
const path = require('path');
const Sequelize = require('sequelize');
const log = require('simple-node-logger').createSimpleLogger(path.join(__dirname, '../logs/activity.log'));
let ScheduledPost,
  CreatedPost;
// open the database
let db = new Sequelize('database', '', '', {
  host: 'localhost',
  dialect: 'sqlite',
  operatorsAliases: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // SQLite only
  storage: path.join(__dirname, '../db.sqlite')
});

const Database = {};

Database.init = async (cb = _ => {
}) => {

  ScheduledPost = await db.define('ScheduledPosts', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    body: {
      type: Sequelize.STRING
    },
    title: {
      type: Sequelize.STRING
    },
    frequency: {
      type: Sequelize.STRING
    },
    time: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  });
  // force: true will drop the table if it already exists
  await ScheduledPost.sync({force: false});

  CreatedPost = await db.define('CreatedPosts', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    removed: {
      type: Sequelize.BOOLEAN,
      default: false,
      allowNull: false
    },
    reddit_id: {
      type: Sequelize.STRING
    },
    title: {
      type: Sequelize.STRING
    },
    link: {
      type: Sequelize.STRING
    },
    scheduled_post_id: {
      type: Sequelize.INTEGER,
      references: {
        model: 'ScheduledPosts',
        key: 'id'
      },
      allowNull: false
    }
  });

  // force: true will drop the table if it already exists
  await CreatedPost.sync({force: false});

  try {
    await db.authenticate();
    log.log('Connection has been established successfully.');
    cb(true);
  } catch (e) {
    log.error('Unable to connect to the database:', e);
    cb(false);
  }

};

Database.close = _ => {
  db.close();
};

Database.createNewScheduledPost = async (post, cb) => {
  const sp = ScheduledPost.build({
    body: post.body,
    title: post.title,
    frequency: post.frequency,
    time: post.time
  });

  try {
    await sp.save();
    log.info(`New automated post was added with title ${post.title}`);
    return cb(true);
  } catch (e) {
    log.error(e);
    return cb(false);
  }
};

Database.insertCreatedPost = async (redditId, title, link, scheduledId, cb) => {

  const cp = CreatedPost.build({
    reddit_id: redditId,
    title: title,
    link: link,
    removed: false,
    scheduled_post_id: scheduledId
  });

  try {
    await cp.save();
    log.info(`Inserted created post with reddit id ${redditId}`);
    return cb(true);
  } catch (e) {
    log.error(e);
    return cb(false);
  }
};

Database.modifyScheduledPostById = async (id, post, cb) => {

  try {
    await ScheduledPost.update({
      body: post.body,
      title: post.title,
      frequency: post.frequency,
      time: post.time
    }, {
      where: {
        id: id
      }
    });
    log.info(`New automated post was added with title ${post.title}`);
    return cb(true);
  } catch (e) {
    log.error(e);
    return cb(false);
  }
};

Database.deleteScheduledPostById = async (id, cb) => {
  try {
    await ScheduledPost.destroy({
      where: {
        id: id
      }
    });
    log.info(`New automated post was added with title ${post.title}`);
    return cb(true);
  } catch (e) {
    log.error(e);
    return cb(false);
  }
};

Database.getAllScheduledPosts = (cb) => {
  ScheduledPost.findAll().then(resp => {
    return cb(resp);
  }).catch(e => {
    log.error(e);
    return cb(false);
  });
};

Database.getCreatedPostsByScheduledId = (id, limit = 50, cb) => {
  CreatedPost.findAll({
    where: {
      scheduled_post_id: id
    },
    limit: limit
  }).then(posts => {
    return cb(posts);

  }).catch(err => {
    log.error(err);
    return cb(false);
  });
};

Database.getCreatedPostsByScheduledIdNotRemoved = (id, limit = 50, cb) => {
  CreatedPost.findAll({
    where: {
      scheduled_post_id: id,
      removed: false
    },
    limit: limit
  }).then(posts => {
    return cb(posts);

  }).catch(err => {
    log.error(err);
    return cb(false);
  });
};

Database.setPostAsRemoved = async (id, removed = true, cb) => {
  try {
    await CreatedPost.update({removed: removed}, {where: {id: id}});
    return cb(true);
  } catch (e) {
    log.error(err);
    return cb(false);
  }
};

module.exports = Database;
