import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ChatService } from './chat.service';

const createOrGetConversation = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { participantIds } = req.body;
  if (!participantIds.includes(userId)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'You must be one of the participants',
      data: null,
    });
  }
  const result = await ChatService.createOrGetConversation(participantIds);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Conversation retrieved/created',
    data: result,
  });
});

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const senderId = req.user.id;
  const result = await ChatService.sendMessage({ ...req.body, senderId });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Message sent',
    data: result,
  });
});

const getUserConversations = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await ChatService.getUserConversations(userId, page, limit);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Conversations retrieved',
    data: result,
  });
});

const getMessages = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { conversationId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const result = await ChatService.getMessages(conversationId, userId, page, limit);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Messages retrieved',
    data: result,
  });
});

export const ChatController = {
  createOrGetConversation,
  sendMessage,
  getUserConversations,
  getMessages,
};