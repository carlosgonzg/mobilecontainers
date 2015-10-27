'use strict';

var q = require('q'),
util = require('./util'),
Validator = require('jsonschema').Validator,
math = require('sinful-math');


//Constructor
function Crud(db, table, enterpriseId) {
	this.table = table;
	this.db = db;
	this.enterpriseId = enterpriseId;
	this.validator = new Validator();
	this.uniqueFields = [];
	this.schema = {};
}

//Funcion para manejar las respuestas de Mongo
function handleMongoResponse(deferred) {
	return function (err, data) {
		if (err) {
			deferred.reject({
				result : 'Not ok',
				data : err
			});
			throw err;
		} else {
			deferred.resolve({
				result : "Ok",
				data : data
			});
		}
	};
}

//Funcion que verifica si el objeto a ser insertado ya lo esta.
var checkUniqueFields = function (object, crud) {
	var deferred = q.defer(),
	query = {
		'$or' : [],
		'$and' : [{
				enterpriseId : crud.enterpriseId
			}
		]
	},
	uniqueFields = crud.uniqueFields,
	x;

	if (uniqueFields.length !== 0) {
		for (x in uniqueFields) {
			var prop = {};
			prop[uniqueFields[x]] = object[uniqueFields[x]];
			query.$or.push(prop);
		}

		query._id = {
			$ne : object._id
		};

		crud.db.get(crud.table).find(query, function (err, data) {
			if (data) {
				if (data.length > 0) {
					deferred.resolve({
						exists : true
					});
				} else {
					deferred.resolve({
						exists : false
					});
				}
			} else {
				deferred.reject({
					res : 'Not ok',
					error : err,
					message : 'No se pudo hacer la busqueda'
				});
			}
		});

	} else {
		deferred.resolve({
			exists : false
		});
	}
	return deferred.promise;
};

// Buscar por id. Recibe el query o id por el cual se realizara la busqueda.
Crud.prototype.buscarPorId = function (query) {
	var deferred = q.defer();
	if (!isNaN(query)) {
		query = {
			'_id' : parseInt(query)
		};
	}

	this.db.get(this.table).findOne(query, handleMongoResponse(deferred));

	return deferred.promise;
};

//Funcion para validar un objeto antes de que sea insertado. (Utiliza el esquema especificado en la clase)
Crud.prototype.validate = function (deferred, object) {

	if (this.schema === null) {
		throw new Error('Schema is not defined');
	}
	var validated = this.validator.validate(object, this.schema);

	if (validated.errors.length === 0) {
		return true;
	} else {
		deferred.reject(validated.errors);
	}
	return false;
};

function converDate(object) {
	var key;
	for (key in object) {

		if (/date/.test(key.toLowerCase())) {
			object[key] = new Date(object[key]);

			if (isNaN(object[key])) {
				object[key] = undefined;
			}

		}
	}
	return object;
}
Crud.prototype.insertRaw = function (newObject) {
	var deferred = q.defer();
	var _this = this;
	util.getSequence(_this.db, _this.table).then(function (sequence) {
		newObject._id = sequence;
		if (newObject.baseApiPath) {
			delete newObject.baseApiPath;
		}
		_this.db.get(_this.table).insert(newObject, function (err, data) {
			if (err) {
				console.log('err', err);
				deferred.reject(err);
				throw err;
			} else {
				var res = {
					result : "Ok",
					data : data
				};
				deferred.resolve(res);
			}
		});
	})
	.fail(function (error) {
		console.log('err', error);
		deferred.reject({
			result : 'Not ok',
			error : error,
			message : 'Mo se pudo obtener la secuencia'
		});
	});
	return deferred.promise;
};
// Funcion que inserta un nuevo objeto en la base de datos. (Primero se verifica si existe)
Crud.prototype.insert = function (newObject, schema) {
	var deferred = q.defer();
	newObject = converDate(newObject);
	newObject.createdDate = new Date();

	if (this.enterpriseId !== undefined) {
		newObject.enterpriseId = this.enterpriseId;
	}

	if (newObject.date !== undefined) {
		newObject.date.setHours(0, 0, 0, 0);
	}

	if (this.validate(deferred, newObject)) {

		var table = this.table,
		db = this.db;

		delete newObject.baseApiPath;
		delete newObject.errors;

		checkUniqueFields(newObject, this).then(function (data) {
			if (!data.exists) {

				util.getSequence(db, table).then(function (sequence) {
					newObject._id = sequence;
					if (newObject.baseApiPath) {
						delete newObject.baseApiPath;
					}
					db.get(table).insert(newObject, function (err, data) {
						if (err) {
							deferred.reject(err);
							throw err;

						} else {
							var res = {
								result : "Ok",
								data : data
							};
							deferred.resolve(res);
						}

					});
					//handleMongoResponse(deferred)

				}, function (error) {
					deferred.reject({
						result : 'Not ok',
						error : error,
						message : 'Mo se pudo obtener la secuencia'
					});
				});
			} else {
				deferred.reject({
					result : 'Not ok',
					error : data,
					message : 'Este objeto ya existe'
				});
			}
		}, function (error) {
			deferred.reject({
				result : 'Not ok',
				error : error,
				message : 'No se pudo hacer la combrobacion'
			});
		});

	}
	return deferred.promise;
};

