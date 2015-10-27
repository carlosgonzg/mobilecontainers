'use strict';

var q = require('q');
var util = require('../dto/util');
var WebService = require('../dto/webservice');
module.exports = function (prefix, app, RequestHandler) {
	var success = util.success;
	var error = util.error;
	var obj = new WebService(prefix, RequestHandler);
	//Create
	app.post(prefix, function (req, res) {
		obj.create(req.body.obj).then(success(res), error(res));
	});

	//Retrieve
	app.get(prefix, function (req, res) {
		obj.retrieve().then(success(res), error(res));
	});

	//Update
	app.put(prefix, function (req, res) {
		obj.update(req.body.query, req.body.obj).then(success(res), error(res));
	});

	//Delete
	app.delete (prefix + '/:id', function (req, res) {
		obj.delete (req.params.id).then(success(res), error(res));
	});

	//Find by Id
	app.get(prefix + '/search/:id', function (req, res) {
		obj.retrieveById(req.params.id).then(success(res), error(res));
	});

	//Find by Params
	app.post(prefix + '/filter', function (req, res) {
		var superObj = (typeof req.body == 'string') ? JSON.parse(req.body) : req.body;
		obj.filter(superObj).then(success(res), error(res));
	});
	
	//Custom Search
	app.post(prefix + '/customSearch', function (req, res) {
		obj.customSearch(req.body.query, req.body.conf).then(success(res), error(res));
	});
	
	//Count
	app.post(prefix + '/count', function (req, res) {
		obj.count(req.body).then(success(res), error(res));
	});

	//paginated
	app.post(prefix + '/paginated', function (req, res) {
		obj.paginatedSearch(req.body).then(success(res), error(res));
	});

	app.post(prefix + '/paginated/count', function (req, res) {
		obj.paginatedCount(req.body).then(success(res), error(res));
	});

	//Upsert
	app.put(prefix + '/:id', function (req, res) {
		obj.upsert(req.params.id, req.body.obj).then(success(res), error(res));
	});

	//UpsertRaw
	app.put(prefix + '/upsertRaw', function (req, res) {
		var obj = new ParentClass(app.db);
		obj.upsertRaw(req.body.query, req.body.obj).then(success(res), error(res));
	});

};
