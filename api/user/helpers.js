// Global node modules
var crypto = require('crypto');
var credential = require('credential')();
var Promise = require("bluebird");

// Get base
var config = require('../_global-config');

// Setup User
function verifyEmail(email) {
	var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}

function verifyType(type) {
	// Define user types
	var userTypes = ['user', 'owner'];

	return userTypes.indexOf(type) > -1;
}

function hashPassword(password) {
	return new Promise(function(resolve, reject) {
		credential.hash(password, function (err, hash) {
			if (err) { 
				reject(err);
			};

			resolve(hash);
		});
    });
}

function verifyPassword(storedHash, password) {
	return new Promise(function(resolve, reject) {
		credential.verify(storedHash, password, function (err, isValid) {
			if (err) { 
				reject(err);
			}

			resolve(isValid);
		});
    });
}

// Export Rest routes 
module.exports = {
	verifyType: verifyType,
	verifyEmail: verifyEmail,
	hashPassword: hashPassword,
	verifyPassword: verifyPassword
};