Crud.prototype.delete  = function (query) {
	var deferred = q.defer();

	if (JSON.stringify(query) === '{}') {
		throw new Error('query is not defined');
	}

	if (!isNaN(query)) {
		query = {
			_id : parseInt(query)
		};
	}

	this.db.get(this.table).remove(query, {
		justOne : 1
	}, function (err, data) {

		if (err) {
			throw err;
		}

		if (data > 0) {
			deferred.resolve({
				result : "Ok",
				data : data
			});
		} else {
			deferred.reject({
				result : "Not ok",
				data : data
			});
		}
	});

	return deferred.promise;
};

Crud.prototype.update = function (qry, obj) {
	var deferred = q.defer(),
	query = qry,
	that = this;

	if (query === undefined || JSON.stringify(query) === '{}') {
		throw new Error('query is not defined');
	}
	if (obj === undefined || JSON.stringify(obj) === '{}') {
		throw new Error('obj is not defined');
	}

	obj = converDate(obj);

	if (this.validate(deferred, obj)) {

		delete obj.baseApiPath;
		delete obj.errors;

		checkUniqueFields(obj, this).then(function (data) {
			if (!data.exists) {
				that.db.get(that.table).update(query, {
					$set : obj
				}, handleMongoResponse(deferred));
			} else {
				deferred.reject({
					result : 'Not ok',
					error : {},
					message : 'Este objeto ya existe'
				});
			}
		}, function (error) {
			deferred.reject({
				result : 'Not ok',
				error : error,
				message : 'No se pudo hacer la comprobacion'
			});
		});
	}
	return deferred.promise;
};

Crud.prototype.updateRaw = function (qry, obj) {
	var deferred = q.defer(),
	query = qry;

	delete obj.baseApiPath;
	delete obj.errors;
	if (query === undefined || JSON.stringify(query) === '{}') {
		throw new Error('query is not defined');
	}
	if (obj === undefined || JSON.stringify(obj) === '{}') {
		throw new Error('obj is not defined');
	}
	if (obj.baseApiPath) {
		delete obj.baseApiPath;
	}
	this.db.get(this.table).update(query, obj, {
		//upsert: true,
		multi : true
	}, handleMongoResponse(deferred));

	return deferred.promise;
};

Crud.prototype.upsert = function (id, obj) {
	obj = converDate(obj);
	if (obj.baseApiPath) {
		delete obj.baseApiPath;
	}
	var deferred = q.defer(),
	query = {
		_id : parseInt(id)
	};
	this.db.get(this.table).update(query, obj, {
		upsert : true
	}, handleMongoResponse(deferred));
	return deferred.promise;
};

Crud.prototype.upsertRaw = function (qry, obj) {
	var deferred = q.defer(),
	query = qry;

	if (query === undefined || JSON.stringify(query) === '{}') {
		throw new Error('query is not defined');
	}
	if (obj === undefined || JSON.stringify(obj) === '{}') {
		throw new Error('obj is not defined');
	}

	obj = converDate(obj);

	if (this.validate(deferred, obj)) {

		var that = this,
		db = this.db,
		table = this.table;
		util.getSequence(db, table).then(function (sequence) {
			//console.log('secuencia?', sequence);
			obj._id = obj._id ? obj._id : sequence;
			if (obj.baseApiPath) {
				delete obj.baseApiPath;
			}
			that.db.get(that.table).update(query, obj, {
				upsert : true,
				//multi: true
			}, handleMongoResponse(deferred));
			//handleMongoResponse(deferred)

		}, function (error) {
			deferred.reject({
				result : 'Not ok',
				error : error,
				message : 'Mo se pudo obtener la secuencia'
			});
		});

	}

	return deferred.promise;
};

