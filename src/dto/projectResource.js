'use strict';

var q = require('q');
var Crud = require('./crud');

function ProjectResource(db, enterpriseId, mongoClient) {
	this.enterpriseId = enterpriseId;
	this.mongoClient = mongoClient;
	this.crud = new Crud(db, 'PROJECTRESOURCE', enterpriseId);
	this.db = db;
	//DB Table Schema
	this.schema = {
		'id' : '/ProjectResource',
		'type' : 'object',
		'properties' : {
			'resource' : {
				'type' : 'object',
				'required' : true
			},
			'project' : {
				'type' : 'object',
				'required' : true
			}
		}
	};
	this.crud.uniqueFields = ['resource._id', 'project._id'];
};

var getRealEntries = function (obj) {
	var periodEntries = [];
	//Gastos
	for (var i in obj.periods) {
		for (var j = 0; j < obj.resource.amounts.length; j++) {
			var notToInsert = ['Preaviso', 'Cesantia', 'Regalia', 'Bonificacion', 'Cesantía', 'Regalía', 'Bonificación', 'Vacaciones'];
			var validated = true;
			for (var k = 0; k < notToInsert.length; k++) {
				if (obj.resource.amounts[j].type == notToInsert[k]) {
					validated = false;
					break;
				}
			}
			if (validated) {
				var period = obj.periods[i];
				var amount = obj.resource.amounts[j];
				var year = i.split('-')[0];
				var month = i.split('-')[1];
				var date = new Date(year, month - 1, 1, 0,0,0);
				var pEntry = {
					periodDate : date,
					origin : 'Gasto',
					amount : amount.amount * period.percentage,
					proceeds : amount.type
				};
				periodEntries.push(pEntry);
			}
		}
	}
	return periodEntries;
};
ProjectResource.prototype.insert = function (obj) {
	var _this = this;
	var d = q.defer();
	obj.periodEntry = getRealEntries(obj);
	_this.crud.insert(obj)
	.then(function (res) {
		d.resolve(res);
	}, function (err) {
		d.reject(err);
	});
	return d.promise;
};

ProjectResource.prototype.update = function (query, obj) {
	var _this = this;
	var d = q.defer();
	delete obj.baseApiPath;
	delete obj.errors;
	delete obj.result;
	delete obj.data;
	obj.periodEntry = getRealEntries(obj);
	_this.crud.upsert(query, obj)
	.then(function (res) {
		d.resolve({
			data : res
		});
	})
	.fail(function (err) {
		console.log(err);
		d.reject(err);
	});
	return d.promise;
};
ProjectResource.prototype.updateRealEntries = function(){
	var _this = this;
	var d = q.defer();
	_this.crud.search({})
	.then(function(result){
		var promise  = [];
		for(var i = 0; i < result.data.length; i++){
			promise.push(_this.update(result.data[i]._id, result.data[i]));
		}
		return q.all(promise);
	})
	.then(function(result){
		d.resolve(result);
	})
	.fail(function(err){
		d.reject(err);
	});
	return d.promise;
};
ProjectResource.prototype.updateResource = function (query, obj) {
	var _this = this;
	var d = q.defer();
	_this.crud.updateRaw(query, obj)
	.then(function () {
		return _this.crud.search(query);
	})
	.then(function (result) {
		var promise = [];
		for (var i = 0; i < result.data.length; i++) {
			promise.push(_this.update(result.data[i]._id, result.data[i]));
		}
		return q.all(promise);
	})
	.then(function (res) {
		d.resolve({
			data : res
		});
	}, function (err) {
		d.reject(err);
	});
	return d.promise;
};

ProjectResource.prototype.updateProject = function (projectId, project) {
	var _this = this;
	var d = q.defer();
	var query = {
		'project._id' : parseInt(projectId)
	};
	_this.crud.updateRaw(query, {
		$set : {
			project : project
		}
	})
	.then(function () {
		return _this.crud.search(query);
	})
	.then(function (result) {
		var promise = [];
		for (var i = 0; i < result.data.length; i++) {
			promise.push(_this.update(result.data[i]._id, result.data[i]));
		}
		return q.all(promise);
	})
	.then(function (res) {
		d.resolve({
			data : res
		});
	}, function (err) {
		d.reject(err);
	});
	return d.promise;
};

ProjectResource.prototype.getCurrencies = function () {
	var d = q.defer();
	var _this = this;
	var cursor = _this.mongoClient.collection('PROJECTRESOURCE')
		.aggregate([{
					$unwind : '$periodEntry'
				}, {
					$project : {
						'resource.currency.code' : 1,
						'resource.currency.name' : 1,
						'project.currency.code' : 1,
						'project.currency.name' : 1
					}
				}, {
					$group : {
						_id : {
							'resourceCode' : '$resource.currency.code',
							'resourceName' : '$resource.currency.name',
							'projectCode' : '$project.currency.code',
							'projectName' : '$project.currency.name'
						}
					}
				}
			], {
			allowDiskUse : true,
			cursor : {
				batchSize : 1000
			}
		});
	var datax = [];
	cursor.on('data', function (data) {
		datax.push(data);
	});
	cursor.on('end', function () {
		var nCurrencies = {};
		for (var i = 0; i < datax.length; i++) {
			var code1 = datax[i]._id.resourceCode;
			var code2 = datax[i]._id.projectCode;
			if (nCurrencies[code1]) {
				continue;
			} else {
				nCurrencies[code1] = {
					code : datax[i]._id.resourceCode,
					name : datax[i]._id.resourceName
				}
			}
			if (nCurrencies[code2]) {
				continue;
			} else {
				nCurrencies[code2] = {
					code : datax[i]._id.projectCode,
					name : datax[i]._id.projectName
				}
			}
		}
		d.resolve(Object.keys(nCurrencies).map(function (val) {
				return nCurrencies[val]
			}));
	},
		function (err) {
		d.reject(err);
	});
	return d.promise;
};

//Export
module.exports = ProjectResource;
