const { createLogger, format, transports } = require('winston');

// Define your custom levels if needed
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

const logger = createLogger({
  levels,
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }), // to capture stack trace
    format.splat(),
    format.json(),
  ),
  transports: [
    new transports.Console({
      level: 'info', // minimum level to log
      handleExceptions: true,
      format: format.combine(
        format.colorize(), // colorize log outputs
        format.simple(), // simple format in console
      ),
    }),
  ],
});

module.exports = logger;