Crud.prototype.findUpdateOrInsert = function (qry, obj) {
	var deferred = q.defer(),
	query = qry,
	that = this,
	db = this.db,
	table = this.table;
	if (query === undefined || JSON.stringify(query) === '{}') {
		throw new Error('query is not defined');
	}
	if (obj === undefined || JSON.stringify(obj) === '{}') {
		throw new Error('obj is not defined');
	}
	obj = converDate(obj);
	if (this.validate(deferred, obj)) {
		this.db.get(this.table).find(query, function (err, objetos) {
			if (err) {
				deferred.reject({
					result : 'Not ok',
					error : error,
					message : 'Mo se pudo obtener la secuencia'
				});
			}
			if (objetos.length > 0) {
				if (obj.baseApiPath) {
					delete obj.baseApiPath;
				}
				that.db.get(that.table).update(query, {
					$set : obj
				}, handleMongoResponse(deferred));
			} else {
				util.getSequence(db, table).then(function (sequence) {
					obj._id = obj._id ? obj._id : sequence;
					if (obj.baseApiPath) {
						delete obj.baseApiPath;
					}
					that.db.get(that.table).insert(obj, handleMongoResponse(deferred));
				}, function (error) {
					deferred.reject({
						result : 'Not ok',
						error : error,
						message : 'Mo se pudo obtener la secuencia'
					});
				});
			}
		});
	}
	return deferred.promise;
};

Crud.prototype.search = function (query) {
	var deferred = q.defer(),
	date;
	query = typeof query === 'string' ? JSON.parse(query) : query;
	//Cuando se manda fecha de inicio
	if (query.fromDate !== undefined && query.fromDate !== "") {
		if (query.$and === undefined) {
			query.$and = [];
		}

		date = {};
		date.entryDate = {
			$gte : new Date(query.fromDate)
		};
		query.$and.push(date);
	}
	//Cuando se manda fecha de fin
	if (query.toDate !== undefined && query.toDate !== "") {
		if (query.$and === undefined) {
			query.$and = [];
		}

		date = {};
		date.entryDate = {
			$lte : new Date(query.toDate)
		};
		query.$and.push(date);
	}
	delete query.fromDate;
	delete query.toDate;

	query = converDate(query);
	this.db.get(this.table).find(query, {
		sort : [['code', 'asc'], ['_id', 'asc']]
	}, handleMongoResponse(deferred));
	return deferred.promise;
};

// Specify the query and the parameters like sort, limit, etc.
Crud.prototype.customSearch = function (query, conf) {
	var deferred = q.defer(),
	date = {},
	date2 = {};

	query = typeof query === 'string' ? JSON.parse(query) : query;
	conf = typeof conf === 'string' ? JSON.parse(conf) : conf;

	//Cuando se manda fecha de inicio
	if (query.fromDate !== undefined && query.fromDate !== "") {
		if (query.$and === undefined) {
			query.$and = [];
		}
		date.entryDate = {
			$gte : new Date(query.fromDate)
		};
		query.$and.push(date);
	}
	//Cuando se manda fecha de fin
	if (query.toDate !== undefined && query.toDate !== "") {
		if (query.$and === undefined) {
			query.$and = [];
		}
		date2.entryDate = {
			$lte : new Date(query.toDate)
		};
		query.$and.push(date2);
	}
	delete query.fromDate;
	delete query.toDate;

	query = converDate(query);
	this.db.get(this.table).find(query, conf, handleMongoResponse(deferred));
	return deferred.promise;
};

Crud.prototype.count = function (query) {
	var deferred = q.defer();
	query = typeof query === 'string' ? JSON.parse(query) : query;

	this.db.get(this.table).count(query, handleMongoResponse(deferred));
	return deferred.promise;
};

//Parameters
//table: name of the colletion
//limit: number of records
//skip: number of records to be skipped
//sort: object with the fields in which the query is going to be sorted
//filter: filter that is gonna be used, must be passed as a String
//search: a string that is going to be look in a set of fields
//fields: array of strings with the fields names that the 'search' attribute is going to be looked in
//

