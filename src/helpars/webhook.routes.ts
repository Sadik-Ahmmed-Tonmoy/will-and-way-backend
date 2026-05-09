import express from 'express';
import Stripe from 'stripe';
import config from '../config';
import stripe from './stripe/stripe';
// import { CaptainService } from '../app/modules/Captain/captain.service';
// import { BookingService } from '../app/modules/Bookings/bookings.service';

const router = express.Router();

router.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;
    try {
      event = stripe?.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret as string) as Stripe.Event;

      // event = stripe?.webhooks.constructEvent(
      //   req.body,
      //   sig,
      //   config.stripe.webhookSecret as string,
      // );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Webhook signature verification failed: ${errorMessage}`);
      res.status(400).send(`Webhook Error: ${errorMessage}`);
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      try {
        const paymentIntent = await stripe?.paymentIntents.retrieve(
          session.payment_intent as string
        );

        const metadata = session.metadata || {};

        if (metadata.type === 'captain_hire') {
          // Captain hire flow
          // const hire = await CaptainService.handleSuccessfulCaptainPayment(session);
          // console.log(`✅ Captain hire created: ${hire.id}`);
        } else {
          // Default to booking flow
          // const booking = await BookingService.handleSuccessfulPayment(
          //   session,
          //   // paymentIntent.id // pass paymentIntentId
          // );
          // console.log(`✅ Booking created: ${booking.id}`);
        }
      } catch (error) {
        console.error('Error processing successful payment:', error);
        // Still return 200 to acknowledge receipt
      }
    }

    res.json({ received: true });
  }
);

export const WebhookRoutes = router;