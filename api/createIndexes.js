// Prep vars
var MongoClient = require('mongodb').MongoClient;
var config = require('./_global-config');

// Run once
MongoClient.connect(config.mongoHost, function(err, db) {
    'use strict';
    if(err) throw err;

	var Users = db.collection('users');

	// Index user email
	Users.createIndex(
		{
			'email': 1
		}, 
		{
			unique: true
		},
		function(err, result) {
			console.log("err: ", err);
			console.log("result: ", result);
		});
	
	db.close();
});
