/* eslint-disable @typescript-eslint/no-explicit-any */

import path from 'path';
import { getImportScriptArgs } from '../helpers/job';
import { UploadWorkflowTypes } from '../helpers/utils';

const sampleCsv = `${path.resolve(__dirname, 'fixtures/sample.csv')}`;

test('generates correct script args for the different workflows', () => {
  const common = ['--log_level', 'info'];
  const commonWorkflowArgs = {
    workflowType: UploadWorkflowTypes.Locations,
    filePath: sampleCsv,
    productListId: 'productId',
    inventoryListId: 'inventoryId',
    workflowId: 'id',
    author: 'JK Rowling',
    accessToken: 'at',
    refreshToken: 'rt',
  };
  let result = getImportScriptArgs(commonWorkflowArgs);
  expect(result).toEqual([
    '--csv_file',
    `"${sampleCsv}"`,
    '--resource_type',
    'locations',
    '--location_type_coding_system',
    'http://smartregister.org/CodeSystem/eusm-service-point-type',
    ...common,
  ]);
  result = getImportScriptArgs({ ...commonWorkflowArgs, workflowType: UploadWorkflowTypes.Users });
  expect(result).toEqual(['--csv_file', `"${sampleCsv}"`, '--resource_type', 'users', ...common]);
  result = getImportScriptArgs({ ...commonWorkflowArgs, workflowType: UploadWorkflowTypes.CareTeams });
  expect(result).toEqual(['--csv_file', `"${sampleCsv}"`, '--resource_type', 'careTeams', '--log_level', 'info']);
  result = getImportScriptArgs({ ...commonWorkflowArgs, workflowType: UploadWorkflowTypes.orgToLocationAssignment });
  expect(result).toEqual([
    '--csv_file',
    `"${sampleCsv}"`,
    '--assign',
    'organizations-Locations',
    '--log_level',
    'info',
  ]);
  result = getImportScriptArgs({
    ...commonWorkflowArgs,
    workflowType: UploadWorkflowTypes.userToOrganizationAssignment,
  });
  expect(result).toEqual(['--csv_file', `"${sampleCsv}"`, '--assign', 'users-organizations', '--log_level', 'info']);
  result = getImportScriptArgs({ ...commonWorkflowArgs, workflowType: UploadWorkflowTypes.Organizations });
  expect(result).toEqual(['--csv_file', `"${sampleCsv}"`, '--resource_type', 'organizations', '--log_level', 'info']);
  result = getImportScriptArgs({ ...commonWorkflowArgs, workflowType: UploadWorkflowTypes.Products });
  expect(result).toEqual([
    '--csv_file',
    `"${sampleCsv}"`,
    '--setup',
    'products',
    '--list_resource_id',
    'productId',
    '--log_level',
    'info',
  ]);
  result = getImportScriptArgs({ ...commonWorkflowArgs, workflowType: UploadWorkflowTypes.Inventories });
  expect(result).toEqual([
    '--csv_file',
    `"${sampleCsv}"`,
    '--setup',
    'inventories',
    '--list_resource_id',
    'inventoryId',
    '--log_level',
    'info',
  ]);
});
