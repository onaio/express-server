/** write authentication configs for the importer script */
import {EXPRESS_OPENSRP_CLIENT_SECRET, EXPRESS_OPENSRP_CLIENT_ID, EXPRESS_OPENSRP_ACCESS_TOKEN_URL, EXPRESS_OPENSRP_SERVER_URL} from '../../../configs/envs'
import { URL } from 'url';
import { importerSourceFilePath } from '../utils';
import fs from 'fs/promises'
import path from 'path';


// write the to the file on login or every time the access token changes.

export async function writeImporterScriptConfig(configContents: string){
    const configFilePath = path.resolve(importerSourceFilePath, "config.py")
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
    outputString += `username = "${"webmaster"}"\n`
    outputString += `password = "${"admin"}"\n`
    return outputString
}


function parseKeycloakUrl(keycloakUrl: string) {
  // Parse the URL
  const parsedUrl = new URL(keycloakUrl);
  const origin = parsedUrl.origin
  const keycloakBaseUrl = `${origin}/auth`

  // Split the path to get the segments
  const pathSegments = parsedUrl.pathname.split('/');

  // The realm is usually the second-to-last segment in the path
  const realmIndex = pathSegments.indexOf('realms') + 1;

  let realm

  // Check if we have a valid realm index
  if (realmIndex > 0 && realmIndex < pathSegments.length) {
    realm =  pathSegments[realmIndex];
  } 
  return {realm, keycloakBaseUrl}
}
