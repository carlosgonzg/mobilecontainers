var q = require('q');
var ProjectResource = require('../dto/projectResource');
var util = require('../dto/util');

module.exports = function (prefix, app) {
  app.post(prefix, function (req, res) {
    var obj = new ProjectResource(app.db, req.user.account.enterpriseId, app.mongoClient);
		obj.insert(req.body.obj).then(util.success(res), util.error(res));
  });
	  //Upsert
  app.put(prefix + '/:id', function (req, res) {
    var obj = new ProjectResource(app.db, req.user.account.enterpriseId, app.mongoClient);
    obj.update(req.params.id, req.body.obj).then(util.success(res), util.error(res));
  });
	app.get(prefix + '/currencies', function (req, res) {
    var obj = new ProjectResource(app.db, req.user.account.enterpriseId, app.mongoClient);
    obj.getCurrencies().then(util.success(res), util.error(res));
  });
	app.get(prefix + '/updateRealEntries', function (req, res) {
    var obj = new ProjectResource(app.db, 0, app.mongoClient);
    obj.updateRealEntries().then(util.success(res), util.error(res));
  });
	require('./crud')(prefix, app, ProjectResource);
}
