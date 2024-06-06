import path from 'path';
import {Job as BullJob} from 'bull'
import { stdout } from 'process';

export const importerSourceFilePath = path.resolve(__dirname, "../../../fhir-tooling")
export const templatesFolder = path.resolve(importerSourceFilePath, "csv");

export enum UploadWorkflowTypes{
    Locations = "locations",
    Organizations = "organizations",
    Inventory = "Inventory",
    Product = "products",
    // productImage = "productImages",
    Users = "users",
    Careteams = "careteams",
    orgToLocationAssignment = "orgToLocationAssignment",
    userToOrganizationAssignment = "userToOrganizationAssignment",
}

// TODO - fix this paths. also be defensive if things change underneath.
export const resourceUploadCodeToTemplatePathLookup = {
    [UploadWorkflowTypes.Users]: path.resolve(templatesFolder, "users.csv"),
    [UploadWorkflowTypes.Organizations]: path.resolve(templatesFolder, "organizations/organizations_full.csv"),
    [UploadWorkflowTypes.Locations]: path.resolve(templatesFolder,"locations/locations_full.csv"),
    [UploadWorkflowTypes.Careteams]: path.resolve(templatesFolder, "careteams/careteam_full.csv"),
    [UploadWorkflowTypes.Product]: path.resolve(templatesFolder, "import/product.csv"),
    [UploadWorkflowTypes.Inventory]: path.resolve(templatesFolder, "import/inventory.csv"),
    [UploadWorkflowTypes.orgToLocationAssignment]: path.resolve(templatesFolder, "organizations/organizations_locations.csv"),
    [UploadWorkflowTypes.userToOrganizationAssignment]: path.resolve(templatesFolder, "practitioners/users_organizations.csv"),
    // [UploadWorkflowTypes.productImage]: path.resolve(templatesFolder, "organizations/organizations_locations.csv"),
}

// 
/** function given a resource upload code returns the template name */
export function getTemplateFilePath(resourceUploadCode: UploadWorkflowTypes){
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


export async function parseJobResponse(job: BullJob){
    const status = await job.getState();
    const jobData  =job.data
    const {workflowType, filePath, author} = jobData
    const filename = filePath ? path.posix.basename(filePath): ""

    let statusReason;
    if(status === "failed"){
        try{
            statusReason = JSON.parse(job.failedReason ?? "{}")
        }catch{
            statusReason = {stdErr: job.failedReason, stdout: ""}
        }
    }
    if(status === "completed"){
        statusReason = job.returnvalue
    }
    return {
        workflowId: job.id,
        status,
        workflowType,
        dateCreated: job.timestamp,
        dateStarted: job.processedOn,
        dateEnded: job.finishedOn,
        statusReason,
        filename,
        author,
    }
}

type DependencyGraph = {
    [key in UploadWorkflowTypes]?: UploadWorkflowTypes[];
};

export const dependencyGraph: DependencyGraph = {
    [UploadWorkflowTypes.orgToLocationAssignment]: [UploadWorkflowTypes.Organizations, UploadWorkflowTypes.Locations],
    [UploadWorkflowTypes.userToOrganizationAssignment]: [UploadWorkflowTypes.Users, UploadWorkflowTypes.Organizations],
    [UploadWorkflowTypes.Inventory]: [UploadWorkflowTypes.Product],

}