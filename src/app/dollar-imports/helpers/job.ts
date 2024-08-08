import { spawn } from 'child_process';
import { Job as BullJob } from 'bull';
import { JobData, UploadWorkflowTypes, dependencyGraph, importerSourceFilePath } from './utils';
import {
  EXPRESS_OPENSRP_CLIENT_ID,
  EXPRESS_OPENSRP_SERVER_URL,
  EXPRESS_OPENSRP_CLIENT_SECRET,
  EXPRESS_PYTHON_INTERPRETER_PATH,
} from '../../../configs/envs';
import { realm, keycloakBaseUrl } from '../../helpers/utils';
import { winstonLogger } from '../../../configs/winston';

export function getImportScriptArgs(jobData: JobData) {
  const { workflowType, filePath: rawFilePath, productListId, inventoryListId } = jobData;
  const filePath = `"${rawFilePath}"`;
  const commonFlags = ['--log_level', 'info'];
  switch (workflowType) {
    case UploadWorkflowTypes.Locations:
      return [
        '--csv_file',
        filePath,
        '--resource_type',
        'locations',
        '--location_type_coding_system',
        'http://smartregister.org/CodeSystem/eusm-service-point-type',
        ...commonFlags,
      ];
    case UploadWorkflowTypes.Users:
      return ['--csv_file', filePath, '--resource_type', 'users', ...commonFlags];
    case UploadWorkflowTypes.CareTeams:
      return ['--csv_file', filePath, '--resource_type', 'careTeams', ...commonFlags];
    case UploadWorkflowTypes.orgToLocationAssignment:
      return ['--csv_file', filePath, '--assign', 'organizations-Locations', ...commonFlags];
    case UploadWorkflowTypes.userToOrganizationAssignment:
      return ['--csv_file', filePath, '--assign', 'users-organizations', ...commonFlags];
    case UploadWorkflowTypes.Organizations:
      return ['--csv_file', filePath, '--resource_type', 'organizations', ...commonFlags];
    // invariant: at this point the product list and inventory list id  are defined
    case UploadWorkflowTypes.Products:
      return ['--csv_file', filePath, '--setup', 'products', '--list_resource_id', `${productListId}`, ...commonFlags];
    case UploadWorkflowTypes.Inventories:
      return [
        '--csv_file',
        filePath,
        '--setup',
        'inventories',
        '--list_resource_id',
        `${inventoryListId}`,
        ...commonFlags,
      ];
    default:
      return [];
  }
}

/** A job checks if preconditions are okay for it to proceed.
 * get dependencies of that particular upload workflow type then filter current jobs by that workflow type
 * if it finds one, check that it completed successfully, if so proceed with precondition met. if not
 * fail this job workflow with precondition fail.
 *
 */
export class Job {
  workflowType: UploadWorkflowTypes;

  csv_file: string;

  internalStatus = 'paused';

  startDate: number;

  workflowId: string;

  job: BullJob;

  jobData: JobData;

  preconditionPassed = false;

  dateStarted: number;

  constructor(job: BullJob<JobData>) {
    const jobData = job.data;
    this.jobData = jobData;
    this.job = job;
    this.workflowType = jobData.workflowType;
    this.csv_file = jobData.filePath;
    this.startDate = Date.now();
    this.workflowId = jobData.workflowId;
  }

