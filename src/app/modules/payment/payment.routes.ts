import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PaymentController } from './payment.controller';
import { paymentValidation } from './payment.validation';

const router = express.Router();

// ─── Stripe Webhook ───────────────────────────────────────────────────────────
// CRITICAL: This route must use express.raw() to receive the raw body.
// Stripe signature verification will fail if the body is parsed as JSON first.
// Register this route BEFORE any global express.json() middleware in app.ts.
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.stripeWebhook,
);

// ─── Checkout ─────────────────────────────────────────────────────────────────

/** POST /api/v1/payments/checkout/essential-will
 * Body: { successUrl: string, cancelUrl: string }
 * Returns: { checkoutUrl: string, sessionId: string }
 */
router.post(
  '/checkout/essential-will',
  auth(),
  validateRequest(paymentValidation.checkoutSchema),
  PaymentController.checkoutEssentialWill,
);

/** POST /api/v1/payments/checkout/unlimited-legacy
 * Body: { successUrl: string, cancelUrl: string }
 * Returns: { checkoutUrl: string, sessionId: string }
 */
router.post(
  '/checkout/unlimited-legacy',
  auth(),
  validateRequest(paymentValidation.checkoutSchema),
  PaymentController.checkoutUnlimitedLegacy,
);

// ─── Subscription Management ──────────────────────────────────────────────────

/** GET /api/v1/payments/subscription
 * Returns current tier, expiry, and payment history.
 */
router.get('/subscription', auth(), PaymentController.getSubscriptionStatus);

/** DELETE /api/v1/payments/subscription
 * Schedules cancellation at period end.
 */
router.delete('/subscription', auth(), PaymentController.cancelSubscription);

/** POST /api/v1/payments/subscription/reactivate
 * Undoes a scheduled cancellation.
 */
router.post('/subscription/reactivate', auth(), PaymentController.reactivateSubscription);

export const PaymentRoutes = router;