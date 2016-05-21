// Setup config

// NOTE - Change filename to _global-config.js for use

var config;
var env = process.env.ENV_NAME || 'dev';

if (env === 'staging' || env === 'production') {
	config = {
		port: process.env.PORT || 3000,
		version: '/v1',
		cookieSecret: 'SUPERcookieSECRET',
		tokenSecret: 'SERIOUStokenSECRET',
		mailTokenSecret: 'SERIOUSmailTokenSECRET',
		mongoHost: 'mongodb://mongo:27017/test1',
		sendgrid: {
			apikey: 'somekey'
		},
		facebook : {
			app_id: 'your-secret-clientID-here', // your App ID
			app_secret: 'your-client-secret-here', // your App Secret
			callback_url: 'http://somedomain.com/auth/facebook/callback'
		},
		twitter: {
			app_key: 'your-consumer-key-here', // consumer_key
			app_secret: 'your-client-secret-here', // consumer_secret
			callback_url: 'http://somedomain.com/auth/twitter/callback'
		},
		google: {
			app_id: 'your-secret-clientID-here', // client_id
			app_secret: 'your-client-secret-here', // client_secret
			callback_url: 'http://somedomain.com/auth/google/callback'
		}
	};
} else {
	config = {
		port: process.env.PORT || 3000,
		version: '/v1',
		cookieSecret: 'localCookieSecret',
		tokenSecret: 'localTokenSecret',
		mailTokenSecret: 'localMailTokenSecret',
		mongoHost: 'mongodb://localhost:27017/test1',
		sendgrid: {
			apikey: 'somekey'
		},
		facebook : {
			app_id: 'your-secret-clientID-here', // your App ID
			app_secret: 'your-client-secret-here', // your App Secret
			callback_url: 'http://localhost:8080/auth/facebook/callback'
		},
		twitter: {
			app_key: 'your-consumer-key-here', // consumer_key
			app_secret: 'your-client-secret-here', // consumer_secret
			callback_url: 'http://localhost:8080/auth/twitter/callback'
		},
		google: {
			app_id: 'your-secret-clientID-here', // client_id
			app_secret: 'your-client-secret-here', // client_secret
			callback_url: 'http://localhost:8080/auth/google/callback'
		}
	};
}

// Export Rest routes 
module.exports = config;