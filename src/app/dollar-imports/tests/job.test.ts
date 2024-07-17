/* eslint-disable @typescript-eslint/no-explicit-any */

import path from 'path';
import { getImportScriptArgs } from '../job';
import { UploadWorkflowTypes } from '../utils';

const sampleCsv = path.resolve(__dirname, 'fixtures/sample.csv');

test('generates correct script args for the different workflows', () => {
  const common = ['--log_level', 'info'];
  let result = getImportScriptArgs(UploadWorkflowTypes.Locations, sampleCsv);
  expect(result).toEqual(['--csv_file', sampleCsv, '--resource_type', 'locations', ...common]);
  result = getImportScriptArgs(UploadWorkflowTypes.Users, sampleCsv);
  expect(result).toEqual(['--csv_file', sampleCsv, '--resource_type', 'users', ...common]);
  result = getImportScriptArgs(UploadWorkflowTypes.CareTeams, sampleCsv);
  expect(result).toEqual(['--csv_file', sampleCsv, '--resource_type', 'careTeams', '--log_level', 'info']);
  result = getImportScriptArgs(UploadWorkflowTypes.orgToLocationAssignment, sampleCsv);
  expect(result).toEqual(['--csv_file', sampleCsv, '--assign', 'organizations-Locations', '--log_level', 'info']);
  result = getImportScriptArgs(UploadWorkflowTypes.userToOrganizationAssignment, sampleCsv);
  expect(result).toEqual(['--csv_file', sampleCsv, '--assign', 'users-organizations', '--log_level', 'info']);
  result = getImportScriptArgs(UploadWorkflowTypes.Organizations, sampleCsv);
  expect(result).toEqual(['--csv_file', sampleCsv, '--resource_type', 'organizations', '--log_level', 'info']);
  result = getImportScriptArgs(UploadWorkflowTypes.Products, sampleCsv);
  expect(result).toEqual(['--csv_file', sampleCsv, '--setup', 'products', '--log_level', 'info']);
  result = getImportScriptArgs(UploadWorkflowTypes.Inventories, sampleCsv);
  expect(result).toEqual(['--csv_file', sampleCsv, '--setup', 'inventories', '--log_level', 'info']);
});
