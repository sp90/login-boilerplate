// Include libs
var _ = require('lodash');
var jwt = require('jsonwebtoken');

// Configs
var gConfig = require('../_global-config');
// var config = require('_user-config');

// Helpers
var gHelpers = require('../_global-helpers');
var helpers = require('./helpers');
var emailHelpers = require('./emailHelpers');

// Loggedin middleware
var isLoggedin = require('../isLoggedin');

// Setup User
function User(app, db) {
	// Create base helpers
	var baseEP =  '/api' + gConfig.version;
	var Users = db.collection('users');

	// Routes - GET
	app.get(baseEP + '/profile', isLoggedin, getUser);

	// Routes - POST
	app.post(baseEP + '/user/create', verifyEmail, verifyType, hashPassword, createUser);
	app.post(baseEP + '/user/login', verifyEmail, getUserByEmail, verifyPassword, loginUser);

	// Routes - PUT
	app.post(baseEP + '/user/update', isLoggedin, updateUser);
	app.post(baseEP + '/user/changepassword', isLoggedin, getUserByEmail, verifyPassword, hashPassword, changePassword);
	app.post(baseEP + '/user/request-reset-password', getUserByEmail, requestResetPassword);

	app.post(baseEP + '/user/resetpassword', verifyMailToken, hashPassword, resetPassword);
	app.post(baseEP + '/user/activate', verifyMailToken, activateUser);

	// 1. TODO - add google authenticator

	// Endpoint functions
	//require('./getUser')
	function getUser(req, res) {
		var user;

		// If admin
		if (req.user.isAdmin === true) {
			// Then return the whole user object
			user = req.user;
		} else {
			// else Filter user
			user = _.pick(req.user, ['email', 'name', 'phone']);
		}

		res.json({
			'success': true,
			'user': user
		});
	}

	function updateUser(req, res) {
		var Body;

		// If admin
		if (req.user.isAdmin === true) {
			// idiot proff admin update (remove sensetive data)
			delete req.body["passwordData"];
			delete req.body["_id"];

			// Then return the rest
			Body = req.body;
		} else {
			// else Filter user
			Body = _.pick(req.body, ['name', 'phone']);
		}

		Users.updateOne({
			email: req.user.email
		}, {
			$set: Body
		}, function(err, result) {
			// Error handling if it throws
			if (!_.isNull(err)) {
				console.log("err: ", err);
				return;
			}

			Users.findOne({
				email: req.user.email
			}, function(err, item) {
				var user;

				// If admin
				if (item.isAdmin === true) {
					// Then return the whole user object
					user = item;
				} else {
					// else Filter user
					user = _.pick(item, ['email', 'name', 'phone']);
				}
				// Return updated user object
				res.json({
					success: true,
					user: user
				});
			});
		});
	}

	function changePassword(req, res) {
		Users.updateOne({
			email: req.user_by_email.email
		}, {
			$set: req.new_password
		}, function(err, result) {
			if (!_.isNull(err)) {
				return res.json(gHelpers.errRes('Invalid email - update'));
			}

			// TODO send email/sms to notify that the password has been changed
			res.json({
				'success': true,
				'message': 'Your password is now updated'
			});
		});
	}

	function resetPassword(req, res) {
		Users.updateOne({
			email: req.jwt_decoded.email
		}, {
			$set: req.new_password
		}, function(err, result) {
			if (!_.isNull(err)) {
				return res.json(gHelpers.errRes('Invalid email - update'));
			}

			// TODO send email/sms to notify that the password has been changed
			res.json({
				'success': true,
				'message': 'Your password is now updated'
			});
		});
	}

	function activateUser(req, res) {
		var activateObj = {
			activated: true
		};

		Users.updateOne({
			email: req.jwt_decoded.email
		}, {
			$set: activateObj
		}, function(err, result) {
			if (!_.isNull(err)) {
				return res.json(gHelpers.errRes('Invalid email - update'));
			}

			// TODO send email/sms to notify that the password has been changed
			res.json({
				'success': true,
				'message': 'Your password is now updated'
			});
		});
	}

	function requestResetPassword(req, res) {
		var email = req.user_by_email.email;

		emailHelpers.resetPassword(email)
			.then(function(result){
				res.json({
					'success': true,
					'message': 'A new password has been sent to your email'
				});
			}, function(err) {
				return res.json(gHelpers.errRes('An error happend', err));
			});
	}

	function loginUser(req, res) {
		var Body = _.pick(req.body, ['email']);

		var date = new Date();
		var token = jwt.sign({email: Body.email, created_at: date}, gConfig.tokenSecret, {
			expiresIn: '30d'
		});

		res.json({
			'success': true,
			'token': token
		});
	}

	function createUser(req, res) {
		// Supported fields
		var Body = _.pick(req.body, ['email', 'password', 'type']);

		var newUser = {
			email: Body.email,
			passwordData: req.new_password.passwordData,
			role: Body.type || 'user',
			activated: false,
			isAdmin: false
		};

		// Insert
		Users.insert(newUser, function(err, result) {
			if (!_.isNull(err)) {
				if (err.code === 11000) {
					return res.json(gHelpers.errRes('Email already exists'));
				}
					
				return res.json(gHelpers.errRes('For some crazy reason we couldn\'t save you in our user system, please try again'));
			}

			// TODO - Send activation email
			res.json({
				success: true,
				message: 'Successfully created a new user',
				user: result.ops[0].email
			});
		});
	}

	/**
	 *	HELPERS
	 *	TODO - move them into the helper functions already build
	 */

	function hashPassword(req, res, next) {
		var Body = _.pick(req.body, ['newpassword']);

		if (_.isUndefined(Body.newpassword)) {
			return res.json(gHelpers.errRes('Add a new password to the request'));
		}

		helpers.hashPassword(Body.newpassword)
			.then(function(hashObj) {
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

		helpers.verifyPassword(user.passwordData, Body.password)
			.then(function(isValid) {
				if (!isValid) {
					return res.json(gHelpers.errRes('Invalid password'));
				}

				next();
			});
	}

	function getUserByEmail(req, res, next) {
		var Body = _.pick(req.body, ['email']);
		var email;

		if (_.isUndefined(Body.email)) {
			email = req.user.email;
		} else {
			email = Body.email
		}

		Users.findOne({
			'email': email
		}, function(err, user) {
			if (!_.isNull(err)) {
				return res.json(gHelpers.errRes('An error happend'));
			}

			if (user == null) {
				return res.json(gHelpers.errRes('No users with that email'));
			}

			req.user_by_email = user;

			next();
		});
	}

	function verifyEmail(req, res, next) {
		var Body = _.pick(req.body, ['email']);

		if (!helpers.verifyEmail(Body.email)) {
			return res.json(gHelpers.errRes('Invalid email - verify'));
		}

		next();
	}

	function verifyType(req, res, next) {
		// If type is set
		if (!_.isUndefined(Body.type)) {
			// Verify type
			if (!helpers.verifyType(Body.type)) {
				return res.json(gHelpers.errRes('Invalid type - verify'));
			}
		}

		next();
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
}

// Export Rest routes 
module.exports = User;