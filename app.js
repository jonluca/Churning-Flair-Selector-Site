const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const config = require("./config");
const helmet = require("helmet");
const indexRouter = require("./routes/index");
const adminRouter = require("./routes/admin");
const morgan = require("morgan");
const fs = require("fs");
const minify = require("express-minify");
const basicAuth = require("express-basic-auth");
const serveIndex = require("serve-index");
const { expressCspHeader, INLINE, NONE, SELF } = require("express-csp-header");

const app = express();
app.disable("x-powered-by");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(config.web_app_secret));
app.use(express.static(path.join(__dirname, "public")));
app.use(helmet({ xssFilter: false, contentSecurityPolicy: false }));
// Logging
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "/logs/access.log"),
  {
    flags: "a",
  }
);

app.use(
  morgan(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
    {
      stream: accessLogStream,
    }
  )
);

app.use(
  "/logs",
  basicAuth({
    users: { churning: config.admin_pass },
    challenge: true,
    realm: "ChurningRealm",
  }),
  express.static(__dirname + "/logs/"),
  serveIndex(__dirname + "/logs/")
);

app.use(
  "/admin",
  basicAuth({
    users: { churning: config.admin_pass },
    challenge: true,
    realm: "ChurningRealm",
  }),
  adminRouter
);

app.get("/archive", function (req, res, next) {
  res.sendFile(path.join(__dirname + "/public/archives/index.html"));
});

app.get("/post/:id", function (req, res, next) {
  const id = parseInt(req.params.id);
  if (!isNumber(id)) {
    return res.status(400).end();
  }
  res.sendFile(path.join(__dirname + "/public/archives/" + id + ".html"));
});

app.use(
  "/",
  minify({
    cache: __dirname + "/public/cache",
    uglifyJsModule: null,
    errorHandler: null,
    jsMatch: false,
  }),
  indexRouter
);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

function isNumber(n) {
  return !isNaN(parseFloat(n)) && !isNaN(n - 0);
}

module.exports = app;
