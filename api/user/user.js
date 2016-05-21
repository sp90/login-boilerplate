// Include libs
var jwt = require('jsonwebtoken');
var _ = require('lodash');

// Configs
var gConfig = require('../_global-config');
// var config = require('_user-config');

// Helpers
var gHelpers = require('../_global-helpers');
var helpers = require('./helpers');

// Loggedin middleware
var isLoggedin = require('../isLoggedin');

// Setup User
function User(app, db) {
	// Create base helpers
	var baseEP = gConfig.version + '/api';
	var Users = db.collection('users');

	// Routes - GET
	app.get(baseEP + '/profile', isLoggedin, getUser);

	// Routes - POST
	app.post(baseEP + '/user/create', createUser);
	app.post(baseEP + '/user/login', loginUser);

	// Routes - PUT
	app.post(baseEP + '/user/update', isLoggedin, updateUser);
	app.post(baseEP + '/user/changePassword', isLoggedin, changePassword);
	app.post(baseEP + '/user/resetPassword', requestResetPassword);

	// TODO - add newsletter signup

	// Endpoint functions
	function getUser(req, res) {
		// Filter user
		var user = _.pick(req.user, ['email', 'name', 'phone']);

		res.json({
			'success': true,
			'user': user
		})
	}

	function updateUser(req, res) {
		var Body = _.pick(req.body, ['name', 'phone']);

		// TESTME
		Users.updateOne({
			email: req.user.email
		}, {
			$set: Body
		}, function(err, result) {
			if (err) {
				return res.json(gHelpers.errRes('Invalid email'));
			}

			Users.findOne({email: theUser.email}, function(err, item) {
				if (err) {
					return res.json(gHelpers.errRes('Invalid email'));
				}

				res.json({
					success: true,
					user: _.pick(item, ['email', 'name', 'phone'])
				});
			});
		});
	}

	function changePassword(req, res) {
		var Body = _.pick(req.body, ['password', 'newpassword']);

		// TESTME
		Users.findOne({'email': req.user.email}, function(err, item) {
			if (err) {
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
								if (err) {
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

		// TODO Send email with a 1H expiring token as url with random chars
		// and then make endpoint to change the password verify with url token req.params
		// As mail smtp server use Mailgun free account

		// NOTE Use sendgrid for transactional
	}

	function loginUser(req, res) {
		var Body = _.pick(req.body, ['email', 'password']);

		// Verify email, with regex to save db request on bots
		if (!helpers.verifyEmail(Body.email)) {
			return res.json(gHelpers.errRes('Invalid email'));
		}

		Users.findOne({'email': Body.email}, function(err, item) {
			if (err) {
				return res.json(gHelpers.errRes('An error happend'));
			}

			if (item == null) {
				return res.json(gHelpers.errRes('No users with that email'));
			}

			helpers.verifyPassword(item.passwordData, Body.password)
				.then(function(isValid) {
					var date = new Date();
					var token = jwt.sign({email: Body.email, created_at: date}, gConfig.tokenSecret, {
						expiresIn: '30d'
					});

					res.json({
						'success': true,
						'token': token
					});
				}, function(err) {
					return res.json(gHelpers.errRes('Incorrect password'));
				})
		});
	}

	function createUser(req, res) {
		// Supported fields
		var Body = _.pick(req.body, ['email', 'password', 'type']);

		// Verify email
		if (!helpers.verifyEmail(Body.email)) {
			return res.json(gHelpers.errRes('Invalid email'));
		}

		// Verify type
		if (!helpers.verifyType(Body.type)) {
			return res.json(gHelpers.errRes('Invalid type'));
		}

		// Hash password
		helpers.hashPassword(Body.password)
			.then(function(hashObj) {
				var newUser = {
					email: Body.email,
					passwordData: hashObj,
					role: Body.type
				};

				// Insert
				Users.insert(newUser, function(err, result) {
					if (err) {
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
				});
			}, function(err) {
				res.json(gHelpers.errRes('Failed hashing the password'));
			});
	}
}

// Export Rest routes 
module.exports = User;