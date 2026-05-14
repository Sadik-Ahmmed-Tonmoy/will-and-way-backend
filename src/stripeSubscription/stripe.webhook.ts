import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import httpStatus from 'http-status';
import stripe from '../app/utils/stripe';
import config from '../config';
import { PaymentService } from '../app/modules/payment/payment.service';

const router = express.Router();

/**
 * POST /payment-webhook
 *
 * Must be mounted BEFORE express.json() in app.ts with a raw body parser:
 *   app.use('/payment-webhook', express.raw({ type: 'application/json' }), WebhookRoutes);
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.warn('[Webhook] Missing stripe-signature header');
    res.status(httpStatus.BAD_REQUEST).json({ error: 'Missing Stripe signature' });
    return;
  }

  let event: Stripe.Event;
console.log("webhook:",config.stripe.webhookSecret);
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
  } catch (err: any) {
    console.error('[Webhook] Signature verification failed:', err.message);
    res.status(httpStatus.BAD_REQUEST).json({ error: `Webhook signature error: ${err.message}` });
    return;
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await PaymentService.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'payment_intent.succeeded':
        await PaymentService.handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case 'payment_intent.payment_failed':
        await PaymentService.handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case 'charge.refunded':
        await PaymentService.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await PaymentService.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'customer.subscription.deleted':
        await PaymentService.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'invoice.payment_failed':
        await PaymentService.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_succeeded':
        console.log('[Webhook] Invoice renewed:', (event.data.object as Stripe.Invoice).id);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    console.error(`[Webhook] Handler error for ${event.type}:`, err.message);
    // 500 tells Stripe to retry the event
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Webhook handler failed' });
    return;
  }

  res.status(httpStatus.OK).json({ received: true });
});

export const WebhookRoutes = router;