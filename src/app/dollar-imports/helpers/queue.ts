import type Bull from 'bull';
import { getRedisClient, redisIsConfigured } from '../../helpers/redisClient';
import { Job } from './job';

// eslint-disable-next-line  @typescript-eslint/no-var-requires
const Queue = require('bull');

export const importQName = 'fhir-import-queue';

let importQ: Bull.Queue | undefined;
export type BullQ = Bull.Queue;

export function getImportQueue() {
  if (importQ) {
    return importQ;
  }
  if (redisIsConfigured) {
    importQ = Queue(importQName, {
      createClient: () => {
        return getRedisClient();
      },
    });

    // Process jobs from the queue
    importQ
      ?.process((jobArgs: Bull.Job) => {
        const jobInstance = new Job(jobArgs);
        return jobInstance.asyncDoTask().catch((err) => {
          throw err;
        });
      })
      .catch((_) => {
        // winston log.
      });
  }
  return importQ;
}
