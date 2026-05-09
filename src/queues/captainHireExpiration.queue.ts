import { Queue } from 'bullmq';
import { redis } from '../lib/redis';

export const captainHireExpirationQueue = new Queue('captainHireExpiration', {
  connection: redis as any,
});