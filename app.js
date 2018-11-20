var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');


var app = express();

// database
mongoose = require('mongoose');
mongoose.Promise = global.Promise;
ObjectId = mongoose.Types.ObjectId;
var mongodbUrl = 'mongodb://localhost:27017/smsSocket';
mongoose.connect(mongodbUrl);


var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Database connected');
});

// global config
GLOBALCONFIG = require('./config/globalConfig');
moment = require('moment');

// Models
Models = require('./models');




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Packages
_ = require('lodash');
async = require('async');

// Use the passport package in app
passport = require('passport');
app.use(passport.initialize());
require('./passport')(passport);

app.use('/', require('./controllers/index'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
