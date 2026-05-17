import { Request, Response } from 'express';
import httpStatus from 'http-status';
import sendResponse from '../../../shared/sendResponse';
import { GiftServices } from './gift.service';
import catchAsync from '../../utils/catchAsync';
import { GiftType } from '@prisma/client';

const createGift = catchAsync(async (req: Request, res: Response) => {
  const result = await GiftServices.createGift(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Gift created successfully',
    data: result,
  });
});

const getGifts = catchAsync(async (req: Request, res: Response) => {
  const result = await GiftServices.getGifts(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Gifts fetched successfully',
    data: result,
  });
});

const getGiftById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GiftServices.getGiftById(req.user.id, id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Gift fetched successfully',
    data: result,
  });
});

const updateGift = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GiftServices.updateGift(req.user.id, id as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Gift updated successfully',
    data: result,
  });
});

const deleteGift = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GiftServices.deleteGift(req.user.id, id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Gift deleted successfully',
    data: result,
  });
});

const getGiftsByType = catchAsync(async (req: Request, res: Response) => {
  const { giftType } = req.params;
  const result = await GiftServices.getGiftsByType(
    req.user.id,
    giftType as GiftType
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Gifts fetched successfully',
    data: result,
  });
});

export const GiftController = {
  createGift,
  getGifts,
  getGiftById,
  updateGift,
  deleteGift,
  getGiftsByType,
};