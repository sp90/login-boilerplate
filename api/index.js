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

// Prep Storage
var MongoClient = require('mongodb').MongoClient;

// Prep variables
var config = require('./_global-config');


/**
 *	Setup middleware
 */ 

// Error logging
app.use(morgan('combined', {
    skip: function(req, res) { 
    	return res.statusCode < 400 
    }
}));

// Express middleware to populate 'req.cookies' so we can access cookies
app.use(cookieParser(config.cookieSecret));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// For parsing multipart/form-data
// app.use(multer({
// 	dest:'../uploads/'
// }));


/**
 *	Start up the engine
 */ 

var redis = require("redis");
var kvs = redis.createClient(config.redis);

MongoClient.connect(config.mongoHost, function(err, db) {
    'use strict';
    if(err) throw err;

	var services = {
		db: db,
		kvs: kvs
	};

    require('./user/user')(app, services);

    // Start listening
    app.listen(config.port);
    console.log('Express server listening on port: %d', config.port);
});