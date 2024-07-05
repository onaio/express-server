// const Queue = require("bull")
import { getRedisClient, redisIsConfigured } from '../helpers/redisClient'
import { Job } from './job';
import Bull from 'bull';

export const importQName = "fhir-import-queue"

let importQ: Bull.Queue

if (redisIsConfigured) {
  importQ = (Bull as any)(importQName, {
    createClient: () => {
      return getRedisClient()
    }
  })

  // Process jobs from the queue
  importQ.process(async (jobArgs: any) => {
    const jobInstance = new Job(jobArgs)
    return await jobInstance.asyncDoTask()
  });

}

export { importQ }