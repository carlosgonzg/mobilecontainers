var nodemailer = require('nodemailer');
var md5 = require('MD5');
var fs = require('fs');
var smtpTransport;
var urlConfirmMail;
var tmpMail = {
    User: "./email/templateUser.html",
	};
var mailOptions = {};
var q = require('q');

var bringTemplateData = function (url) {
	var deferred = q.defer();
	fs.readFile(url, function (err, data) {
		if (err){
			deferred.reject(err);
			return;
		}
		deferred.resolve(data.toString());
	});
	return deferred.promise;
};

var init = function (conf) {
	smtpTransport = nodemailer.createTransport({
		service : 'Yahoo',
		auth : {
			user : conf.MAIL_USR,
			pass : conf.MAIL_PASS
		}
	});
	mailOptions.from = 'PM Core <' + conf.MAIL_USR + '>';
};

var sendMail = function (to, subject, body, isHtmlBody, attachments, cc, cco) {
	var deferred = q.defer();
	mailOptions.to = to;
	mailOptions.cc = cc ? cc : '';
	mailOptions.cco = cco ? cco : '';
	mailOptions.subject = subject;
	if (isHtmlBody) {
		mailOptions.html = body;
	} else {
		mailOptions.text = body;
	}
	if (attachments != undefined)
		mailOptions.attachments = attachments;	
	console.log(mailOptions);
	console.log('Enviando mensaje');
	smtpTransport.sendMail(mailOptions, function (error, response) {
		if (error) {
			console.log(error);
			deferred.reject(error);
		} else {
			console.log('Message sent: ' + response.response);
			deferred.resolve(response);
		}
		// if you don't want to use this transport object anymore, uncomment following line
		//smtpTransport.close(); // shut down the connection pool, no more messages
	});
	return deferred.promise;
};

var sendActivationEmail = function(to, link, config){
	var deferred = q.defer();
	bringTemplateData('./email/activar.html')
	.then(function(body){
		var url = config.SERVER_URL + '/#/perfil/activar/' + link;
		body = body.replace(/\|url\|/g, url);
		sendMail(to, config.ACTIVAR_SUBJECT || 'Test Mail', body, true)
		.then(function(response){
			deferred.resolve(response);
		},
		function(err){
			deferred.reject(err);
		});
	},
	function(err){
		deferred.reject(err);
	});
	return deferred.promise;
};

var sendForgotPasswordMail = function(to, link, config){
	var deferred = q.defer();
	bringTemplateData('./email/forgotpassword.html')
	.then(function(body){
		var url = config.SERVER_URL + '/#/perfil/forgotpassword/' + link;
		body = body.replace(/\|url\|/g, url);
		sendMail(to, config.FORGOT_SUBJECT || 'Test Mail', body, true)
		.then(function(response){
			deferred.resolve(response);
		},
		function(err){
			deferred.reject(err);
		});
	},
	function(err){
		deferred.reject(err);
	});
	return deferred.promise;
};

exports.sendConfirmateMail = function(to, username, password, tipoUsuario){
  var subject = 'Confirmación de Correo'
    , token = md5(Date() + to)
    , urlEmail = urlConfirmMail + '/' + token;
    console.log(to, username, password, tipoUsuario)
	bringTemplateData(tmpMail[tipoUsuario],function(data){
		var html = data;
		html = html.replace('<emailUrl>',urlEmail);
		html = html.replace('<emailUsuario>',username);
		html = html.replace('<emailPassword>',password);
		sendMail(to,subject,html,true);
	});
  return token;
};


var sendReport = function(to, attachment, config){
	var deferred = q.defer();
	bringTemplateData('./email/report.html')
	.then(function(body){
		sendMail(to, config.REPORT_SUBJECT || 'Test Mail', body, true, attachment)
		.then(function(response){
			deferred.resolve(response);
		},
		function(err){
			deferred.reject(err);
		});
	},
	function(err){
		deferred.reject(err);
	});
	return deferred.promise;
};

exports.init = init;
exports.sendMail = sendMail;
exports.sendActivationEmail = sendActivationEmail;
exports.sendForgotPasswordMail = sendForgotPasswordMail;
exports.sendReport = sendReport;
