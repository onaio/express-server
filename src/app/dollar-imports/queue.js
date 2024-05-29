const Queue = require("bull")
import {getRedisClient} from '../utils/redisClient'

export const importQName = "fhir-import-queue"

export const importQ = Queue(importQName, {createClient: () => getRedisClient()})

// Process jobs from the queue
importQ.process(async (job) => {
    const command = 'python3'
    const commonArgs = ["main.py", ...getImportScriptArgs(job)]

    return new Promise((resolve, reject) => {
      // Append the file path to the arguments list
      const allArgs = [...commonArgs, ...args];
      
      // Spawn the child process
      const childProcess = spawn(command, allArgs, {cwd: "/home/peter/Desktop/onaio/express-server/fhir-tooling/"});
      
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
        } else {
          reject(new Error(`Process exited with code ${code}. ${stderrData}`));
        }
      });
  
      // Handle errors
      childProcess.on('error', (err) => {
        reject(err);
      });
    });
  });
  
  export function getImportScriptArgs(job){
    const workflowId = job.workflowId
    switch(workflowId){
      case "locations":
        return ['--csv_file', filePath, "--resource_type", "locations"]
      case "users":
        return ['--csv_file', filePath, "--resource_type", "users"]
      case "careteams":
        return ['--csv_file', filePath, "--resource_type", "careTeams"]
      case "orgToLocationAssignment":
        return ['--csv_file', filePath, "--assign", "organizations-locations"]
      case "usersToOrgAssignment":
        return ['--csv_file', filePath, "--assign", "users-organizations"]
      default:
        return []
    }
  }