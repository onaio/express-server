/* eslint-disable @typescript-eslint/no-redeclare */
/* eslint-disable @typescript-eslint/naming-convention */
import dotenv from 'dotenv';
import path from 'path';

// initialize configuration
dotenv.config();

// TODO - Generify the codebase issue #3.
/** code naming and definitions suggest that the express server can
 * only be used for an openSRP backend app. This is not actually true
 * since the express backend is meant to be generic and api-agnostic
 */
export const EXPRESS_OPENSRP_ACCESS_TOKEN_URL =
  process.env.EXPRESS_OPENSRP_ACCESS_TOKEN_URL || 'https://opensrp-stage.smartregister.org/opensrp/oauth/token';

export const EXPRESS_OPENSRP_AUTHORIZATION_URL =
  process.env.EXPRESS_OPENSRP_AUTHORIZATION_URL || 'https://opensrp-stage.smartregister.org/opensrp/oauth/authorize';

export const EXPRESS_OPENSRP_CALLBACK_URL =
  process.env.EXPRESS_OPENSRP_CALLBACK_URL || 'http://localhost:3000/oauth/callback/OpenSRP/';

export const EXPRESS_SESSION_FILESTORE_PATH = process.env.EXPRESS_SESSION_FILESTORE_PATH || '/tmp/express-sessions';

export const EXPRESS_PRELOADED_STATE_FILE = process.env.EXPRESS_PRELOADED_STATE_FILE || '/tmp/expressState.json';

export const EXPRESS_SESSION_LOGIN_URL = process.env.EXPRESS_SESSION_LOGIN_URL || '/login';

export const EXPRESS_FRONTEND_OPENSRP_CALLBACK_URL =
  process.env.EXPRESS_FRONTEND_OPENSRP_CALLBACK_URL || '/fe/oauth/callback/opensrp';

export const EXPRESS_OPENSRP_OAUTH_STATE = process.env.EXPRESS_OPENSRP_OAUTH_STATE || 'opensrp';

export const { EXPRESS_OPENSRP_CLIENT_ID } = process.env;

export const { EXPRESS_OPENSRP_CLIENT_SECRET } = process.env;

export const EXPRESS_PORT = parseInt(process.env.EXPRESS_PORT || '3000', 10);

export const EXPRESS_SESSION_NAME = process.env.EXPRESS_SESSION_NAME || 'express-session';

export const EXPRESS_SESSION_SECRET = process.env.EXPRESS_SESSION_SECRET || 'hunter2';

export const EXPRESS_SESSION_PATH = process.env.EXPRESS_SESSION_PATH || '/';

export const EXPRESS_REACT_BUILD_PATH =
  process.env.EXPRESS_REACT_BUILD_PATH || path.resolve(path.resolve(), '../build');

export const EXPRESS_FRONTEND_LOGIN_URL = process.env.EXPRESS_FRONTEND_LOGIN_URL || '/fe/login';

export const EXPRESS_ALLOW_TOKEN_RENEWAL = process.env.EXPRESS_ALLOW_TOKEN_RENEWAL === 'true';

export const EXPRESS_MAXIMUM_SESSION_LIFE_TIME = Number(process.env.EXPRESS_MAXIMUM_SESSION_LIFE_TIME || 3 * 60 * 60); // 3hrs default

export const EXPRESS_SERVER_LOGOUT_URL = process.env.EXPRESS_SERVER_LOGOUT_URL || 'http://localhost:3000/logout';

export const { EXPRESS_OPENSRP_LOGOUT_URL } = process.env;

export const EXPRESS_KEYCLOAK_LOGOUT_URL =
  process.env.EXPRESS_KEYCLOAK_LOGOUT_URL ||
  'https://keycloak-stage.smartregister.org/auth/realms/opensrp-web-stage/protocol/openid-connect/logout';

export const EXPRESS_MAXIMUM_LOGS_FILE_SIZE = Number(process.env.EXPRESS_MAXIMUM_LOGS_FILE_SIZE || 5242880); // 5MB

export const EXPRESS_MAXIMUM_LOG_FILES_NUMBER = Number(process.env.EXPRESS_MAXIMUM_LOG_FILES_NUMBER || 5);

export const EXPRESS_LOGS_FILE_PATH = process.env.EXPRESS_LOGS_FILE_PATH || './logs/default-error.log';

export const EXPRESS_COMBINED_LOGS_FILE_PATH =
  process.env.EXPRESS_COMBINED_LOGS_FILE_PATH || './logs/default-error-and-info.log';

export const { EXPRESS_CONTENT_SECURITY_POLICY_CONFIG } = process.env;

// see https://github.com/luin/ioredis#connect-to-redis
export const { EXPRESS_REDIS_STAND_ALONE_URL } = process.env;

// see https://github.com/luin/ioredis#sentinel
export const EXPRESS_REDIS_SENTINEL_CONFIG = JSON.parse(process.env.EXPRESS_REDIS_SENTINEL_CONFIG || '{}');

export const EXPRESS_RESPONSE_HEADERS = JSON.parse(process.env.EXPRESS_RESPONSE_HEADERS || '{}');

export const EXPRESS_OPENSRP_SCOPES = (process.env.EXPRESS_OPENSRP_SCOPES || 'openid,profile').split(',');

export const { EXPRESS_OPENSRP_SERVER_URL } = process.env;

export const EXPRESS_TEMP_CSV_FILE_STORAGE = process.env.EXPRESS_TEMP_CSV_FILE_STORAGE || '/tmp/csvUploads';

export const EXPRESS_PYTHON_INTERPRETER_PATH = process.env.EXPRESS_PYTHON_INTERPRETER_PATH || 'python3';
