import { spawn } from 'child_process';
import { stdout } from 'process';
import { UploadWorkflowTypes, dependencyGraph, importerSourceFilePath } from './utils';
import Bull, { Job as BullJob } from 'bull'


/** A job checks if preconditions are okay for it to proceed.
 * get dependencies of that particular upload workflow type then filter current jobs by that workflow type
 * if it finds one, check that it completed successfully, if so proceed with precondition met. if not 
 * fail this job workflow with precondition fail.
 * 
 */

export class Job {
    workflowType: UploadWorkflowTypes;
    csv_file: string;
    internalStatus: string = "paused";
    startDate: number;
    workflowId: string;
    job: BullJob
    preconditionInterval: any;
    preconditionPassed: boolean = false;
    dateStarted: number
    constructor(job: BullJob) {
        const options = job.data
        this.job = job
        this.workflowType = options.workflowType
        this.csv_file = options.filePath
        this.startDate = Date.now()
        this.workflowId = options.workflowId
    }

    async precondition() {
        const allJobs = await this.job.queue.getJobs([])
        // find jobs that are related with this upload.
        const thisJobUploadId = this.workflowId.split("_getJobs")[0]
        const relatedJobs = allJobs.filter((job: BullJob) => {
            const jobId = job.id as string
            const otherJobUploadId = jobId.split("_")[0]
            return thisJobUploadId === otherJobUploadId
        })
        // find jobs whose workflow type is superior to this and get status.
        const precedingJobTypes = dependencyGraph[this.workflowType] ?? []
        const precedingJobs = relatedJobs.filter(job => {
            return precedingJobTypes.includes(job.data.workflowType)
        })
        const preceedingJobsStatus = []
        for (const job of precedingJobs) {
            const jobState = await job.getState()
            preceedingJobsStatus.push(jobState)
        }
        if (preceedingJobsStatus.some(status => status === "failed")) {
            throw new Error("Preceeding job failed")
        }

        const incompleteJobs = preceedingJobsStatus.filter(status => status !== "completed")
        if (incompleteJobs.length) {
            this.preconditionPassed = false
            // keep running loop
        } else {
            this.preconditionPassed = true
            // pass precondition
        }
        /** we now check that if jobs that we consider primary are in the queue and their status */
    }

    async runPrecondition() {
        // Start the task with setInterval
        this.preconditionInterval = setInterval(() => this.precondition(), 1000); // Run every 1 second
    }

    async asyncDoTask() {
        // const hasRun = false
        this.runPrecondition()
        return new Promise((resolve, reject) => {
            const doTaskIntervalId = setInterval(async () => {
                if (this.preconditionPassed) {
                    clearInterval(doTaskIntervalId)
                    clearInterval(this.preconditionInterval)
                    // TODO - deal with rejected promises.
                    try {
                        resolve(await this.run());
                    } catch (error) {
                        reject(error);
                    }
                }
            }, 1000)
        })
    }

    run() {
        const command = 'python3'
        const scriptArgs = ["main.py", ...getImportScriptArgs(this.workflowType, this.csv_file)]

        return new Promise((resolve, reject) => {
            // Append the file path to the arguments list

            // Spawn the child process
            const childProcess = spawn(command, scriptArgs, { cwd: importerSourceFilePath });

            let stdoutData = '';
            let stderrData = '';

            // Collect stdout data
            childProcess.stdout.on('data', (data: any) => {
                stdoutData += data.toString();
            });

            // Collect stderr data
            childProcess.stderr.on('data', (data: any) => {
                stderrData += data.toString();
            });

            // Handle process completion
            childProcess.on('close', (code: any) => {
                if (code === 0) {
                    resolve({ stdout: stdoutData, stderr: stderrData });
                } else {
                    reject(new Error(JSON.stringify({ stdout: stdoutData, stderr: stderrData })))
                }
            });

            // Handle errors
            childProcess.on('error', (err: Error) => {
                reject( new Error(JSON.stringify({ stdout: stdoutData, stderr: stderrData })))
            });
        })
    }
}

export function getImportScriptArgs(workflowType: string, filePath: string) {
    switch (workflowType) {
        case UploadWorkflowTypes.Locations:
            return ['--csv_file', filePath, "--resource_type", "locations"]
        case UploadWorkflowTypes.Users:
            return ['--csv_file', filePath, "--resource_type", "users"]
        case UploadWorkflowTypes.Careteams:
            return ['--csv_file', filePath, "--resource_type", "careTeams"]
        case UploadWorkflowTypes.orgToLocationAssignment:
            return ['--csv_file', filePath, "--assign", "organizations-locations"]
        case UploadWorkflowTypes.userToOrganizationAssignment:
            return ['--csv_file', filePath, "--assign", "users-organizations"]
        case UploadWorkflowTypes.Organizations:
            return ['--csv_file', filePath, "--resource_type", "organizations"]
        case UploadWorkflowTypes.Inventory:
            return ['--csv_file', filePath, "--setup", "products"]
        case UploadWorkflowTypes.Product:
            return ['--csv_file', filePath, "--setup", "inventories"]
        default:
            return []
    }
}


/**
 * 
 * GENERAL TODO :
 * - date created does not reflect *
 * - workflow need to be ordered *
 * - update templates for products *
 * - update location uploader template - this should move to fhir-tooling.
 * - import endpoint works only with redis client connection
 * - endpoint is authorization restricted as well. *
 * - remove old jobs from redis *
 *  - add logging
 *  - job date started should be when the run method is called.
 * 
 * Concerns Idempotence in operations like uploading locations, this can fail for half some files. or when uploading
 * users.
 */