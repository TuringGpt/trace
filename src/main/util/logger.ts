import { app } from 'electron/main';
import fs from 'fs';
import path from 'path';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const userDataPath = app.getPath('userData');
const logDirectory = path.join(userDataPath, 'logs');

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// get this only once per run, so that the log file name is unique per run
const getHourAndMin = (() => {
  const date = new Date();
  const min = date.getMinutes();
  const hour = date.getHours();
  return `${hour}-${min}`;
})();

const transport = new DailyRotateFile({
  filename: path.join(logDirectory, `trace_%DATE%-${getHourAndMin}`),
  datePattern: 'YYYY-MM-DD',
  maxSize: 10 * 1024 * 1024, // Max 10 MB per file
  maxFiles: '20', // Keep up to 20 log files
  extension: '.log',
});

transport.on('error', (error) => {
  // Should we exit the app here? Not sure
  // eslint-disable-next-line no-console
  console.error('Error in winston transport daily rotate file', error);
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(), // allow string interpolation like: logger.info('Hello, %s', 'world')
    winston.format.simple(),
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
