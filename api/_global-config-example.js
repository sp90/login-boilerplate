// Setup config

// NOTE - Change filename to _global-config.js for use

var config;
var env = process.env['NODE_ENV'] || 'dev';

var productionUrl = 'http://somedomain.com';
var stagingUrl = 'http://staging.somedomain.com';
var localUrl = 'http://localhost:8100';

if (env === 'staging' || env === 'production') {
	var envUrl = env === 'staging' ? stagingUrl : productionUrl;

	config = {
		port: process.env['PORT'] || 3000,
		version: '/v1',
		cookieSecret: 'SUPERcookieSECRET',
		tokenSecret: 'SERIOUStokenSECRET',
		mailTokenSecret: 'SERIOUSmailTokenSECRET',
		mongoHost: 'mongodb://mongo:27017/test1',
		mailSettings: {
			mailgun_auth: {
				api_key: 'somekey',
				domain: 'somedomain'
			},
			from: '"Login boilerplate 👥" <no-reply@login-boilerplate.com>',
			resetPass: {
				subject: 'Reset password - login boilerplate',
				callbackUrl: envUrl + '/update-password?token='
			},
			activate: {
				subject: 'Welcome to login boilerplate',
				callbackUrl: envUrl + '/activate-user?token='
			}
		},
		facebook : {
			app_id: 'your-secret-clientID-here', // your App ID
			app_secret: 'your-client-secret-here', // your App Secret
			callback_url: envUrl + '/auth/facebook/callback'
		},
		google: {
			app_id: 'your-secret-clientID-here', // client_id
			app_secret: 'your-client-secret-here', // client_secret
			callback_url: envUrl + '/auth/google/callback'
		},
		linkedin: {
			app_key: 'your-consumer-key-here', // consumer_key
			app_secret: 'your-client-secret-here', // consumer_secret
			callback_url: envUrl + '/auth/linkedin/callback'
		},
		twitter: {
			app_key: 'your-consumer-key-here', // consumer_key
			app_secret: 'your-client-secret-here', // consumer_secret
			callback_url: envUrl + '/auth/twitter/callback'
		}
	};
} else {
	config = {
		port: process.env['PORT'] || 3000,
		version: '/v1',
		cookieSecret: 'localCookieSecret',
		tokenSecret: 'localTokenSecret',
		mailTokenSecret: 'localMailTokenSecret',
		mongoHost: 'mongodb://localhost:27017/test1',
		mailSettings: {
			mailgun_auth: {
				api_key: 'somekey',
				domain: 'somedomain'
			},
			from: '"Login boilerplate 👥" <no-reply@login-boilerplate.com>',
			resetPass: {
				subject: 'Reset password - login boilerplate',
				callbackUrl: localUrl + '/update-password?token='
			},
			activate: {
				subject: 'Welcome to login boilerplate',
				callbackUrl: localUrl + '/activate-user?token='
			}
		},
		facebook : {
			app_id: '436355759752404', // your App ID
			app_secret: '8ba5d8d7d9460788c2474d6c25f313d7', // your App Secret
			callback_url: localUrl + '/auth/facebook/callback'
		},
		google: {
			app_id: '228004946327-bdd5uf2ka2ghe27vqda3g787i3nlrbku.apps.googleusercontent.com', // client_id
			app_secret: '2ib-0qucsCAhe5DMTOBgj0yy', // client_secret
			callback_url: localUrl + '/auth/google/callback'
		},
		linkedin: {
			app_key: '77m8ii7gyspcxy', // client_id
			app_secret: 'ZmuLKs9Oa3kmwQrP', // client_secret
			callback_url: localUrl + '/auth/linkedin/callback'
		},
		twitter: {
			app_key: 'your-consumer-key-here', // consumer_key
			app_secret: 'your-client-secret-here', // consumer_secret
			callback_url: localUrl + '/auth/twitter/callback'
		}
	};
}

// Export Rest routes 
module.exports = config;
