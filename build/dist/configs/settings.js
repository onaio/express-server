"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readCspOptionsConfig = void 0;
const envs_1 = require("./envs");
/** parse and return helmets' csp policy from an env string */
const readCspOptionsConfig = () => {
    /** leave default behavior in place as the default, to disable env, dev needs to pass false as the value */
    if (envs_1.EXPRESS_CONTENT_SECURITY_POLICY_CONFIG === undefined) {
        return {};
    }
    if (envs_1.EXPRESS_CONTENT_SECURITY_POLICY_CONFIG === 'false') {
        return false;
    }
    const cspConfig = JSON.parse(envs_1.EXPRESS_CONTENT_SECURITY_POLICY_CONFIG);
    const { useDefaults, reportOnly } = cspConfig, rest = __rest(cspConfig, ["useDefaults", "reportOnly"]);
    return { directives: rest, useDefaults, reportOnly };
};
exports.readCspOptionsConfig = readCspOptionsConfig;
//# sourceMappingURL=settings.js.map