Crud.prototype.paginatedSearch = function (query) {
	var deferred = q.defer(),
	where = {};

	if (query.filter !== undefined) {
		if (typeof query.filter === 'string') {
			try {
				where = JSON.parse(query.filter);
			} catch (e) {}
		} else {
			where = query.filter;
		}
		//where = typeof query.filter == 'string' ? try {JSON.parse(query.filter) } catch (e) {console.log(e) } : query.filter;
	}

	var search = query.search,
	fields = query.fields,
	dateRange = query.dateRange,
	startDate = query.startDate,
	endDate = query.endDate,
	pagination = {
		limit : query.limit,
		skip : query.skip,
		sort : query.sort
	},
	field = {};
	if (!query.all) {
		if (Array.isArray(fields) && fields.length > 0) {

			fields.forEach(function (item) {
				field[item] = 1;
			});

			pagination.fields = field;

		}
	}
	//Login Credentials
	// if (this.enterpriseId != null) {
	// where['user.enterpriseId'] = this.enterpriseId;
	// }

	// Filtro por multiples campos
	if (Array.isArray(fields) && fields.length > 0 && search) {
		where.$or = [];
		fields.forEach(function (field) {
			var obj = {};
			// MEJORAR LA BUSQUEDA
			if (isNaN(search)) {
				obj[field] = {
					$regex : search,
					$options : 'i'
				};
			} else {
				obj[field] = parseFloat(search);
			}

			where.$or.push(obj);
		});
	}

	// Filtro por multiples campos para fecha
	if (dateRange !== undefined && dateRange !== "") {
		where.$and = [];
		var fieldsRange = dateRange.fields,
		fechaInicio = dateRange.start.toString().split('-'),
		fechaFin = dateRange.end.toString().split('-'),
		objectStart = {
			dia : fechaInicio[2].substring(0, 2),
			mes : fechaInicio[1],
			ano : fechaInicio[0]
		},
		objectEnd = {
			dia : fechaFin[2].substring(0, 2),
			mes : fechaFin[1],
			ano : fechaFin[0]
		};
		fieldsRange.forEach(function (field) {
			var obj = {};
			obj[field] = {
				$gte : new Date(objectStart.ano, math.sub(objectStart.mes, 1), objectStart.dia, 0, 0, 0),
				$lte : new Date(objectEnd.ano, math.sub(objectEnd.mes, 1), objectEnd.dia, 23, 59, 59)
			};
			where.$and.push(obj);
		});
	}

	if (startDate !== undefined && startDate !== "") {
		if (where.$and === undefined) {
			where.$and = [];
		}
		var from = startDate.date.toString().split('-'),
		obj = {
			dia : from[2].substring(0, 2),
			mes : from[1],
			ano : from[0]
		};
		var date = {};
		date[startDate.field] = {
			$gte : new Date(obj.ano, math.sub(obj.mes, 1), obj.dia, 0, 0, 0)
		};
		where.$and.push(date);

	}

	if (endDate != undefined && endDate != "") {
		if (where.$and == undefined) {
			where.$and = [];
		}
		var from = endDate.date.toString().split('-');
		var obj = {
			dia : from[2].substring(0, 2),
			mes : from[1],
			ano : from[0]
		};
		var date = {};
		date[endDate.field] = {
			$lte : new Date(obj.ano, math.sub(obj.mes, 1), obj.dia, 23, 59, 59)
		};
		where.$and.push(date);
	}

	//{"$or":[{"_id":{"$regex":"Débito","$options":"i"}},{"description":{"$regex":"Débito","$options":"i"}},{"accountType.origin":{"$regex":"Débito","$options":"i"}},{"labelAsociated":{"$regex":"Débito","$options":"i"}},{"accountType.accountCategory":{"$regex":"Débito","$options":"i"}}]}
	this.db.get(this.table).find(where, pagination, handleMongoResponse(deferred));

	return deferred.promise;
};

