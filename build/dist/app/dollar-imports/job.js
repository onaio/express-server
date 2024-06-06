"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImportScriptArgs = exports.Job = void 0;
const child_process_1 = require("child_process");
const utils_1 = require("./utils");
/** A job checks if preconditions are okay for it to proceed.
 * get dependencies of that particular upload workflow type then filter current jobs by that workflow type
 * if it finds one, check that it completed successfully, if so proceed with precondition met. if not
 * fail this job workflow with precondition fail.
 *
 */
class Job {
    constructor(job) {
        this.internalStatus = "paused";
        this.preconditionPassed = false;
        const options = job.data;
        this.job = job;
        this.workflowType = options.workflowType;
        this.csv_file = options.filePath;
        this.startDate = Date.now();
        this.workflowId = options.workflowId;
    }
    precondition() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const allJobs = yield this.job.queue.getJobs([]);
            // find jobs that are related with this upload.
            const thisJobUploadId = this.workflowId.split("_")[0]; // TODO - separator can be constant
            const relatedJobs = allJobs.filter((job) => {
                const jobId = job.id;
                const otherJobUploadId = jobId.split("_")[0];
                return thisJobUploadId === otherJobUploadId;
            });
            // find jobs whose workflow type is superior to this and get status.
            const precedingJobTypes = (_a = utils_1.dependencyGraph[this.workflowType]) !== null && _a !== void 0 ? _a : [];
            // console.log({relatedJobs, precedingJobTypes, thisJobUploadId})
            const precedingJobs = relatedJobs.filter(job => {
                return precedingJobTypes.includes(job.data.workflowType);
            });
            // console.log({precedingJobs, thisJobUploadId})
            const preceedingJobsStatus = [];
            for (const job of precedingJobs) {
                const jobState = yield job.getState();
                preceedingJobsStatus.push({ jobState, workflowType: job.data.workflowType });
            }
            const failedStates = preceedingJobsStatus.filter(status => status.jobState === "failed");
            if (failedStates.length) {
                throw new Error(`Preceeding job of type ${failedStates.map(state => state.workflowType).join()} failed`);
            }
            // console.log({preceedingJobsStatus})
            const incompleteJobs = preceedingJobsStatus.filter(status => status.jobState !== "completed");
            if (incompleteJobs.length) {
                this.preconditionPassed = false;
                // keep running loop
            }
            else {
                this.preconditionPassed = true;
                // pass precondition
            }
        });
    }
    // async runPrecondition() {
    //     // Start the task with setInterval
    //     return new Promise((resolve, reject) => {
    //         try{
    //             this.preconditionInterval = setInterval(async () => {try {await this.precondition()}catch(err){
    //                 reject(err)
    //             }}, 1000); // Run every 1 second
    //         }catch(err){
    //             console.log({err})
    //             reject(err)
    //         }
    //     })
    // }
    asyncDoTask() {
        return __awaiter(this, void 0, void 0, function* () {
            // const hasRun = false
            // try{this.runPrecondition()}catch{
            // }
            return new Promise((resolve, reject) => {
                // try{
                //     this.precondition()
                // }catch(err){
                //     reject(err)
                // }
                // this.runPrecondition().catch(err => reject(err))
                const doTaskIntervalId = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                    if (this.preconditionPassed) {
                        clearInterval(doTaskIntervalId);
                        clearInterval(this.preconditionInterval);
                        // TODO - deal with rejected promises.
                        try {
                            resolve(yield this.run());
                        }
                        catch (error) {
                            reject(error);
                        }
                    }
                    else {
                        try {
                            yield this.precondition();
                        }
                        catch (error) {
                            reject(error);
                        }
                        // this.precondition()
                    }
                }), 1000);
            });
        });
    }
    run() {
        const command = 'python3';
        const scriptArgs = ["main.py", ...getImportScriptArgs(this.workflowType, this.csv_file)];
        return new Promise((resolve, reject) => {
            // Append the file path to the arguments list
            // Spawn the child process
            const childProcess = (0, child_process_1.spawn)(command, scriptArgs, { cwd: utils_1.importerSourceFilePath });
            let stdoutData = '';
            let stderrData = '';
            // Collect stdout data
            childProcess.stdout.on('data', (data) => {
                stdoutData += data.toString();
            });
            // Collect stderr data
            childProcess.stderr.on('data', (data) => {
                stderrData += data.toString();
            });
            // Handle process completion
            childProcess.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout: stdoutData, stderr: stderrData });
                }
                else {
                    reject(new Error(JSON.stringify({ stdout: stdoutData, stderr: stderrData })));
                }
            });
            // Handle errors
            childProcess.on('error', (err) => {
                reject(new Error(JSON.stringify({ stdout: stdoutData, stderr: stderrData })));
            });
        });
    }
}
exports.Job = Job;
function getImportScriptArgs(workflowType, filePath) {
    switch (workflowType) {
        case utils_1.UploadWorkflowTypes.Locations:
            return ['--csv_file', filePath, "--resource_type", "locations", "--only_response", "true"];
        case utils_1.UploadWorkflowTypes.Users:
            return ['--csv_file', filePath, "--resource_type", "users", "--only_response", "true"];
        case utils_1.UploadWorkflowTypes.Careteams:
            return ['--csv_file', filePath, "--resource_type", "careTeams", "--only_response", "true"];
        case utils_1.UploadWorkflowTypes.orgToLocationAssignment:
            return ['--csv_file', filePath, "--assign", "organizations-locations", "--only_response", "true"];
        case utils_1.UploadWorkflowTypes.userToOrganizationAssignment:
            return ['--csv_file', filePath, "--assign", "users-organizations", "--only_response", "true"];
        case utils_1.UploadWorkflowTypes.Organizations:
            return ['--csv_file', filePath, "--resource_type", "organizations", "--only_response", "true"];
        case utils_1.UploadWorkflowTypes.Inventory:
            return ['--csv_file', filePath, "--setup", "products", "--only_response", "true"];
        case utils_1.UploadWorkflowTypes.Product:
            return ['--csv_file', filePath, "--setup", "inventories", "--only_response", "true"];
        default:
            return [];
    }
}
exports.getImportScriptArgs = getImportScriptArgs;
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
//# sourceMappingURL=job.js.map