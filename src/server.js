'use strict';
var d = require('domain').create();

d.on('error', function (er) {
	var error = {
		fecha : new Date(),
		mensaje : er.message,
		stack : er.stack
	};
	var fs = require('fs');
	var urlfs = __dirname + "/log/log-" + new Date().getFullYear() + "-" + (parseInt(new Date().getMonth()) + 1) + "-" + new Date().getDate() + ".txt";
	var txtError = "Fecha: " + error.fecha + ", Mensaje: " + error.mensaje + ", Stack: " + error.stack + "\n";
	fs.appendFile(urlfs, txtError, function (err) {
		if (err) {
			console.log(err);
		} else {
			console.log("The log was saved in " + urlfs);
		}
	});
	console.log('-----ERROR-----');
	console.log(er.stack);
	console.log('---------------');
});

d.run(function () {
	//Librerias
	var express = require('express');
	var auth = require('express-jwt');
	var http = require('http');
	var validator = require('express-validator');
	var path = require('path');
	var bodyParser = require('body-parser');
	var MongoClient = require('mongodb').MongoClient;
	var Config = require('./config');
	var mail = require('./mail');
	//Configuracion del server
	var app = express();
	var prefix = '/api';
	var secret = 'asd243131';
	app.use('/api', auth({
			secret : secret
		}));
	app.use(bodyParser.json({
			limit : '100mb'
		}));
	app.use(bodyParser.urlencoded({
			extended : true
		}));
	app.use(validator());
	//Inicializacion config y Mail
	var config = Config.init(app);
	mail.init(config);
	app.use('/', express.static(path.join(__dirname, config.PUBLIC_PATH)));
	//Configuracion db
	var db = require('monk')(config.DB_URL);	
	app.db = db;
	//DB para los aggregate
	MongoClient.connect('mongodb://' + config.DB_URL, function (err, pDB) {
		if (err) {
			console.log('ERROR DB', err);
		} 
		else {
			app.mongoClient = pDB;
		}
		//Inicializando Server
		http.createServer(app).listen(config.APP_PORT, function () {
				console.log("\n[*] Server Listening on port %d", config.APP_PORT);
		});
	});
});
