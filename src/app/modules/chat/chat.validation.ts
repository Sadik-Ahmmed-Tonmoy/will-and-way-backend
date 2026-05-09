import { z } from 'zod';

export const createConversationSchema = z.object({
  body: z.object({
    participantIds: z.array(z.string()).min(2).max(2),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    conversationId: z.string(),
    content: z.string().min(1),
    imageUrl: z.string().url().optional(),
  }),
});

export const getMessagesSchema = z.object({
  params: z.object({
    conversationId: z.string(),
  }),
  query: z.object({
    page: z.string().optional().transform(Number),
    limit: z.string().optional().transform(Number),
  }),
});