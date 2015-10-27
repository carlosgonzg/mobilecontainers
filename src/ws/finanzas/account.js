module.exports = function (prefix, app, RequestHandler) {
	require('../webservice')(prefix, app, RequestHandler);
}