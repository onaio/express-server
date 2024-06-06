"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPRESS_OPENSRP_SERVER_URL = exports.EXPRESS_OPENSRP_SCOPES = exports.EXPRESS_RESPONSE_HEADERS = exports.EXPRESS_REDIS_SENTINEL_CONFIG = exports.EXPRESS_REDIS_STAND_ALONE_URL = exports.EXPRESS_CONTENT_SECURITY_POLICY_CONFIG = exports.EXPRESS_COMBINED_LOGS_FILE_PATH = exports.EXPRESS_LOGS_FILE_PATH = exports.EXPRESS_MAXIMUM_LOG_FILES_NUMBER = exports.EXPRESS_MAXIMUM_LOGS_FILE_SIZE = exports.EXPRESS_KEYCLOAK_LOGOUT_URL = exports.EXPRESS_OPENSRP_LOGOUT_URL = exports.EXPRESS_SERVER_LOGOUT_URL = exports.EXPRESS_MAXIMUM_SESSION_LIFE_TIME = exports.EXPRESS_ALLOW_TOKEN_RENEWAL = exports.EXPRESS_FRONTEND_LOGIN_URL = exports.EXPRESS_REACT_BUILD_PATH = exports.EXPRESS_SESSION_PATH = exports.EXPRESS_SESSION_SECRET = exports.EXPRESS_SESSION_NAME = exports.EXPRESS_PORT = exports.EXPRESS_OPENSRP_CLIENT_SECRET = exports.EXPRESS_OPENSRP_CLIENT_ID = exports.EXPRESS_OPENSRP_OAUTH_STATE = exports.EXPRESS_FRONTEND_OPENSRP_CALLBACK_URL = exports.EXPRESS_SESSION_LOGIN_URL = exports.EXPRESS_PRELOADED_STATE_FILE = exports.EXPRESS_SESSION_FILESTORE_PATH = exports.EXPRESS_OPENSRP_CALLBACK_URL = exports.EXPRESS_OPENSRP_AUTHORIZATION_URL = exports.EXPRESS_OPENSRP_ACCESS_TOKEN_URL = void 0;
/* eslint-disable @typescript-eslint/no-redeclare */
/* eslint-disable @typescript-eslint/naming-convention */
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// initialize configuration
dotenv_1.default.config();
// TODO - Generify the codebase issue #3.
/** code naming and definitions suggest that the express server can
 * only be used for an openSRP backend app. This is not actually true
 * since the express backend is meant to be generic and api-agnostic
 */
