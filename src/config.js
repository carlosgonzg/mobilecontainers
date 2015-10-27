var config = {
	development : {
		APP_PORT : process.env.PORT || 8080,
		DB_URL: 'localhost:27017/modularcontainers',
		SERVER_URL: 'http://localhost:8080',
		CONFIRM_ACCOUNT_LINK : 'http://localhost:8080/user/confirm',
		CHANGE_PASSWORD_LINK : 'http://localhost:8080/#/changepassword',
		MAIL_USR: 'medicalcore@simetricaconsulting.com',
		MAIL_PASS: 'Web#8094722300',
		PUBLIC_PATH: 'public/app',
		ACTIVAR_SUBJECT: 'Activar cuenta',
		FORGOT_SUBJECT: 'Cambiar Contraseña',
		REPORT_SUBJECT: 'Reporte'
	}
}


var mode;
function getEnv() {
	var mde = mode || 'development';
	return config[mde];
}
function init(app) {
	mode = app.get('env');
	return config[mode];
}
exports.getEnv = getEnv;
exports.init = init;
