import type Bull from 'bull';
import { getRedisClient, redisIsConfigured } from '../../helpers/redisClient';
import { Job } from './job';
import { EXPRESS_BULK_UPLOAD_REDIS_QUEUE } from '../../../configs/envs';
import { BULK_UPLOAD_CONCURRENT_JOBS } from '../../../constants';

// eslint-disable-next-line  @typescript-eslint/no-var-requires
const Queue = require('bull');

export const importQName = EXPRESS_BULK_UPLOAD_REDIS_QUEUE;

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
      ?.process(BULK_UPLOAD_CONCURRENT_JOBS, (jobArgs: Bull.Job) => {
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
