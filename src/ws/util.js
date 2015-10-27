var q = require('q'),
	utilDb = require('../dto/utilDb'),
	util = require('../dto/util');


module.exports = function (prefix, app) {
	var success = util.success,
		error = util.error;
	//1) Find 
	app.get(prefix + '/Collection/:table', function (req, res) {
		var table = typeof req.params.table === 'string' ? req.params.table.toUpperCase() : req.params.table.toString().toUpperCase();
		utilDb.search(app.db, table).then(success(res), error(res));
	});

	//2) 
	app.get(prefix + '/prueba/:enterpriseId/:name', function (req, res) {
		util.getYearlySequence(app.db, req.params.enterpriseId, req.params.name).then(success(res), error(res));
	});

	app.post(prefix + '/getLists', function (req, res) {
		util.getLists(app.db, req.body.list).then(success(res), error(res));

	});

	

};