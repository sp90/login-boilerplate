// Global node modules
var _ = require('lodash');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var credential = require('credential')();
var Promise = require("bluebird");

// Get base
var config = require('../_global-config');
var gHelpers = require('../_global-helpers');

// Setup User
function verifyEmail(req, res, next) {
	var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	var Body = _.pick(req.body, ['email']);
	

	if (!re.test(Body.email)) {
		return res.json(gHelpers.errRes('Invalid email - verify'));
	}

	next();
}

function verifyType(req, res, next) {
	// Define user types
	var userTypes = ['user', 'owner'];
	var Body = _.pick(req.body, ['type']);

	if (!_.isUndefined(Body.type) && !userTypes.indexOf(Body.type) > -1) {
		return res.json(gHelpers.errRes('Invalid type - verify'));
	}

	next();
}

function hashPassword(req, res, next) {
	var Body = _.pick(req.body, ['newpassword', 'password']);
	var password = Body.newpassword || Body.password;

	if (_.isUndefined(password)) {
		return res.json(gHelpers.errRes('Add a new password to the request'));
	}

	credential.hash(password, function (err, hashObj) {
		if (err) { 
			return res.json(gHelpers.errRes('Password hash failed'));
		};

		var newPassword = {
			passwordData: hashObj
		};

		req.new_password = newPassword;

		next();
	});
}

function verifyPassword(req, res, next) {
	var Body = _.pick(req.body, ['password']);
	var user = req.user_by_email;

	credential.verify(user.passwordData, Body.password, function (err, isValid) {
		if (!isValid) {
			return res.json(gHelpers.errRes('Invalid password'));
		}

		next();
	});
}

function verifyMailToken(req, res, next) {
	var token = req.get('mail-token');

	jwt.verify(token, gConfig.tokenSecret, function(err, decoded) {
		if (!_.isNull(err)) {
			return res.json(gHelpers.errRes(err.message));
		}

		if (_.isUndefined(decoded.mail_token) || decoded.mail_token === false) {
			return res.json(gHelpers.errRes('You have provided an invalid token'));
		}

		req.jwt_decoded = decoded;

		next();
	});
}

// Export Rest routes 
module.exports = {
	verifyType: verifyType,
	verifyEmail: verifyEmail,
	hashPassword: hashPassword,
	verifyPassword: verifyPassword,
	verifyMailToken: verifyMailToken
};