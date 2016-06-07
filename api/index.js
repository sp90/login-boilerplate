/**
 *	Setup global veriables
 */ 

// Prep express
var express = require('express');
var app = express();

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var morgan = require('morgan');
var csrf = require('csurf');

// Prep Storage
var db = require('./db');

// Prep variables
var config = require('./_global-config');
var gHelpers = require('./_global-helpers');


/**
 *	Setup middleware
 */ 

// Error logging
app.use(morgan('combined', {
    skip: function(req, res) { 
    	return res.statusCode < 400;
    }
}));

// Express middleware to populate 'req.cookies' so we can access cookies
app.use(cookieParser(config.cookieSecret));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// add csrf token as a cookie and check for it on requests
app.use(csrf({ cookie: true }));

app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') { return next(err); }

  // handle CSRF token errors here
  return res.status(403).json(gHelpers.errRes('Couldn\'t update the user'));
});

// For parsing multipart/form-data
// app.use(multer({
// 	dest:'../uploads/'
// }));

// Get routes
app.all('/*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  next();
});


/**
 *	Start up the engine
 */ 

db.connect(config.mongoHost, function(err) {
    'use strict';
    if (err) {
      console.log('Unable to connect to Mongo.')
      process.exit(1)
    } else {

      require('./user/user')(app);

      // Start listening
      app.listen(config.port);
      console.log('Express server listening on port: %d', config.port);
    }
});