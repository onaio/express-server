/** write authentication configs for the importer script */
import {EXPRESS_OPENSRP_CLIENT_SECRET, EXPRESS_OPENSRP_CLIENT_ID, EXPRESS_OPENSRP_ACCESS_TOKEN_URL, EXPRESS_OPENSRP_SERVER_URL} from '../../configs/envs'
import { URL } from 'url';
import { importerSourceFilePath } from './utils';
import fs from 'fs/promises'
import path from 'path';
import { parseKeycloakUrl } from '../helpers/utils';

export async function writeImporterScriptConfig(configContents: string){
    const configFilePath = path.resolve(importerSourceFilePath, "config/config.py")
    await fs.writeFile(configFilePath, configContents);
}

export function generateImporterSCriptConfig(accessToken?: string, refreshToken?: string){
    const {realm, keycloakBaseUrl} = parseKeycloakUrl(EXPRESS_OPENSRP_ACCESS_TOKEN_URL)
    let outputString = ""
    if(EXPRESS_OPENSRP_CLIENT_ID){
        outputString += `client_id = "${EXPRESS_OPENSRP_CLIENT_ID }"\n`
    }
    if(EXPRESS_OPENSRP_CLIENT_SECRET) outputString += `client_secret = "${EXPRESS_OPENSRP_CLIENT_SECRET }"\n`
    if(realm) outputString += `realm = "${realm}"\n`
    if(accessToken) outputString += `access_token = "${accessToken }"\n`
    if(refreshToken) outputString += `refresh_token = "${refreshToken }"\n`
    if(keycloakBaseUrl) outputString += `keycloak_url = "${keycloakBaseUrl}"\n`
    if(EXPRESS_OPENSRP_SERVER_URL) outputString += `fhir_base_url = "${EXPRESS_OPENSRP_SERVER_URL}"\n`
    return outputString
}
