// Thirdparty modules
var Promise = require("bluebird");
var EmailTemplate = require('email-templates').EmailTemplate;
var Handlebars = require('handlebars');
var path = require('path');
var jwt = require('jsonwebtoken');

var gConfig = require('../_global-config');

var nodemailer = require('nodemailer');
var htmlToText = require('nodemailer-html-to-text').htmlToText;
var mg = require('nodemailer-mailgun-transport');
var transporter = nodemailer.createTransport(mg({
	auth: gConfig.mailSettings.mailgunAuth
}));

transporter.use('compile', htmlToText());

// Bind functions to the module
var emailHelpers = {
	activateUser: activateUser,
	resetPassword: resetPassword
};

// Add handlebar helpers
Handlebars.registerHelper('capitalize', function capitalize(context) {
	// Ex:
	// {{ capitalize firstname }}

	return context.toUpperCase();
});

function resetPassword(email) {
	var token = generateToken('passwordReset', email);
	var data = {
		headline: 'Reset password',
		sender: 'Login boilerplate',
		block: [
			{
				// This can be html
				content: 'Please follow the link below to update your password'
			}
		],
		resetLink: gConfig.mailSettings.resetPassword.callbackUrl + token
	};

	return new Promise(function(resolve, reject) {
		var template = new EmailTemplate(getMailTemplateDir('reset-password'));

		template.render(data, function (err, result) {
			if (err) {
				reject(err);
			} else {
				var mail = {
					from: gConfig.mailSettings.from,
					to: email,
					subject: gConfig.mailSettings.resetPassSubject,
					html: result.html
				};

				sendMail(mail).then(function(info){
					// Success
					resolve(info);
				}, function(err) {
					// Error
					reject(err);
				});
			}
		});
	});
}

function activateUser(email) {
	var token = generateToken('activateUser', email);
	var data = {
		headline: 'Welcome to login boilerplate',
		sender: 'Login boilerplate',
		block: [
			{
				// This can be html
				content: 'Please follow the link below to activate your account'
			}
		],
		activateLink: gConfig.mailSettings.activate.callbackUrl + token
	};

	return new Promise(function(resolve, reject) {
		var template = new EmailTemplate(getMailTemplateDir('welcome-activate'));

		template.render(data, function (err, result) {
			if (err) {
				reject(err);
			} else {
				var mail = {
					from: gConfig.mailSettings.from,
					to: email,
					subject: gConfig.mailSettings.welcomeActivateSubject,
					html: result.html
				};

				sendMail(mail).then(function(info){
					// Success
					resolve(info);
				}, function(err) {
					// Error
					reject(err);
				});
			}
		});
	});
}

function sendMail(mail) {
	return new Promise(function(resolve, reject) {
		transporter.sendMail(mail, function (err, info) {
			if (err) {
				reject(err);
			} else {
				resolve(info);
			}
		});
	});
}

// The identifier should represent activate user or reset password
function generateToken(identifier, email) {
	return jwt.sign({
		email: email, 
		identifier: identifier, 
		created_at: new Date()
	}, gConfig.mailTokenSecret, {
		expiresIn: '1h'
	});
}

function getMailTemplateDir(folderName) {
	return path.join(__dirname, '../../', 'email-templates', folderName);
}

// export module
module.exports = emailHelpers;