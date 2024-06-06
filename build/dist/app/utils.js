"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionLogout = exports.parseOauthClientData = void 0;
const gatekeeper_1 = require("@onaio/gatekeeper");
const envs_1 = require("../configs/envs");
const sessionName = envs_1.EXPRESS_SESSION_NAME;
/** gets JWT access-token, decodes it and transforms it into session state object */
const parseOauthClientData = (oauthClient) => {
    const rawUserInfo = {
        oAuth2Data: oauthClient.data,
    };
    return (0, gatekeeper_1.getOpenSRPUserInfo)(rawUserInfo);
};
exports.parseOauthClientData = parseOauthClientData;
/** kill session */
const sessionLogout = (req, res) => {
    req.session.destroy(() => undefined);
    res.clearCookie(sessionName);
};
exports.sessionLogout = sessionLogout;
//# sourceMappingURL=utils.js.map