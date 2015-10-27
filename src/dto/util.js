'use strict';

var q = require('q');

exports.success = function (res) {
	return function (f) {
		res.status(200).send(f);
	};
};

exports.error = function (res) {
	return function (f) {
		res.status(510).send(f);
	};
};

exports.getSequence = function (db, tabla) {
 var deferred = q.defer();
 var secuencia = db.get('SEQUENCE');
 secuencia.findAndModify({
  table: tabla
 }, {
  $inc: {
   sequence: 1
  }
 }, function (err, obj) {
  if (err != null) throw new Error(err);
  
  if (obj == null) {
    secuencia.insert({table: tabla, sequence: 2});  
    deferred.resolve(1);
  }
  else {
    deferred.resolve(obj.sequence);
  }

 });

 return deferred.promise;
};

exports.getLists = function (db, list) {
	var deferred = q.defer(),
		listas = list,
		i,
		output = {};

	db.get('LISTAS').findOne({}, function (err, obj) {
		if (err) {
			deferred.reject({
				error: {
					res: 'Not ok',
					message: 'No se pudo obtener las listas',
					error: err
				}
			});
		} else {
			for (i in listas) {
				output[listas[i]] = obj[listas[i]] || [];
			}
			// Para la compatibilidad
			//output = (listas) ? output : [obj];
			deferred.resolve(output);
		}
	});

	return deferred.promise;
};

exports.getCredentialsFilter = function (req) {
	if (!req.user) {
		return {};
	}

	var where = {};

	if (req.user.rol === "Administrador") {
		where.usuarioId = {
			$in: req.user.oficiales
		};
	} else {
		where.usuarioId = req.user.usuarioId;
	}

	return where;
};