// Thirdparty modules
var Promise = require("bluebird");
var EmailTemplate = require('email-templates').EmailTemplate;
var Handlebars = require('handlebars');
var path = require('path');

var gConfig = require('../_global-config');

var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');
var nodemailerMailgun = nodemailer.createTransport(mg({
	auth: gConfig.mailgun.auth
}));

// Bind functions to the module
var emailHelpers = {
	activateUser: activateUser,
	resetPassword: resetPassword
};

// Add handlebar helpers
Handlebars.registerHelper('capitalize', function capitalize (context) {
	// Ex:
	// {{ capitalize firstname }}

	return context.toUpperCase();
});

function resetPassword(data) {
	return new Promise(function(resolve, reject) {
		var templateDir = path.join(__dirname, '../../', 'email-templates', 'reset-password');

		var template = new EmailTemplate(templateDir);

		template.render(data, function (err, result) {
			if (err) {
				reject(err);
			} else {
				var mail = {
					from: '"Login boilerplate 👥" <no-reply@login-boilerplate.com>', // sender address
					to: data.email,
					subject: 'Reset password - login boilerplate', // Subject line
					//You can use "html:" to send HTML email content. It's magic!
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
	return new Promise(function(resolve, reject) {

	});
}

function sendMail(mail) {
	return new Promise(function(resolve, reject) {
		nodemailerMailgun.sendMail(mail, function (err, info) {
			if (err) {
				reject(err);
			} else {
				resolve(info);
			}
		});
	});
}

// export module
module.exports = emailHelpers;