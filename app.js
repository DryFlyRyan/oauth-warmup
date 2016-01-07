var express = require('express');
var session = require('express-session')
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

require('dotenv').load()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session( {secret: process.env.SESSION_SECRET }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_KEY,
  clientSecret: process.env.LINKEDIN_SECRET,
  callbackURL: process.env.HOST + '/auth/linkedin/callback',
  scope: ['r_emailaddress', 'r_basicprofile'],
  state: true,
}, function(accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
  // console.log(profile);
  return done(null, {id: profile.id, displayName: profile.displayName});
  });
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.use(function(req,res,next) {
  app.locals.user = req.user;
  next();
})

app.use('/', routes);
app.use('/users', users);

app.get('/auth/linkedin',
  passport.authenticate('linkedin'),
  function(req, res){
});

app.get('/auth/linkedin/callback',
passport.authenticate('linkedin', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

app.post('/login',
  passport.authenticate('local'),
  function(req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    res.redirect('/users/' + req.user.username);
});

app.get('/logout', function(req,res) {
  req.session.destroy(function(err) {
    res.redirect('/')
  })
})


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
