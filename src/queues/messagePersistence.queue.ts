import { Queue } from 'bullmq';
import { redis } from '../lib/redis';

export const messagePersistenceQueue = new Queue('messagePersistence', {
  connection: redis as any,
});

