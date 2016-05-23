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
	app.post(baseEP + '/user/create', createUser);
	app.post(baseEP + '/user/login', loginUser);

	// Routes - PUT
	app.post(baseEP + '/user/update', isLoggedin, updateUser);
	app.post(baseEP + '/user/changepassword', isLoggedin, changePassword);
	app.post(baseEP + '/user/resetpassword', requestResetPassword);

	// 1. TODO - add google authenticator

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
		})
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
		var Body = _.pick(req.body, ['password', 'newpassword']);

		Users.findOne({
			'email': req.user.email
		}, function(err, item) {
			if (!_.isNull(err)) {
				return res.json(gHelpers.errRes('An error happend'));
			}

			if (item == null) {
				return res.json(gHelpers.errRes('No users with that email'));
			}

			helpers.verifyPassword(item.passwordData, Body.password)
				.then(function(isValid) {
					if (!isValid) {
						return res.json(gHelpers.errRes('Invalid password'));
					}

					helpers.hashPassword(Body.newpassword)
						.then(function(hashObj) {
							var newPassword = {
								passwordData: hashObj
							};

							Users.updateOne({
								email: req.user.email
							}, {
								$set: newPassword
							}, function(err, result) {
								if (!_.isNull(err)) {
									return res.json(gHelpers.errRes('Invalid email'));
								}

								// TODO send email/sms to notify that the password has been changed
								res.json({
									'success': true,
									'message': 'Your password is now updated'
								});
							});

						});

				}, function(err) {
					return res.json(gHelpers.errRes('Incorrect password'));
				})
		});
	}

	function requestResetPassword(req, res) {
		var Body = _.pick(req.body, ['email']);

		
		Users.findOne({
			'email': Body.email
		}, function(err, item) {
			if (!_.isNull(err)) {
				return res.json(gHelpers.errRes('An error happend'));
			}

			if (item == null) {
				return res.json(gHelpers.errRes('No users with that email'));
			}

			emailHelpers.resetPassword(Body.email)
				.then(function(result){
					res.json({
						'success': true,
						'message': 'A new password has been sent to your email'
					});
				}, function(err) {
					return res.json(gHelpers.errRes('An error happend', err));
				});
		});
	}

	function loginUser(req, res) {
		var Body = _.pick(req.body, ['email', 'password']);

		// Verify email, with regex to save db request on bots
		if (!helpers.verifyEmail(Body.email)) {
			return res.json(gHelpers.errRes('Invalid email'));
		}

		Users.findOne({
			'email': Body.email
		}, function(err, item) {
			if (!_.isNull(err)) {
				return res.json(gHelpers.errRes('An error happend'));
			}

			if (item == null) {
				return res.json(gHelpers.errRes('No users with that email'));
			}

			helpers.verifyPassword(item.passwordData, Body.password)
				.then(function(isValid) {
					if (!isValid) {
						return res.json(gHelpers.errRes('Invalid password'));
					}

					var date = new Date();
					var token = jwt.sign({email: Body.email, created_at: date}, gConfig.tokenSecret, {
						expiresIn: '30d'
					});

					res.json({
						'success': true,
						'token': token
					});
				});
		});
	}

	function createUser(req, res) {
		// Supported fields
		var Body = _.pick(req.body, ['email', 'password', 'type']);

		// Verify email
		if (!helpers.verifyEmail(Body.email)) {
			return res.json(gHelpers.errRes('Invalid email'));
		}

		// If type is set
		if (!_.isUndefined(Body.type)) {
			// Verify type
			if (!helpers.verifyType(Body.type)) {
				return res.json(gHelpers.errRes('Invalid type'));
			}
		} else {
			// Set default type
			Body.type = 'user';
		}

		// Hash password
		helpers.hashPassword(Body.password)
			.then(function(hashObj) {
				var newUser = {
					email: Body.email,
					passwordData: hashObj,
					role: Body.type,
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

					res.json({
						success: true,
						message: 'Successfully created a new user',
						user: result.ops[0].email
					});

					// Send email
				});
			}, function(err) {
				res.json(gHelpers.errRes('Failed hashing the password'));
			});
	}
}

// Export Rest routes 
module.exports = User;