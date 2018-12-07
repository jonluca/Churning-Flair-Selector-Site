# /r/churning Flair Selector

This is a site that allows users of a subreddit to select flair. This was specifically made for /r/churning but can be easily adapted to any other subreddit.

## Set up

Create a file called `config.js`. It should have the following format:

```js
module.exports = {
  web_app_secret: "",
  web_app_id: "",
  redirect: "",
  mod_username: "",
  mod_password: "",
  mod_script_id: "",
  mod_script_secret: "",
  subreddit: ""
};
```

You must first navigate to the apps page for the account you want to handle the flair selection. That URL is https://www.reddit.com/prefs/apps/.

When there, you need to create **2** apps. You must create a web app (which will handle the retrieval of user profile information) and you must also create a personal script app. You will have 2 sets of app IDs and secrets. The personal script is what is actually used to set the user flair.

Note that the user must A) be a mod of the subreddit and B) must have the `flair` permission.

| Key | Value |
| -------- | -------- |
| web_app_secret | Web application secret |
| web_app_id | Web application id |
| redirect | Redirect url (i.e. while developing, http://localhost:3000, while in prod https://churning.us)|
| mod_username | Username of mod account |
| mod_password | Password of mod account |
| mod_script_id | Personal script id |
| mod_script_secret | Personal script secret |
| subreddit | Subreddit that the user is a mod of |

## Development

Copy and paste the following section to get started.

```bash
git clone git@github.com:jonluca/Churning-Flair-Selector-Site.git
cd Churning-Flair-Selector-Site
echo 'module.exports = {
        web_app_secret: "",
        web_app_id: "",
        redirect: "",
        mod_username: "",
        mod_password: "",
        mod_script_id: "",
        mod_script_secret: "",
        subreddit: ""
      };' > config.js
yarn install
```

Fill out the sections in `config.js`, then start the application with `npm start` or `node bin/www`.

The other part you'll need to change is the front end filtering logic in `public/js/main.js`. Currently it assumes a format similar to that in `public/data/flairs.json`, which is for airports, since this application was originally made for /r/churning. You'll want to change the logic around displaying, filtering, and retrieving the various flair options.