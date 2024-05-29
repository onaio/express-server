import path from 'path';

const templatesFolder = path.resolve(__dirname, "../../../fhir-tooling/csv");

export enum ResourceUploadCode {
    USERS="users",
    ORGANIZATIONS="organizations",
    LOCATIONS="locations",
    CARETEAMS="careteams",
    CARETEAM_ORGANIZATION="careteams-organizations",
    USERS_CARETEAMS="user-careteams",
    ORGANIZATIONS_LOCATIONS="organizations-locations"
}

export const resourceUploadCodeToTemplatePathLookup = {
    [ResourceUploadCode.USERS]: path.resolve(templatesFolder, "users.csv"),
    [ResourceUploadCode.ORGANIZATIONS]: path.resolve(templatesFolder, "organizations/organizations_full.csv"),
    [ResourceUploadCode.LOCATIONS]: path.resolve(templatesFolder,"locations/locations_full.csv"),
    [ResourceUploadCode.CARETEAMS]: path.resolve(templatesFolder, "careteams/careteam_full.csv"),
    [ResourceUploadCode.CARETEAM_ORGANIZATION]: path.resolve(templatesFolder, "careteams/careteam_organizations.csv"),
    [ResourceUploadCode.USERS_CARETEAMS]: path.resolve(templatesFolder, "careteams/users_careteam.csv"),
    [ResourceUploadCode.ORGANIZATIONS_LOCATIONS]: path.resolve(templatesFolder, "organizations/organization_locations.csv"),
}

/** function given a resource upload code returns the template name */
export function getTemplateFilePath(resourceUploadCode: ResourceUploadCode){
  return resourceUploadCodeToTemplatePathLookup[resourceUploadCode]
}

export function getAllTemplateFilePaths(){
    return Object.values(resourceUploadCodeToTemplatePathLookup)
}

/* Checks if a variable is of type string.
* @param value - The variable to check.
* @returns True if the variable is a string, false otherwise.
*/
export function isString(value: any): value is string {
 return typeof value === 'string' || value instanceof String;
}