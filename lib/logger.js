var moment = require("moment");
var Winston = require('winston');
var logger = new(Winston.Logger)({
	transports: [
		new(Winston.transports.Console)({
			// level: 'debug',
			handleExceptions: true,
			timestamp: timestamp4Log
		}),
		new(Winston.transports.File)({
			name: 'info-file',
			filename: 'logs/request.log',
			timestamp: timestamp4Log
		})
	],
	exceptionHandlers: [
		new(Winston.transports.File)({
			name: 'error-file',
			filename: 'logs/request-error.log',
			handleExceptions: true,
			humanReadableUnhandledException: true,
			timestamp: timestamp4Log
		})
	]

});

function timestamp4Log() {
	return moment().utc().utcOffset(8).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]')
}

module.exports = logger