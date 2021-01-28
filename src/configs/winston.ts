import * as winston from 'winston';
import os from 'os';

const homedir = os.homedir();
const logsPath = `${homedir}/.express/logs/reveal-express-server.log`

// define the custom settings for each transport (file, console)
const options = {
  file: {
    level: 'info',
    filename: logsPath,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

// instantiate a new Winston Logger with the settings defined above
const logger = winston.createLogger({
  transports: [
    new winston.transports.File(options.file), // output to logs file
    // new winston.transports.File(options.console), // output log to console
  ],
  exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
const winstonStream = {
  write: function(message: string) {
    logger.info(message);
  },
};

export {logger as winstonLogger, winstonStream}
