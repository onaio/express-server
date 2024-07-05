import { spawn } from 'child_process';
import { UploadWorkflowTypes, dependencyGraph, importerSourceFilePath } from './utils';
import { Job as BullJob } from 'bull'


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
        const thisJobUploadId = this.workflowId.split("_")[0] // TODO - separator can be constant
        const relatedJobs = allJobs.filter((job: BullJob) => {
            const jobId = job.id as string
            const otherJobUploadId = jobId.split("_")[0]
            return thisJobUploadId === otherJobUploadId
        })
        // find jobs whose workflow type is superior to this and get status.
        const precedingJobTypes = dependencyGraph[this.workflowType] ?? []
        // console.log({relatedJobs, precedingJobTypes, thisJobUploadId})
        const precedingJobs = relatedJobs.filter(job => {
            return precedingJobTypes.includes(job.data.workflowType)
        })
        // console.log({precedingJobs, thisJobUploadId})
        const preceedingJobsStatus = []
        for (const job of precedingJobs) {
            const jobState = await job.getState()
            preceedingJobsStatus.push({jobState, workflowType: job.data.workflowType})
        }
        const failedStates = preceedingJobsStatus.filter(status => status.jobState === "failed")

        if (failedStates.length) {
            throw new Error(`Preceeding job of type ${failedStates.map(state => state.workflowType).join()} failed`)
        }
        // console.log({preceedingJobsStatus})

        const incompleteJobs = preceedingJobsStatus.filter(status => status.jobState !== "completed")
        if (incompleteJobs.length) {
            this.preconditionPassed = false
            // keep running loop
        } else {
            this.preconditionPassed = true
            // pass precondition
        }
    }

    async asyncDoTask() {
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
                }else{
                    try {
                        await this.precondition();
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
            childProcess.on('close', (code: any, ...args) => {
                console.log({code, args})
                if (code === 0) {
                    resolve({ stdout: stdoutData, stderr: stderrData });
                } else {
                    reject(new Error(JSON.stringify({ stdout: stdoutData, stderr: stderrData })))
                }
            });

            // Handle errors
            childProcess.on('error', (err: Error) => {
                console.log({err})
                reject( new Error(JSON.stringify({ stdout: stdoutData, stderr: stderrData })))
            });
        })
    }
}

export function getImportScriptArgs(workflowType: string, filePath: string) {
    console.log({workflowType, filePath})
    const commonFlags = ["--log_level", "info"]
    switch (workflowType) {
        case UploadWorkflowTypes.Locations:
            return ['--csv_file', filePath, "--resource_type", "locations", ...commonFlags]
        case UploadWorkflowTypes.Users:
            return ['--csv_file', filePath, "--resource_type", "users", ...commonFlags]
        case UploadWorkflowTypes.CareTeams:
            return ['--csv_file', filePath, "--resource_type", "careTeams", ...commonFlags]
        case UploadWorkflowTypes.orgToLocationAssignment:
            return ['--csv_file', filePath, "--assign", "organizations-Locations", ...commonFlags]
        case UploadWorkflowTypes.userToOrganizationAssignment:
            return ['--csv_file', filePath, "--assign", "users-organizations", ...commonFlags]
        case UploadWorkflowTypes.Organizations:
            return ['--csv_file', filePath, "--resource_type", "organizations", ...commonFlags]
        case UploadWorkflowTypes.Products:
            return ['--csv_file', filePath, "--setup", "products", ...commonFlags]
        case UploadWorkflowTypes.Inventories:
            return ['--csv_file', filePath, "--setup", "inventories", ...commonFlags]
        default:
            return []
    }
}

/**
 * 
 * GENERAL TODO :
 *  - add logging
 *  - job date started should be when the run method is called.
 * 
 * Concerns Idempotence in operations like uploading locations, this can fail for half some files. or when uploading
 * users.
 */