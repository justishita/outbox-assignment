import { Queue } from 'bullmq';
import redis from '../config/redis';
import { config } from '../config';

export const emailQueue = new Queue('emails', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});
