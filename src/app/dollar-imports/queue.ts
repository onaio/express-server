const Queue = require("bull")
import {getRedisClient} from '../utils/redisClient'
import {Job} from './job';

export const importQName = "fhir-import-queue"

export const importQ = Queue(importQName, {createClient: () => getRedisClient()})

// Process jobs from the queue
importQ.process(async (jobArgs: any) => {
    const jobInstance = new Job(jobArgs)
    return await jobInstance.asyncDoTask()
  });
  
