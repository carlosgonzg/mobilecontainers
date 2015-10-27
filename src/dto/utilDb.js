var jLinq = require('jlinq'),
	q = require('q'),
	md5 = require('MD5'),
	Crud = require('./crud');

/*exports.getSequence = function (db, tabla) {
	var deferred = q.defer();

	db.get('SECUENCIA').findAndModify({
		tabla: 'ACCOUNT'
	}, {
		$inc: {
			secuencia: 1
		}
	}, function (err, obj) {
		if (err != null) throw new Error(err);
		if (obj == null) throw new Error('* Sequence does not exists ' + tabla);

		deferred.resolve(obj.secuencia);
	});

	return deferred.promise;
};*/

// Search
exports.search = function (db, table) {
	var deferred = q.defer(),
		crud = new Crud(db, table);

	crud.search({}).then(function (data) {
		deferred.resolve(data);
	}, function (error) {
		deferred.reject(error);
	});
	return deferred.promise;
};
