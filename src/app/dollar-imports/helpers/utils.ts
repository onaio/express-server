import path from 'path';
import { Job as BullJob } from 'bull';

export const importerSourceFilePath = path.resolve(__dirname, '../../../../importer');
export const templatesFolder = path.resolve(importerSourceFilePath, 'csv');
export const StrPartsSep = '-';

export enum UploadWorkflowTypes {
  Locations = 'locations',
  Organizations = 'organizations',
  Inventories = 'inventories',
  Products = 'products',
  Users = 'users',
  CareTeams = 'careTeams',
  orgToLocationAssignment = 'orgToLocationAssignment',
  userToOrganizationAssignment = 'userToOrganizationAssignment',
}

export interface JobData {
  workflowType: UploadWorkflowTypes;
  filePath: string;
  workflowId: string;
  author: string;
  accessToken: string;
  refreshToken: string;
  productListId?: string;
  inventoryListId?: string;
}

export const resourceUploadCodeToTemplatePathLookup = {
  [UploadWorkflowTypes.Users]: path.resolve(templatesFolder, 'users.csv'),
  [UploadWorkflowTypes.Organizations]: path.resolve(templatesFolder, 'organizations/organizations_full.csv'),
  [UploadWorkflowTypes.Locations]: path.resolve(templatesFolder, 'locations/locations_full.csv'),
  [UploadWorkflowTypes.CareTeams]: path.resolve(templatesFolder, 'careteams/careteam_full.csv'),
  [UploadWorkflowTypes.Products]: path.resolve(templatesFolder, 'import/product.csv'),
  [UploadWorkflowTypes.Inventories]: path.resolve(templatesFolder, 'import/inventory.csv'),
  [UploadWorkflowTypes.orgToLocationAssignment]: path.resolve(
    templatesFolder,
    'organizations/organizations_locations.csv',
  ),
  [UploadWorkflowTypes.userToOrganizationAssignment]: path.resolve(
    templatesFolder,
    'practitioners/users_organizations.csv',
  ),
};

/** function given a resource upload code returns the template name */
export function getTemplateFilePath(resourceUploadCode: UploadWorkflowTypes) {
  return resourceUploadCodeToTemplatePathLookup[resourceUploadCode] as string | undefined;
}

export function getAllTemplateFilePaths() {
  return Object.values(resourceUploadCodeToTemplatePathLookup);
}

/* Checks if a variable is of type string.
 * @param value - The variable to check.
 * @returns True if the variable is a string, false otherwise.
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string' || value instanceof String;
}

export async function parseJobResponse(job: BullJob) {
  const status = await job.getState();
  const jobData = job.data;
  const { workflowType, filePath, author } = jobData;
  const internalFilename = filePath ? path.posix.basename(filePath) : '';
  const splitFileName = internalFilename.split(StrPartsSep);
  const normalizedFilename = splitFileName[splitFileName.length - 1];

  let statusReason;
  if (status === 'failed') {
    try {
      statusReason = JSON.parse(job.failedReason ?? '{}');
    } catch {
      statusReason = { stderr: job.failedReason, stdout: '' };
    }
  }
  if (status === 'completed') {
    statusReason = job.returnvalue;
  }
  return {
    workflowId: job.id,
    status,
    workflowType,
    dateCreated: job.timestamp,
    dateStarted: job.processedOn,
    dateEnded: job.finishedOn,
    statusReason,
    filename: normalizedFilename,
    internalFilename,
    author,
  };
}

type DependencyGraph = {
  [key in UploadWorkflowTypes]?: UploadWorkflowTypes[];
};

export const dependencyGraph: DependencyGraph = {
  [UploadWorkflowTypes.orgToLocationAssignment]: [UploadWorkflowTypes.Organizations, UploadWorkflowTypes.Locations],
  [UploadWorkflowTypes.userToOrganizationAssignment]: [UploadWorkflowTypes.Users, UploadWorkflowTypes.Organizations],
  [UploadWorkflowTypes.Inventories]: [UploadWorkflowTypes.Products],
};

/** validates workflow arguments
 *
 * @param args - args for initiating a bull job.
 */
export function validateWorkflowArgs(args: JobData[]) {
  for (const arg of args) {
    if (arg.workflowType === UploadWorkflowTypes.Products && !arg.productListId) {
      throw new Error('Product list id for the product upload workflow was not provided');
    }
    if (arg.workflowType === UploadWorkflowTypes.Inventories && !arg.inventoryListId) {
      throw new Error('inventory list id for the inventory upload workflow was not provided');
    }
  }
}
