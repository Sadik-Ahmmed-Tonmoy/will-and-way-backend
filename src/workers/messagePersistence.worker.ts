import { Worker } from 'bullmq';
import { redis } from '../lib/redis';
import prisma from '../shared/prisma';

const messageWorker = new Worker(
  'messagePersistence',
  async (job) => {
    console.log(`[Worker] Processing job ${job.id} for conversation ${job.data.conversationId}`);
    const { conversationId, message } = job.data;
    try {
      await prisma.message.create({
        data: {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          imageUrl: message.imageUrl,
          createdAt: new Date(message.createdAt),
        },
      });
      console.log(`✅ Persisted message ${message.id}`);
    } catch (error) {
      console.error(`❌ Failed to persist message ${message.id}:`, error);
      throw error;
    }
  },
  { connection: redis as any, concurrency: 10 }
);

messageWorker.on('completed', (job) => console.log(`✅ Worker completed job ${job.id}`));
messageWorker.on('failed', (job, err) => console.error(`❌ Worker failed job ${job?.id}:`, err));

console.log('🚀 Message persistence worker started');

export { messageWorker };