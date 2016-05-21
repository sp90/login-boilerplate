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
		}
	};
}

// Export Rest routes 
module.exports = config;