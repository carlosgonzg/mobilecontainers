'use strict';

var q = require('q');
var util = require('../dto/util');


module.exports = function (prefix, app, ParentClass) {
	
  var success =  util.success,
		error =  util.error;
	
  //Insert
  app.post(prefix, function (req, res) {
		console.log('Insertando el objeto--------')
    var obj = new ParentClass(app.db, req.user.account.enterpriseId);
	obj.crud.insert(req.body.obj).then(success(res), error(res));
  });

  //Update
  app.put(prefix, function (req, res) {
    var obj = new ParentClass(app.db);
    obj.crud.update(req.body.query, req.body.obj).then(success(res), error(res));
  });

  //Find
  app.get(prefix, function (req, res) {
    var obj = new ParentClass(app.db);
	  obj.crud.search(req.body).then(success(res), error(res));
  });

  //Delete by Id
  app.delete(prefix + '/:id', function (req, res) {
    var obj = new ParentClass(app.db);
  	obj.crud.delete(req.params.id).then(success(res), error(res));
  });

  //Find by Id
  app.get(prefix + '/search/:id', function (req, res) {
    var obj = new ParentClass(app.db);
    obj.crud.buscarPorId(req.params.id).then(success(res), error(res));
  });

  //Find by Params
  app.post(prefix + '/filter', function (req, res) {
    var obj = new ParentClass(app.db);
    var superObj = (typeof req.body == 'string') ? JSON.parse(req.body) : req.body;
    obj.crud.search(superObj).then(success(res), error(res));
  });

  //Count
  app.post(prefix + '/count', function (req, res) {
		console.log('\n\n ----- Web Services -> Count -> ');
		console.log(ParentClass);
    var obj = new ParentClass(app.db);
    obj.crud.count(req.body).then(success(res), error(res));
  });

  //Paginated Search
  //Parameters
  //limit:  number of records
  //skip:   number of records to be skipped
  //sort:   object with the fields in which the query is going to be sorted
  //filter: filter that is gonna be used, must be passed as a String
  //search: a string that is going to be look in a set of fields
  //fields: array of strings with the fields names that the 'search' attribute is going to be looked in
  //
  app.post(prefix + '/paginated', function (req, res) {
    var obj = new ParentClass(app.db);
    obj.crud.paginatedSearch(req.body).then(success(res), error(res));
  });

  app.post(prefix + '/paginated/count', function (req, res) {
    var obj = new ParentClass(app.db);
    obj.crud.paginatedCount(req.body).then(success(res), error(res));
  });

  //Upsert
  app.put(prefix + '/:id', function (req, res) {console.log('Upsert',req.body);
    var obj = new ParentClass(app.db);
    obj.crud.upsert(req.params.id, req.body.obj).then(success(res), error(res));
  });
	
  //UpsertRaw
  app.put(prefix + '/upsertRaw', function (req, res) {
    var obj = new ParentClass(app.db);
    obj.crud.upsertRaw(req.body.query, req.body.obj).then(success(res), error(res));
  });
	
  //Custom Search
  app.post(prefix + '/customSearch', function (req, res) {
    var obj = new ParentClass(app.db);
    obj.crud.customSearch(req.body.query, req.body.conf).then(success(res), error(res));
  });
};