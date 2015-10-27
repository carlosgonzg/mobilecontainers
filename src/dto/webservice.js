'use strict';

var q = require('q');
var util = require('./util');

//Constructor
function WebService(prefix, RequestHandler) {
	this.requestHandler = RequestHandler;
	this.prefix = prefix;
}

WebService.prototype.create = function (obj) {
	var _this = this;
	var d = q.defer();
	_this.requestHandler.post(_this.prefix, { obj: obj })
	.then(d.resolve)
	.fail(d.reject);
	return d.promise;
};

WebService.prototype.retrieve = function (query) {
	var _this = this;
	var d = q.defer();
	_this.requestHandler.get(_this.prefix)
	.then(d.resolve)
	.fail(d.reject);
	return d.promise;
};

WebService.prototype.update = function (qry, obj) {
	var _this = this;
	var d = q.defer();
	_this.requestHandler.put(_this.prefix, { query: qry, obj: obj })
	.then(d.resolve)
	.fail(d.reject);
	return d.promise;
};

WebService.prototype.delete  = function (id) {
	var _this = this;
	var d = q.defer();
	_this.requestHandler.delete(_this.prefix + '/' + id)
	.then(d.resolve)
	.fail(d.reject);
	return d.promise;
};

WebService.prototype.retrieveById = function (id) {
	var _this = this;
	var d = q.defer();
	_this.requestHandler.get(_this.prefix + '/search/' + id)
	.then(d.resolve)
	.fail(d.reject);
	return d.promise;
};

WebService.prototype.filter = function (obj) {
	var _this = this;
	var d = q.defer();
	_this.requestHandler.post(_this.prefix + '/filter', obj)
	.then(d.resolve)
	.fail(d.reject);
	return d.promise;
};

WebService.prototype.customSearch = function (query, conf) {
	var _this = this;
	var d = q.defer();
	_this.requestHandler.post(_this.prefix + '/customSearch', { query: query, conf: conf })
	.then(d.resolve)
	.fail(d.reject);
	return d.promise;
};

WebService.prototype.count = function (obj) {
	var _this = this;
	var d = q.defer();
	_this.requestHandler.post(_this.prefix + '/count', obj)
	.then(d.resolve)
	.fail(d.reject);
	return d.promise;
};

WebService.prototype.paginatedSearch = function (obj) {
	var _this = this;
	var d = q.defer();
	_this.requestHandler.post(_this.prefix + '/paginated', obj)
	.then(d.resolve)
	.fail(d.reject);
	return d.promise;	
};

WebService.prototype.paginatedCount = function (obj) {
	var _this = this;
	var d = q.defer();
	_this.requestHandler.post(_this.prefix + '/paginated/count', obj)
	.then(d.resolve)
	.fail(d.reject);
	return d.promise;	
};

WebService.prototype.upsert = function (id, obj) {
	var _this = this;
	var d = q.defer();
	_this.requestHandler.put(_this.prefix + '/' + id, obj)
	.then(d.resolve)
	.fail(d.reject);
	return d.promise;
};

WebService.prototype.upsertRaw = function (qry, obj) {
	var _this = this;
	var d = q.defer();
	_this.requestHandler.put(_this.prefix, { query: qry, obj: obj})
	.then(d.resolve)
	.fail(d.reject);
	return d.promise;	
};

//Export
module.exports = WebService;
