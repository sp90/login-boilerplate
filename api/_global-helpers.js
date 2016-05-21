var _ = require('lodash');

// Setup helpers
function errRes(message, xtraObj) {
	var obj = {
		'success': false,
		'message': message
	};

	if (!_.isUndefined(xtraObj)) {
		obj.data = xtraObj;
	};

	return obj;
}

// Export Rest routes 
module.exports = {
	errRes: errRes 
};