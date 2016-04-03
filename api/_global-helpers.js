// Setup helpers
function errRes(message) {
	return {
		'success': false,
		'message': message
	}
}

// Export Rest routes 
module.exports = {
	errRes: errRes 
};