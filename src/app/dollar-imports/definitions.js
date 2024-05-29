const {spawn}  = require("child_process");
const Queue = require("better-queue")
const Q = require('fastq');

class WorkflowManager{
  // gets list of all workflows.
  // create a graph of the workflow description as jobs
  // parse through the graph picking priority jobs and starting them
  // each job has a definition based on other jobs of when it should start

  /** adds a map of the jobs by their workflow ID */
  addJobs(){}
}



class Job{
    wkFlowType; // TODO - maybe this should be an enum
    filePath;

    constructor(wkFlowType, filePath){
        this.wkFlowType = wkFlowType
        this.filePath = filePath
    }

    async run(){
        if(this.wkFlowType === "users"){
            return await runUserUploadJob(this.filePath)
        }
    }
}

function runLocationsImporter(filePath){
    // need to parse location csv divy up the csvs by admin level
    const commandArgs = ['--csv_file', filePath, "--resource_type", "locations"]
}

function runUserUploadJob(filePath){
    // python3 main.py --csv_file csv/users.csv --resource_type users --log_level info
    const commandArgs = ['--csv_file', filePath, "--resource_type", "users"]
    return runCommandWithFilePath(commandArgs)
}

function runOrganizationUploadJob(filePath){
    // python3 main.py --csv_file csv/organizations/organizations_min.csv --resource_type organizations --log_level info
    const commandArgs = ['--csv_file', filePath, "--resource_type", "organizations"]
    return runCommandWithFilePath(commandArgs)
}

function runCareTeamsUploadJob(filePath){
    // python3 main.py --csv_file csv/careteams/careteam_full.csv --resource_type careTeams --log_level info
    const commandArgs = ['--csv_file', filePath, "--resource_type", "careTeams"]
    return runCommandWithFilePath(commandArgs)
}

function runOrgToLocAssignmentJob(filePath){
    // python3 main.py --csv_file csv/organizations/organizations_locations.csv --assign organizations-Locations --log_level info
    const commandArgs = ['--csv_file', filePath, "--assign", "organizations-locations"]
    return runCommandWithFilePath(commandArgs)
}

function runUsersToOrgAssignmentJob(filePath){
    // python3 main.py --csv_file csv/practitioners/users_organizations.csv --assign users-organizations --log_level info
    const commandArgs = ['--csv_file', filePath, "--assign", "users-organizations"]
    return runCommandWithFilePath(commandArgs)
}



async function runCommandWithFilePath( args, options = {}) {
    const command = 'python3'
    const commonArgs = ["main.py"]

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
  }
  
  const que = new Queue(async (wkFlowDescription, cb) => {
    // update access token on importer-script
    // create job
    const job = new Job(wkFlowDescription.wkFlowType, wkFlowDescription.filePath)
    await job.run()
  }, {store: {
    type: 'sql',
    dialect: 'sqlite',
    path: './q.sqlite'
  }})

  que.on('task_finish', function (taskId, result, stats) {
    // taskId = 1, result: 3, stats = { elapsed: <time taken> }
    // taskId = 2, result: 5, stats = { elapsed: <time taken> }
    console.log({taskId})
  })
  
  que.push({wkFlowType: "users", filePath: "/tmp/csvUploads/d19dbc63a32ca4427caf84251e2ef35f"}, (err, rsult) => {
    console.log({err, rsult})
  })

console.log(que.getStats())


// const q = Q.promise(worker, 1)

// async function worker (wkFlowDescription) {
//     const job = new Job(wkFlowDescription.wkFlowType, wkFlowDescription.filePath)
//     return await job.run().then(as => {console.log(as)}).catch(sd => console.log({sd}))
// }

// (async () => {
//   q.push({wkFlowType: "users", filePath: "/tmp/csvUploads/d19dbc63a32ca4427caf84251e2ef35f"}, (err, result) => {
//    console.log({err, result})
//  })
// })()



// console.log(q.length())


// const queue = require('fastq').promise(wks, 1)

// async function wks (arg) {
//   return arg * 2
// }

// async function run () {
//   const result = await queue.push(42)
//   console.log('the result is', result)
// }

// run()