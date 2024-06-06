"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.winstonStream = exports.winstonLogger = void 0;
const winston = __importStar(require("winston"));
const envs_1 = require("./envs");
// new Winston Logger with two channels (file and console)
const winstonLogger = winston.createLogger({
    transports: [
        // output only errors (level 0) to default error logs file
        new winston.transports.File({
            level: 'error',
            filename: envs_1.EXPRESS_LOGS_FILE_PATH,
            maxsize: envs_1.EXPRESS_MAXIMUM_LOGS_FILE_SIZE,
            maxFiles: envs_1.EXPRESS_MAXIMUM_LOG_FILES_NUMBER,
        }),
        // output errors, warnings, and info (level 2) to a combined error log file and to console (piped to pm2)
        new winston.transports.File({
            filename: envs_1.EXPRESS_COMBINED_LOGS_FILE_PATH,
            level: 'info',
            maxsize: envs_1.EXPRESS_MAXIMUM_LOGS_FILE_SIZE,
            maxFiles: envs_1.EXPRESS_MAXIMUM_LOG_FILES_NUMBER,
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
    }), winston.format.timestamp({
        format: 'MMM-DD-YYYY HH:mm:ss',
    }), winston.format.printf((info) => `${info.label}: ${info.level}: ${[info.timestamp]}: ${info.message}`)),
});
exports.winstonLogger = winstonLogger;
// create a stream object with a 'write' function that will be used by `morgan`
const winstonStream = {
    write: (message) => winstonLogger.info(message),
};
exports.winstonStream = winstonStream;
//# sourceMappingURL=winston.js.map