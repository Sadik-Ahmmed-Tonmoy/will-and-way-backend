import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PaymentController } from './payment.controller';
import { paymentValidation } from './payment.validation';

const router = express.Router();

/**
 * POST /api/v1/payments/checkout
 * Body: { productType: 'essential_will' | 'unlimited_legacy' }
 * Returns: { sessionUrl, sessionId }
 * Frontend should redirect to sessionUrl.
 */

router.post(
  '/checkout',
  auth(),
  validateRequest(paymentValidation.createCheckoutSessionSchema),
  PaymentController.createCheckoutSession,
);

// router.post(
//   "/checkout",
//   (req, res, next) => {
//     console.log(req.body, "ssssssssssssssssssss");
//     next();
//   },
//   validateRequest(paymentValidation.createCheckoutSessionSchema),
//   PaymentController.createCheckoutSession
// );

/**
 * GET /api/v1/payments/status
 * Returns purchase/subscription status for the authenticated user.
 */
router.get('/status', auth(), PaymentController.getPaymentStatus);

/**
 * GET /api/v1/payments/session?sessionId=cs_xxx
 * Used on the success page to confirm what was purchased.
 */
router.get('/session', auth(), PaymentController.getSessionDetails);

/**
 * POST /api/v1/payments/portal
 * Opens a Stripe Billing Portal session so users can manage their subscription.
 */
router.post('/portal', auth(), PaymentController.createCustomerPortalSession);

/**
 * DELETE /api/v1/payments/subscription
 * Cancel active Unlimited Legacy subscription (cancels at period end).
 */
router.delete('/subscription', auth(), PaymentController.cancelSubscription);

export const PaymentRoutes = router;