import * as winston from 'winston';
import {
  EXPRESS_MAXIMUM_LOGS_FILE_SIZE,
  EXPRESS_MAXIMUM_LOG_FILES_NUMBER,
  EXPRESS_LOGS_FILE_PATH,
  EXPRESS_COMBINED_LOGS_FILE_PATH,
} from './envs';

// new Winston Logger with two channels (file and console)
const winstonLogger = winston.createLogger({
  transports: [
    // output only errors (level 0) to default error logs file
    new winston.transports.File({
      level: 'error',
      filename: EXPRESS_LOGS_FILE_PATH,
      maxsize: EXPRESS_MAXIMUM_LOGS_FILE_SIZE,
      maxFiles: EXPRESS_MAXIMUM_LOG_FILES_NUMBER,
    }),
    // output errors, warnings, and info (level 2) to a combined error log file and to console (piped to pm2)
    new winston.transports.File({
      filename: EXPRESS_COMBINED_LOGS_FILE_PATH,
      level: 'info',
      maxsize: EXPRESS_MAXIMUM_LOGS_FILE_SIZE,
      maxFiles: EXPRESS_MAXIMUM_LOG_FILES_NUMBER,
    }),
    new winston.transports.Console({
      level: 'info',
    }),
  ],
  // handle Uncaught Exceptions
  handleExceptions: true,
  // do not exit on handled exceptions
  exitOnError: false,
  // custom log format
  format: winston.format.combine(
    // 🔥: error: Nov-18-2021 08:10:44: memory buffer overflow!
    winston.format.label({
      label: '🔥',
    }),
    winston.format.timestamp({
      format: 'MMM-DD-YYYY HH:mm:ss',
    }),
    winston.format.printf((info) => `${info.label}: ${info.level}: ${[info.timestamp]}: ${info.message}`),
  ),
});

// create a stream object with a 'write' function that will be used by `morgan`
const winstonStream = {
  write: (message: string) => winstonLogger.info(message),
};

export { winstonLogger, winstonStream };
