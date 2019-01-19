const db = require('../controller/db');
const path = require('path');
db.init(path.join(__dirname, 'test.sqlite'), _ => {
  // db.createNewScheduledPost({
  //   body: 'body',
  //   title: 'title',
  //   frequency: 'ALL',
  //   time: '0:00'
  // }, _ => {
  //   for (let i = 0; i < 100; i++) {
  //     db.insertCreatedPost(`reddit_${i}`, `reddit_${i}`, 0, _ => {
  //     });
  //   }
  // });
  db.getCreatedPostsByScheduledId(0, 10, posts => {
    for (const post of posts) {
      console.log(post);
    }
  });
});