exports.EXPRESS_OPENSRP_ACCESS_TOKEN_URL = process.env.EXPRESS_OPENSRP_ACCESS_TOKEN_URL || 'https://opensrp-stage.smartregister.org/opensrp/oauth/token';
exports.EXPRESS_OPENSRP_AUTHORIZATION_URL = process.env.EXPRESS_OPENSRP_AUTHORIZATION_URL || 'https://opensrp-stage.smartregister.org/opensrp/oauth/authorize';
exports.EXPRESS_OPENSRP_CALLBACK_URL = process.env.EXPRESS_OPENSRP_CALLBACK_URL || 'http://localhost:3000/oauth/callback/OpenSRP/';
exports.EXPRESS_SESSION_FILESTORE_PATH = process.env.EXPRESS_SESSION_FILESTORE_PATH || '/tmp/express-sessions';
exports.EXPRESS_PRELOADED_STATE_FILE = process.env.EXPRESS_PRELOADED_STATE_FILE || '/tmp/expressState.json';
exports.EXPRESS_SESSION_LOGIN_URL = process.env.EXPRESS_SESSION_LOGIN_URL || '/login';
exports.EXPRESS_FRONTEND_OPENSRP_CALLBACK_URL = process.env.EXPRESS_FRONTEND_OPENSRP_CALLBACK_URL || '/fe/oauth/callback/opensrp';
exports.EXPRESS_OPENSRP_OAUTH_STATE = process.env.EXPRESS_OPENSRP_OAUTH_STATE || 'opensrp';
exports.EXPRESS_OPENSRP_CLIENT_ID = process.env.EXPRESS_OPENSRP_CLIENT_ID;
exports.EXPRESS_OPENSRP_CLIENT_SECRET = process.env.EXPRESS_OPENSRP_CLIENT_SECRET;
exports.EXPRESS_PORT = parseInt(process.env.EXPRESS_PORT || '3000', 10);
exports.EXPRESS_SESSION_NAME = process.env.EXPRESS_SESSION_NAME || 'express-session';
exports.EXPRESS_SESSION_SECRET = process.env.EXPRESS_SESSION_SECRET || 'hunter2';
exports.EXPRESS_SESSION_PATH = process.env.EXPRESS_SESSION_PATH || '/';
exports.EXPRESS_REACT_BUILD_PATH = process.env.EXPRESS_REACT_BUILD_PATH || path_1.default.resolve(path_1.default.resolve(), '../build');
exports.EXPRESS_FRONTEND_LOGIN_URL = process.env.EXPRESS_FRONTEND_LOGIN_URL || '/fe/login';
exports.EXPRESS_ALLOW_TOKEN_RENEWAL = process.env.EXPRESS_ALLOW_TOKEN_RENEWAL === 'true';
exports.EXPRESS_MAXIMUM_SESSION_LIFE_TIME = Number(process.env.EXPRESS_MAXIMUM_SESSION_LIFE_TIME || 3 * 60 * 60); // 3hrs default
exports.EXPRESS_SERVER_LOGOUT_URL = process.env.EXPRESS_SERVER_LOGOUT_URL || 'http://localhost:3000/logout';
exports.EXPRESS_OPENSRP_LOGOUT_URL = process.env.EXPRESS_OPENSRP_LOGOUT_URL;
exports.EXPRESS_KEYCLOAK_LOGOUT_URL = process.env.EXPRESS_KEYCLOAK_LOGOUT_URL ||
    'https://keycloak-stage.smartregister.org/auth/realms/opensrp-web-stage/protocol/openid-connect/logout';
exports.EXPRESS_MAXIMUM_LOGS_FILE_SIZE = Number(process.env.EXPRESS_MAXIMUM_LOGS_FILE_SIZE || 5242880); // 5MB
exports.EXPRESS_MAXIMUM_LOG_FILES_NUMBER = Number(process.env.EXPRESS_MAXIMUM_LOG_FILES_NUMBER || 5);
exports.EXPRESS_LOGS_FILE_PATH = process.env.EXPRESS_LOGS_FILE_PATH || './logs/default-error.log';
exports.EXPRESS_COMBINED_LOGS_FILE_PATH = process.env.EXPRESS_COMBINED_LOGS_FILE_PATH || './logs/default-error-and-info.log';
exports.EXPRESS_CONTENT_SECURITY_POLICY_CONFIG = process.env.EXPRESS_CONTENT_SECURITY_POLICY_CONFIG;
// see https://github.com/luin/ioredis#connect-to-redis
exports.EXPRESS_REDIS_STAND_ALONE_URL = process.env.EXPRESS_REDIS_STAND_ALONE_URL;
// see https://github.com/luin/ioredis#sentinel
exports.EXPRESS_REDIS_SENTINEL_CONFIG = JSON.parse(process.env.EXPRESS_REDIS_SENTINEL_CONFIG || '{}');
exports.EXPRESS_RESPONSE_HEADERS = JSON.parse(process.env.EXPRESS_RESPONSE_HEADERS || '{}');
exports.EXPRESS_OPENSRP_SCOPES = (process.env.EXPRESS_OPENSRP_SCOPES || 'openid,profile').split(',');
exports.EXPRESS_OPENSRP_SERVER_URL = process.env.EXPRESS_OPENSRP_SERVER_URL;
//# sourceMappingURL=envs.js.map