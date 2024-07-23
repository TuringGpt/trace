import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const userDataPath = app.getPath('userData');
const logDirectory = path.join(userDataPath, 'logs');

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

export { logDirectory };

// get this only once per run, so that the log file name is unique per run
const getHourAndMin = (() => {
  const date = new Date();
  const min = date.getMinutes();
  const hour = date.getHours();
  return `${hour}-${min}`;
})();

const transport = new DailyRotateFile({
  filename: path.join(logDirectory, `trace_%DATE%_${getHourAndMin}`),
  datePattern: 'YYYY-MM-DD',
  maxSize: 10 * 1024 * 1024, // Max 10 MB per file
  maxFiles: '20', // Keep up to 20 log files
  extension: '.log',
  /* because filename is dynamic, we need to set auditFile to a static file
   *  otherwise, winston will create a new audit file every time the app is run
   *  and will fail to clean up old log files as it looses track of them.
   */
  auditFile: path.join(logDirectory, `log-audit-file.json`),
});

transport.on('error', (error) => {
  // Should we exit the app here? Not sure
  // eslint-disable-next-line no-console
  console.error('Error in winston transport daily rotate file', error);
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(), // allow string interpolation like: logger.info('Hello, %s', 'world')
    winston.format.json(),
  ),
  transports: [transport],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

export default logger;
