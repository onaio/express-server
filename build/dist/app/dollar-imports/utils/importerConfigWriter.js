"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateImporterSCriptConfig = exports.writeImporterScriptConfig = void 0;
/** write authentication configs for the importer script */
const envs_1 = require("../../../configs/envs");
const url_1 = require("url");
const utils_1 = require("../utils");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
// write the to the file on login or every time the access token changes.
function writeImporterScriptConfig(configContents) {
    return __awaiter(this, void 0, void 0, function* () {
        const configFilePath = path_1.default.resolve(utils_1.importerSourceFilePath, "config.py");
        yield promises_1.default.writeFile(configFilePath, configContents);
    });
}
exports.writeImporterScriptConfig = writeImporterScriptConfig;
function generateImporterSCriptConfig(accessToken, refreshToken) {
    const { realm, keycloakBaseUrl } = parseKeycloakUrl(envs_1.EXPRESS_OPENSRP_ACCESS_TOKEN_URL);
    let outputString = "";
    if (envs_1.EXPRESS_OPENSRP_CLIENT_ID) {
        outputString += `client_id = "${envs_1.EXPRESS_OPENSRP_CLIENT_ID}"\n`;
    }
    if (envs_1.EXPRESS_OPENSRP_CLIENT_SECRET)
        outputString += `client_secret = "${envs_1.EXPRESS_OPENSRP_CLIENT_SECRET}"\n`;
    if (realm)
        outputString += `realm = "${realm}"\n`;
    if (accessToken)
        outputString += `access_token = "${accessToken}"\n`;
    if (refreshToken)
        outputString += `refresh_token = "${refreshToken}"\n`;
    if (keycloakBaseUrl)
        outputString += `keycloak_url = "${keycloakBaseUrl}"\n`;
    if (envs_1.EXPRESS_OPENSRP_SERVER_URL)
        outputString += `fhir_base_url = "${envs_1.EXPRESS_OPENSRP_SERVER_URL}"\n`;
    return outputString;
}
exports.generateImporterSCriptConfig = generateImporterSCriptConfig;
function parseKeycloakUrl(keycloakUrl) {
    // Parse the URL
    const parsedUrl = new url_1.URL(keycloakUrl);
    const origin = parsedUrl.origin;
    const keycloakBaseUrl = `${origin}/auth`;
    // Split the path to get the segments
    const pathSegments = parsedUrl.pathname.split('/');
    // The realm is usually the second-to-last segment in the path
    const realmIndex = pathSegments.indexOf('realms') + 1;
    let realm;
    // Check if we have a valid realm index
    if (realmIndex > 0 && realmIndex < pathSegments.length) {
        realm = pathSegments[realmIndex];
    }
    return { realm, keycloakBaseUrl };
}
//# sourceMappingURL=importerConfigWriter.js.map