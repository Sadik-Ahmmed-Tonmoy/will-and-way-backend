import { Queue } from 'bullmq';
import { redis } from '../lib/redis';

// Cast to `any` to bypass TypeScript type mismatch between ioredis versions
export const paymentCaptureQueue = new Queue('paymentCapture', {
  connection: redis as any,
});