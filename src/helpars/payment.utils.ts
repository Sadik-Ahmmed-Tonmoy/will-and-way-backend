
import config from '../config';
import stripe from './stripe/stripe';

// export const stripe = new Stripe(config.stripe.stripe_secret_key as string, {
//  apiVersion: '2025-08-27.basil'
// });



export const createCheckoutSession = async (
  customerId: string | null,
  amount: number,
  quantity: number,
  userId: string,
  metadata: any,
) => {
  const lineItems = Array.from({ length: quantity }).map(() => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: 'Service Payment',
        description: 'Payment for Alturki services',
      },
      unit_amount: Math.round(amount * 100 / quantity), // per item amount in cents
    },
    quantity: 1,
  }));

  const session = await stripe?.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer: customerId || undefined,
    line_items: lineItems,
    success_url: `${config.base_url_client}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.base_url_client}/payment/cancel`,
    metadata: {
      userId,
      amount: amount.toString(),
      quantity: quantity.toString(),
      ...metadata,
    },
  });

  return session;
};