// Include libs
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var MongoClient = require('mongodb').MongoClient;

// Configs
var gConfig = require('./_global-config');
var gHelpers = require('./_global-helpers');

function isLoggedin(req, res, next) {
	var token = req.get('Authorization');

	// Verify token
	jwt.verify(token, gConfig.tokenSecret, function(err, decoded) {
		if (!_.isNull(err)) {
			return res.json(gHelpers.errRes(err.message));
		}

		// Get user object
		MongoClient.connect(gConfig.mongoHost, function(err, db) {
			'use strict';

			if (!_.isNull(err)) {
				return res.json(gHelpers.errRes('DB connection failed'));
			}

			var Users = db.collection('users');
			Users.findOne({'email': decoded.email}, function(err, user) {
				if (!_.isNull(err)) {
					return res.json(gHelpers.errRes('Failed while trying to get the user'));
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