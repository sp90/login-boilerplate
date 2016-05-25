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

// Get db
var db = require('../db');

// Setup User
function User(app) {
	// Create base helpers
	var baseEP =  '/api' + gConfig.version;
	var Users = db.get().collection('users');

	// Routes - GET
	app.get(baseEP + '/profile', isLoggedin, getUser);

	// Routes - POST
	app.post(baseEP + '/user/create', helpers.verifyEmail, helpers.verifyType, helpers.hashPassword, createUser);
	app.post(baseEP + '/user/login', helpers.verifyEmail, getUserByEmail, helpers.verifyPassword, loginUser);

	// Routes - PUT
	app.post(baseEP + '/user/update', isLoggedin, updateUser, returnUser);
	app.post(baseEP + '/user/changepassword', isLoggedin, getUserByEmail, helpers.verifyPassword, helpers.hashPassword, changePassword);
	app.post(baseEP + '/user/request-reset-password', getUserByEmail, requestResetPassword);

	app.post(baseEP + '/user/resetpassword', helpers.verifyMailToken, helpers.hashPassword, resetPassword);
	app.post(baseEP + '/user/activate', helpers.verifyMailToken, activateUser);

	// Endpoint functions
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

	function updateUser(req, res, next) {
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
				return res.json(gHelpers.errRes('Couldn\'t update the user'));
			}

			next();
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
				return res.json(gHelpers.errRes('Invalid email - reset password'));
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
				return res.json(gHelpers.errRes('Invalid email - activation'));
			}

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
				return res.json(gHelpers.errRes('An error happend while sending the email to reset the password', err));
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
			emailHelpers.activateUser(result.ops[0].email)
				.then(function(message){
					res.json({
						success: true,
						message: 'Successfully created a new user',
						user: result.ops[0].email
					});
				}, function(err) {
					return res.json(gHelpers.errRes('An error happend while trying to send the activation email', err));
				});
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

	function returnUser(req, res) {
		Users.findOne({
			email: req.user.email
		}, function(err, item) {

			req.user = item.isAdmin === true ? item : _.pick(item, ['email', 'name', 'phone']);

			// Return updated user object
			res.json({
				success: true,
				user: req.user
			});
		});
	}
}

// Export Rest routes 
module.exports = User;