// Include libs
var jwt = require('jsonwebtoken');
var MongoClient = require('mongodb').MongoClient;
var _ = require('lodash');

// Configs
var gConfig = require('./_global-config');

function isLoggedin(req, res, next) {
	var token = req.get('Authorization');

	// Verify token
	jwt.verify(token, gConfig.tokenSecret, function(err, decoded) {

		if (!_.isNull(err)) {
			return res.json({
				'success': false,
				'message': err.message
			});
		}

		// Get user object
		MongoClient.connect(gConfig.mongoHost, function(err, db) {
			'use strict';
			if(err) {
				return res.json({
					'success': false,
					'message': 'DB connection failed'
				});
			}

			var Users = db.collection('users');

			Users.findOne({'email': decoded.email}, function(err, user) {
				if(err) {
					return res.json({
						'success': false,
						'message': 'Failed while trying to get the user'
					});
				}

				// Bind user to the request session
				req.user = user;

				// Move foward
				next();
			});
		});
	});
}

module.exports = isLoggedin;