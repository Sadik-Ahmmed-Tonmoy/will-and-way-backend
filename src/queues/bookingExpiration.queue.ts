import { Queue } from 'bullmq';
import { redis } from '../lib/redis';

export const bookingExpirationQueue = new Queue('bookingExpiration', {
  connection: redis as any,
});