import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { PaymentService } from './payment.service';

// ─── Checkout ─────────────────────────────────────────────────────────────────

const checkoutEssentialWill = catchAsync(async (req: Request, res: Response) => {
  const { successUrl, cancelUrl } = req.body;
  const result = await PaymentService.createEssentialWillCheckout(
    req.user.id,
    successUrl,
    cancelUrl,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Checkout session created',
    data: result,
  });
});

const checkoutUnlimitedLegacy = catchAsync(async (req: Request, res: Response) => {
  const { successUrl, cancelUrl } = req.body;
  const result = await PaymentService.createUnlimitedLegacyCheckout(
    req.user.id,
    successUrl,
    cancelUrl,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Checkout session created',
    data: result,
  });
});

// ─── Subscription Management ──────────────────────────────────────────────────

const getSubscriptionStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getSubscriptionStatus(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription status fetched',
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

const reactivateSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.reactivateSubscription(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

// ─── Stripe Webhook ───────────────────────────────────────────────────────────

/**
 * This route MUST receive the raw body — see payment.routes.ts.
 * Do NOT run express.json() on this endpoint.
 */
const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    res.status(httpStatus.BAD_REQUEST).json({ message: 'Missing stripe-signature header' });
    return;
  }

  const result = await PaymentService.handleWebhook(req.body as Buffer, signature);
  res.status(httpStatus.OK).json(result);
});

export const PaymentController = {
  checkoutEssentialWill,
  checkoutUnlimitedLegacy,
  getSubscriptionStatus,
  cancelSubscription,
  reactivateSubscription,
  stripeWebhook,
};