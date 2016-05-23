// Prep vars
var MongoClient = require('mongodb').MongoClient;
var Promise = require("bluebird");

var config = require('./_global-config');

// Run once
function createIndexes() {
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
				if(err) { throw err; }

				// Tell result
				console.log("result: ", result);

				// Close db
				db.close();
			});
	});
}

createIndexes();