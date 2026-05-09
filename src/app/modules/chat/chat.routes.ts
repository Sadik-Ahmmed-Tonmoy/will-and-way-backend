import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ChatController } from './chat.controller';
import { createConversationSchema, sendMessageSchema, getMessagesSchema } from './chat.validation';

const router = express.Router();

// All chat routes require authentication
router.use(auth());

router.post(
  '/conversations',
  validateRequest(createConversationSchema),
  ChatController.createOrGetConversation
);

router.post(
  '/messages',
  validateRequest(sendMessageSchema),
  ChatController.sendMessage
);

router.get(
  '/conversations',
  ChatController.getUserConversations
);

router.get(
  '/conversations/:conversationId/messages',
  validateRequest(getMessagesSchema),
  ChatController.getMessages
);

export const ChatRoutes = router;