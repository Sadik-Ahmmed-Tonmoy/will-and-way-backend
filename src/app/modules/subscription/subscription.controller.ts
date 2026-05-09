import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SubscriptionServices } from './subscription.service';

// Vendor routes
const getMySubscription = catchAsync(async (req: Request, res: Response) => {
  const vendorId = req.user.id;
  const result = await SubscriptionServices.getVendorSubscription(vendorId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription retrieved',
    data: result,
  });
});

const updatePaymentMethod = catchAsync(async (req: Request, res: Response) => {
  const vendorId = req.user.id;
  const result = await SubscriptionServices.updatePaymentMethod(vendorId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment method updated',
    data: result,
  });
});

const upgradeSubscription = catchAsync(async (req: Request, res: Response) => {
  const vendorId = req.user.id;
  const { tier } = req.body;
  const result = await SubscriptionServices.upgradeSubscription(vendorId, tier);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Subscription upgraded to ${tier}`,
    data: result,
  });
});

const cancelSubscription = catchAsync(async (req: Request, res: Response) => {
  const vendorId = req.user.id;
  const { reason } = req.body;
  const result = await SubscriptionServices.cancelSubscription(vendorId, reason);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription cancelled',
    data: result,
  });
});

// Admin routes
const getAllSubscriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionServices.getAllSubscriptions(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscriptions retrieved',
    data: result,
  });
});

const createPlan = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionServices.createPlan(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Subscription plan created',
    data: result,
  });
});

const updatePlan = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SubscriptionServices.updatePlan(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan updated',
    data: result,
  });
});

const getPlans = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionServices.getPlans();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Plans retrieved',
    data: result,
  });
});

// Webhook (placeholder for Stripe/PayPal)
const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  const result = await SubscriptionServices.handleWebhook(req.body, signature);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Webhook processed',
    data: result,
  });
});

export const SubscriptionController = {
  getMySubscription,
  updatePaymentMethod,
  upgradeSubscription,
  cancelSubscription,
  getAllSubscriptions,
  createPlan,
  updatePlan,
  getPlans,
  handleWebhook,
};