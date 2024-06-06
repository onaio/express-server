"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPRESS_OPENSRP_SCOPES = exports.EXPRESS_RESPONSE_HEADERS = exports.EXPRESS_CONTENT_SECURITY_POLICY_CONFIG = exports.EXPRESS_COMBINED_LOGS_FILE_PATH = exports.EXPRESS_LOGS_FILE_PATH = exports.EXPRESS_MAXIMUM_LOG_FILES_NUMBER = exports.EXPRESS_MAXIMUM_LOGS_FILE_SIZE = exports.EXPRESS_KEYCLOAK_LOGOUT_URL = exports.EXPRESS_OPENSRP_LOGOUT_URL = exports.EXPRESS_SERVER_LOGOUT_URL = exports.EXPRESS_MAXIMUM_SESSION_LIFE_TIME = exports.EXPRESS_ALLOW_TOKEN_RENEWAL = exports.EXPRESS_FRONTEND_LOGIN_URL = exports.EXPRESS_FRONTEND_OPENSRP_CALLBACK_URL = exports.EXPRESS_REACT_BUILD_PATH = exports.EXPRESS_SESSION_PATH = exports.EXPRESS_SESSION_SECRET = exports.EXPRESS_SESSION_NAME = exports.EXPRESS_PORT = exports.EXPRESS_OPENSRP_CLIENT_SECRET = exports.EXPRESS_OPENSRP_CLIENT_ID = exports.EXPRESS_OPENSRP_OAUTH_STATE = exports.FRONTEND_OPENSRP_CALLBACK_URL = exports.EXPRESS_SESSION_LOGIN_URL = exports.EXPRESS_PRELOADED_STATE_FILE = exports.EXPRESS_SESSION_FILESTORE_PATH = exports.EXPRESS_OPENSRP_USER_URL = exports.EXPRESS_OPENSRP_CALLBACK_URL = exports.EXPRESS_OPENSRP_AUTHORIZATION_URL = exports.EXPRESS_OPENSRP_ACCESS_TOKEN_URL = void 0;
/* eslint-disable @typescript-eslint/no-redeclare */
/* eslint-disable @typescript-eslint/naming-convention */
const path_1 = require("path");
exports.EXPRESS_OPENSRP_ACCESS_TOKEN_URL = 'http://reveal-stage.smartregister.org/opensrp/oauth/token';
exports.EXPRESS_OPENSRP_AUTHORIZATION_URL = 'http://reveal-stage.smartregister.org/opensrp/oauth/authorize';
exports.EXPRESS_OPENSRP_CALLBACK_URL = 'http://localhost:3000/oauth/callback/OpenSRP/';
exports.EXPRESS_OPENSRP_USER_URL = 'http://reveal-stage.smartregister.org/opensrp/user-details';
exports.EXPRESS_SESSION_FILESTORE_PATH = '/tmp/express-sessions';
exports.EXPRESS_PRELOADED_STATE_FILE = '/tmp/revealState.json';
exports.EXPRESS_SESSION_LOGIN_URL = '/login';
exports.FRONTEND_OPENSRP_CALLBACK_URL = '/fe/oauth/callback/opensrp';
exports.EXPRESS_OPENSRP_OAUTH_STATE = 'opensrp';
exports.EXPRESS_OPENSRP_CLIENT_ID = process.env.EXPRESS_OPENSRP_CLIENT_ID;
exports.EXPRESS_OPENSRP_CLIENT_SECRET = process.env.EXPRESS_OPENSRP_CLIENT_SECRET;
exports.EXPRESS_PORT = 3000;
exports.EXPRESS_SESSION_NAME = 'reveal-session';
exports.EXPRESS_SESSION_SECRET = 'hunter2';
exports.EXPRESS_SESSION_PATH = '/';
exports.EXPRESS_REACT_BUILD_PATH = (0, path_1.join)(__dirname, 'build');
exports.EXPRESS_FRONTEND_OPENSRP_CALLBACK_URL = 'http://localhost:3000/oauth/callback/opensrp';
exports.EXPRESS_FRONTEND_LOGIN_URL = '/fe/login';
exports.EXPRESS_ALLOW_TOKEN_RENEWAL = true;
exports.EXPRESS_MAXIMUM_SESSION_LIFE_TIME = 3600;
exports.EXPRESS_SERVER_LOGOUT_URL = 'http://localhost:3000/logout';
exports.EXPRESS_OPENSRP_LOGOUT_URL = 'https://reveal-stage.smartregister.org/opensrp/logout.do';
exports.EXPRESS_KEYCLOAK_LOGOUT_URL = 'https://keycloak-stage.smartregister.org/auth/realms/reveal-stage/protocol/openid-connect/logout';
exports.EXPRESS_MAXIMUM_LOGS_FILE_SIZE = 5242880;
exports.EXPRESS_MAXIMUM_LOG_FILES_NUMBER = 5;
exports.EXPRESS_LOGS_FILE_PATH = './logs/default-error.log';
exports.EXPRESS_COMBINED_LOGS_FILE_PATH = './logs/default-error-and-info.log';
exports.EXPRESS_CONTENT_SECURITY_POLICY_CONFIG = `{"default-src":["'self'"],"reportUri":"https://example.com"}`;
exports.EXPRESS_RESPONSE_HEADERS = {
    'Report-To': '{ "group": "csp-endpoint", "max_age": 10886400, "endpoints": [{ "url": "https://example.com/csp-reports" }] }, { "group": "hpkp-endpoint", "max_age": 10886400, "endpoints": [{ "url": "https://example.com/hpkp-reports" }] }',
};
exports.EXPRESS_OPENSRP_SCOPES = ['openid', 'profile'];
//# sourceMappingURL=envs.js.map