  async precondition() {
    winstonLogger.info(`job ${this.jobData.workflowId}: Starting precondition check`);
    const allJobs = await this.job.queue.getJobs([]);
    // find jobs that are related with this upload.
    const thisJobUploadId = this.workflowId.split('_')[0];
    const relatedJobs = allJobs.filter((job: BullJob) => {
      const jobId = job.id as string;
      const otherJobUploadId = jobId.split('_')[0];
      return thisJobUploadId === otherJobUploadId;
    });
    // find jobs whose workflow type should preceed this(parent workflows) and get status.
    const precedingJobTypes = dependencyGraph[this.workflowType] ?? [];
    const precedingJobs = relatedJobs.filter((job) => {
      return precedingJobTypes.includes(job.data.workflowType);
    });
    const preceedingJobsStatus = [];
    for (const job of precedingJobs) {
      /* eslint-disable-next-line no-await-in-loop */
      const jobState = await job.getState();
      preceedingJobsStatus.push({ jobState, workflowType: job.data.workflowType });
    }
    const failedStates = preceedingJobsStatus.filter((status) => status.jobState === 'failed');

    if (failedStates.length) {
      const failedMessage = `Preceeding job of type ${failedStates.map((state) => state.workflowType).join()} failed`;
      winstonLogger.error(`job ${this.jobData.workflowId}: ${failedMessage}`);
      throw new Error(failedMessage);
    }

    const incompleteJobs = preceedingJobsStatus.filter((status) => status.jobState !== 'completed');
    if (incompleteJobs.length) {
      this.preconditionPassed = false;
      // keep running loop
    } else {
      winstonLogger.info(`job ${this.jobData.workflowId}: precondition passed`);
      this.preconditionPassed = true;
      // pass precondition
    }
  }

  async asyncDoTask() {
    winstonLogger.debug(`job ${this.jobData.workflowId}: task start instruction`);
    return new Promise((resolve, reject) => {
      const doTaskIntervalId = setInterval(async () => {
        winstonLogger.debug(`job ${this.jobData.workflowId}: invoking precondition check`);
        if (this.preconditionPassed) {
          clearInterval(doTaskIntervalId);
          try {
            resolve(await this.run());
          } catch (error) {
            reject(error);
          }
        } else {
          try {
            await this.precondition();
          } catch (error) {
            winstonLogger.debug(`job ${this.jobData.workflowId}: precondition failed with ${error}`);
            clearInterval(doTaskIntervalId);
            reject(error);
          }
        }
      }, 1000);
    });
  }

  run() {
    const command = EXPRESS_PYTHON_INTERPRETER_PATH;
    const scriptArgs = ['main.py', ...getImportScriptArgs(this.jobData)];

    return new Promise((resolve, reject) => {
      // Append the file path to the arguments list

      const cwdEnv = {
        client_id: EXPRESS_OPENSRP_CLIENT_ID,
        client_secret: EXPRESS_OPENSRP_CLIENT_SECRET,
        fhir_base_url: EXPRESS_OPENSRP_SERVER_URL,
        keycloak_url: keycloakBaseUrl,
        realm,
        access_token: this.jobData.accessToken,
        refresh_token: this.jobData.refreshToken,
        // OAUTHLIB_INSECURE_TRANSPORT: '1',
      };

      winstonLogger.debug(`job ${this.jobData.workflowId}: Importer script started with: ${[command, scriptArgs]}`);

      // Spawn the child process
      const childProcess = spawn(command, scriptArgs, {
        cwd: importerSourceFilePath,
        env: cwdEnv,
        shell: true,
      });

      let stdoutData = '';
      let stderrData = '';

      // Collect stdout data
      childProcess.stdout.on('data', (data: string) => {
        stdoutData += data.toString();
      });

      // Collect stderr data
      childProcess.stderr.on('data', (data: string) => {
        stderrData += data.toString();
      });

      // Handle process completion
      childProcess.on('close', (code: number) => {
        if (code === 0) {
          winstonLogger.info(`job ${this.jobData.workflowId}: Importer script ran to completion`);
          resolve({ stdout: stdoutData, stderr: stderrData });
        } else {
          const errorResponse = JSON.stringify({ stdout: stdoutData, stderr: stderrData });
          winstonLogger.error(`job ${this.jobData.workflowId}: Importer script failed with error: ${errorResponse} `);
          reject(new Error(errorResponse));
        }
      });

      // Handle errors
      childProcess.on('error', (_: Error) => {
        winstonLogger.error(`job ${this.jobData.workflowId}: Child process failed with ${_}`);
        reject(new Error(JSON.stringify({ stdout: stdoutData, stderr: stderrData })));
      });
    });
  }
}

/**
 *
 * some errors at the invocation level are not reported e.g. python failing to be found.
 */