Crud.prototype.paginatedCount = function (query) {
	var deferred = q.defer(),
	where = {};
	//console.log(query.filter);
	if (query.filter != undefined) {
		if (typeof query.filter == 'string') {
			try {
				where = JSON.parse(query.filter);
			} catch (e) {
				console.log('\n **** Error: ');
			}
		} else {
			where = query.filter;
			console.log('not string');
		}
		//where = typeof query.filter == 'string' ? try {JSON.parse(query.filter) } catch (e) {console.log(e) } : query.filter;
	}

	var search = query.search,
	fields = query.fields,
	dateRange = query.dateRange,
	startDate = query.startDate,
	endDate = query.endDate,
	pagination = {
		limit : query.limit,
		skip : query.skip,
		sort : query.sort
	}

	//Login Credentials
	if (this.enterpriseId != null) {
		where['enterpriseId'] = this.enterpriseId;
	}

	// Filtro por multiples campos
	if (Array.isArray(fields) && fields.length > 0 && search) {
		where.$or = [];
		fields.forEach(function (field) {
			var obj = {};
			// MEJORAR LA BUSQUEDA
			if (isNaN(search)) {
				obj[field] = {
					$regex : search,
					$options : 'i'
				}
			} else {
				obj[field] = parseFloat(search);
			}

			where.$or.push(obj);
		});
	}

	// Filtro por multiples campos para fecha
	if (dateRange != undefined && dateRange != "") {
		where.$and = [];
		var fieldsRange = dateRange.fields;
		var fechaInicio = dateRange.start.toString().split('-');
		var fechaFin = dateRange.end.toString().split('-');
		var objectStart = {
			dia : fechaInicio[2].substring(0, 2),
			mes : fechaInicio[1],
			ano : fechaInicio[0]
		};
		var objectEnd = {
			dia : fechaFin[2].substring(0, 2),
			mes : fechaFin[1],
			ano : fechaFin[0]
		};
		fieldsRange.forEach(function (field) {
			var obj = {};
			obj[field] = {
				$gte : new Date(objectStart.ano, math.sub(objectStart.mes, 1), objectStart.dia, 0, 0, 0),
				$lte : new Date(objectEnd.ano, math.sub(objectEnd.mes, 1), objectEnd.dia, 23, 59, 59)
			};
			where.$and.push(obj);
		})
	}

	if (startDate != undefined && startDate != "") {
		if (where.$and == undefined) {
			where.$and = [];
		}
		var from = startDate.date.toString().split('-');
		var obj = {
			dia : from[2].substring(0, 2),
			mes : from[1],
			ano : from[0]
		};
		var date = {};
		date[startDate.field] = {
			$gte : new Date(obj.ano, math.sub(obj.mes, 1), obj.dia, 0, 0, 0)
		};
		where.$and.push(date);

	}

	if (endDate != undefined && endDate != "") {
		if (where.$and == undefined) {
			where.$and = [];
		}
		var from = endDate.date.toString().split('-');
		var obj = {
			dia : from[2].substring(0, 2),
			mes : from[1],
			ano : from[0]
		};
		var date = {};
		date[endDate.field] = {
			$lte : new Date(obj.ano, math.sub(obj.mes, 1), obj.dia, 23, 59, 59)
		};
		where.$and.push(date);
	}
	//{"$or":[{"_id":{"$regex":"Débito","$options":"i"}},{"description":{"$regex":"Débito","$options":"i"}},{"accountType.origin":{"$regex":"Débito","$options":"i"}},{"labelAsociated":{"$regex":"Débito","$options":"i"}},{"accountType.accountCategory":{"$regex":"Débito","$options":"i"}}]}
	this.db.get(this.table).count(where, /*pagination,*/
		handleMongoResponse(deferred));

	return deferred.promise;
};

Crud.prototype.getNext = function (date) {
	var deffered = q.defer();
	var query = {};
	if (date) {
		query = {
			date : {
				$gt : new Date(date)
			}
		};
	} else {
		query = {
			date : {
				$gt : new Date()
			}
		};
	};

	this.db.get(this.table).find(query, {
		sort : [['date', 1]],
		limit : 1
	}, function (err, data) {
		if (err) {
			deffered.reject(err);
		};
		if (data) {
			deffered.resolve(data);
		};
	});

	return deffered.promise;
};

Crud.prototype.getPrevious = function (date) {
	var deffered = q.defer();
	var query = {};

	if (date) {
		query = {
			date : {
				$lt : new Date(date)
			}
		};
	} else {
		query = {
			date : {
				$lt : new Date()
			}
		};
	};

	this.db.get(this.table).find(query, {
		sort : [['date', -1]],
		limit : 1
	}, function (err, data) {
		if (err) {
			deffered.reject(err);
		};
		if (data) {
			deffered.resolve(data);
		};
	});

	return deffered.promise;
};

//Private Functions
function handleMongoResponse(deferred) {
	return function (err, data) {
		if (err) {
			deferred.reject({
				result : 'Not ok',
				errors : err
			});
			throw err;
		} else {
			deferred.resolve({
				result : "Ok",
				data : data
			});
		}
	};
}

//Export
module.exports = Crud;
