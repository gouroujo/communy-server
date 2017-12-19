const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
  exitOnError: false,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.align(),
        winston.format.simple()
      ),
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true,
    })
  ]
});


module.exports = logger
