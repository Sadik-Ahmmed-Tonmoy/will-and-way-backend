import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { PaymentService, ProductType } from './payment.service';

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const { productType } = req.body as { productType: ProductType };
  const result = await PaymentService.createCheckoutSession(req.user.id, productType);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Checkout session created',
    data: result,
  });
});

const getPaymentStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getPaymentStatus(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment status fetched',
    data: result,
  });
});

const createCustomerPortalSession = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.createCustomerPortalSession(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Billing portal session created',
    data: result,
  });
});

const cancelSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.cancelSubscription(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const getSessionDetails = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.query as { sessionId: string };
  const result = await PaymentService.getSessionDetails(sessionId, req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Session details fetched',
    data: result,
  });
});

export const PaymentController = {
  createCheckoutSession,
  getPaymentStatus,
  createCustomerPortalSession,
  cancelSubscription,
  getSessionDetails,
};