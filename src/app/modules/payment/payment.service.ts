import Stripe from 'stripe';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiErrors';
import prisma from '../../../shared/prisma';
import config from '../../../config';

const getStripe = () =>
  new Stripe(config.stripe.secretKey);

// ─── Product Catalogue ─────────────────────────────────────────────────────────
// Amounts and currency match the UI (SGD).
// Price IDs are populated at startup by initializeStripeProducts() in app/utils/stripe.ts

const ESSENTIAL_WILL = {
  productId: 'essential_will',
  name: 'Essential Will',
  amount: 8800,         // SGD 88.00 in cents
  displayAmount: 88,    // Stored in Payment record
  currency: 'sgd',
  type: 'ONE_TIME' as const,
  accessDays: 30,       // 30-day revision window shown in UI
};

const UNLIMITED_LEGACY = {
  productId: 'unlimited_legacy',
  name: 'Unlimited Legacy',
  amount: 14400,        // SGD 144.00/year (SGD 12 × 12) in cents
  displayAmount: 144,
  currency: 'sgd',
  type: 'SUBSCRIPTION' as const,
};

// ─── Customer Helpers ──────────────────────────────────────────────────────────

/**
 * Reuses the saved stripeCustomerId on the User row.
 * Creates a new Stripe Customer if one doesn't exist or was deleted.
 */
const getOrCreateStripeCustomer = async (userId: string): Promise<string> => {
  const stripe = getStripe();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, stripeCustomerId: true },
  });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  if (user.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(user.stripeCustomerId);
      if (!existing.deleted) return existing.id;
    } catch {
      // Deleted from Stripe — fall through and create a fresh one
    }
  }

  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    name: user.fullName ?? undefined,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
};

// ─── Checkout Sessions ─────────────────────────────────────────────────────────

/**
 * Essential Will — SGD 88 one-time payment.
 * Uses inline price_data so no pre-created Stripe price is needed.
 */
const createEssentialWillCheckout = async (
  userId: string,
  successUrl: string,
  cancelUrl: string,
) => {
  const stripe = getStripe();

  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const alreadyPaid = await prisma.payment.findFirst({
    where: { userId, productId: ESSENTIAL_WILL.productId, status: 'SUCCEEDED' },
  });
  if (alreadyPaid) throw new ApiError(httpStatus.BAD_REQUEST, 'Essential Will already purchased');

  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: ESSENTIAL_WILL.currency,
          unit_amount: ESSENTIAL_WILL.amount,
          product_data: {
            name: ESSENTIAL_WILL.name,
            description: 'A meticulously crafted self-customed will for your estate and final intentions',
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      metadata: { userId, productId: ESSENTIAL_WILL.productId, willId: will.id },
    },
    metadata: { userId, productId: ESSENTIAL_WILL.productId, willId: will.id },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  // Persist a PENDING record; the webhook will mark it SUCCEEDED
  await prisma.payment.create({
    data: {
      userId,
      stripeCustomerId: customerId,
      amount: ESSENTIAL_WILL.displayAmount,
      currency: ESSENTIAL_WILL.currency,
      status: 'PENDING',
      type: 'ONE_TIME',
      productId: ESSENTIAL_WILL.productId,
      metadata: { sessionId: session.id, willId: will.id },
    },
  });

  return { checkoutUrl: session.url, sessionId: session.id };
};

/**
 * Unlimited Legacy — SGD 12/month billed annually (SGD 144/year).
 * Uses the price ID that initializeStripeProducts() stored in config.stripe.unlimitedPriceId.
 */
const createUnlimitedLegacyCheckout = async (
  userId: string,
  successUrl: string,
  cancelUrl: string,
) => {
  const stripe = getStripe();

  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const activeSub = await prisma.payment.findFirst({
    where: { userId, productId: UNLIMITED_LEGACY.productId, status: 'SUCCEEDED' },
  });
  if (activeSub) throw new ApiError(httpStatus.BAD_REQUEST, 'Unlimited Legacy subscription already active');

  // Price ID is set at startup by initializeStripeProducts()
  const priceId = config.stripe.unlimitedPriceId;
  if (!priceId) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Stripe products not initialized yet — please try again in a moment',
    );
  }

  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: { userId, productId: UNLIMITED_LEGACY.productId, willId: will.id },
    },
    metadata: { userId, productId: UNLIMITED_LEGACY.productId, willId: will.id },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return { checkoutUrl: session.url, sessionId: session.id };
};

// ─── Subscription Management ───────────────────────────────────────────────────

/** Returns tier, expiry, active status, and full payment history. */
const getSubscriptionStatus = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, subscriptionExpiresAt: true },
  });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const isExpired = user.subscriptionExpiresAt && user.subscriptionExpiresAt < new Date();

  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return {
    tier: isExpired ? 'FREE' : user.subscriptionTier,
    expiresAt: user.subscriptionExpiresAt,
    isActive: user.subscriptionTier === 'PREMIUM' && !isExpired,
    payments,
  };
};

/** Schedule cancellation at end of billing period. User keeps access until then. */
const cancelSubscription = async (userId: string) => {
  const stripe = getStripe();

  const payment = await prisma.payment.findFirst({
    where: { userId, productId: UNLIMITED_LEGACY.productId, status: 'SUCCEEDED' },
  });
  if (!payment?.stripeSubscriptionId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No active Unlimited Legacy subscription found');
  }

  const subscription = await stripe.subscriptions.update(payment.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  return {
    message: 'Subscription will be cancelled at the end of the current billing period',
    cancelAt: new Date(subscription.cancel_at! * 1000),
  };
};

/** Undo a scheduled cancellation. */
const reactivateSubscription = async (userId: string) => {
  const stripe = getStripe();

  const payment = await prisma.payment.findFirst({
    where: { userId, productId: UNLIMITED_LEGACY.productId, status: 'SUCCEEDED' },
  });
  if (!payment?.stripeSubscriptionId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No subscription found');
  }

  await stripe.subscriptions.update(payment.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  return { message: 'Subscription reactivated successfully' };
};

// ─── Webhook Entry Point ───────────────────────────────────────────────────────

/**
 * Called by stripe.webhook.ts.
 * rawBody MUST be the untouched Buffer from express.raw() — parsed JSON will
 * break Stripe's signature verification.
 */
const handleWebhook = async (rawBody: Buffer, signature: string) => {
  const stripe = getStripe();
let event: ReturnType<typeof stripe.webhooks.constructEvent>;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
  } catch (err: any) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Webhook signature verification failed: ${err.message}`,
    );
  }

  console.log(`[Stripe] Event: ${event.type} (${event.id})`);

  switch (event.type) {
    case 'checkout.session.completed':
      await onCheckoutSessionCompleted(event.data.object);
      break;
    case 'payment_intent.succeeded':
      await onPaymentIntentSucceeded(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await onPaymentIntentFailed(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await onInvoicePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await onInvoicePaymentFailed(event.data.object);
      break;
    case 'customer.subscription.updated':
      await onSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await onSubscriptionDeleted(event.data.object);
      break;
    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }

  return { received: true };
};

// ─── Webhook Event Handlers ────────────────────────────────────────────────────

const onCheckoutSessionCompleted = async (session:any) => {
  const stripe = getStripe();
  const { userId, productId, willId } = session.metadata ?? {};
  if (!userId || !productId) return;

  // ── Essential Will (one-time) ─────────────────────────────────────────────
  if (session.mode === 'payment') {
    const paymentIntentId = session.payment_intent as string;

    await prisma.payment.updateMany({
      where: { userId, productId, status: 'PENDING' },
      data: { stripePaymentIntentId: paymentIntentId, status: 'SUCCEEDED' },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ESSENTIAL_WILL.accessDays);

    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: 'PREMIUM', subscriptionExpiresAt: expiresAt },
    });

    if (willId) {
      await prisma.will.update({ where: { id: willId }, data: { status: 'COMPLETED' } });
    }

    console.log(
      `[Payment] Essential Will purchased — user ${userId}, access until ${expiresAt.toISOString()}`,
    );
  }

  // ── Unlimited Legacy (subscription) ──────────────────────────────────────
  if (session.mode === 'subscription') {
    const subscriptionId = session.subscription as string;
    // const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subscription = await stripe.subscriptions.retrieve(
  subscriptionId
) as any

    await prisma.payment.upsert({
      where: { stripeSubscriptionId: subscriptionId },
      update: { status: 'SUCCEEDED' },
      create: {
        userId,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: session.customer as string,
        amount: UNLIMITED_LEGACY.displayAmount,
        currency: UNLIMITED_LEGACY.currency,
        status: 'SUCCEEDED',
        type: 'SUBSCRIPTION',
        productId: UNLIMITED_LEGACY.productId,
        metadata: { sessionId: session.id, willId },
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'PREMIUM',
        subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
      },
    });

    console.log(`[Payment] Unlimited Legacy started — user ${userId}`);
  }
};

const onPaymentIntentSucceeded = async (pi: any) => {
  // Belt-and-suspenders: checkout.session.completed usually fires first
  const { userId, productId } = pi.metadata ?? {};
  if (!userId || !productId) return;

  await prisma.payment.updateMany({
    where: { userId, productId, stripePaymentIntentId: pi.id },
    data: { status: 'SUCCEEDED' },
  });
};

const onPaymentIntentFailed = async (pi:any) => {
  const { userId, productId } = pi.metadata ?? {};
  if (!userId || !productId) return;

  await prisma.payment.updateMany({
    where: { userId, productId, stripePaymentIntentId: pi.id },
    data: { status: 'FAILED' },
  });
};

const onInvoicePaymentSucceeded = async (invoice: any) => {
  const stripe = getStripe();
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  // const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const subscription = await stripe.subscriptions.retrieve(
  subscriptionId
) as any

  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: 'PREMIUM',
      subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
    },
  });

  await prisma.payment.updateMany({
    where: { userId, stripeSubscriptionId: subscriptionId },
    data: { status: 'SUCCEEDED' },
  });

  console.log(`[Payment] Subscription renewed — user ${userId}`);
};

const onInvoicePaymentFailed = async (invoice: any) => {
  const stripe = getStripe();
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  // Don't downgrade yet — Stripe retries automatically.
  // Downgrade happens in onSubscriptionDeleted after all retries are exhausted.
  await prisma.payment.updateMany({
    where: { userId, stripeSubscriptionId: subscriptionId },
    data: { status: 'FAILED' },
  });

  console.log(`[Payment] Invoice failed — user ${userId} (Stripe will retry)`);
};

const onSubscriptionUpdated = async (subscription: any) => {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  if (subscription.status === 'active') {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'PREMIUM',
        subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  if (subscription.cancel_at_period_end) {
    console.log(
      `[Payment] Cancellation scheduled — user ${userId}, ends ${new Date(subscription.cancel_at! * 1000).toISOString()}`,
    );
  }
};

const onSubscriptionDeleted = async (subscription:any) => {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { subscriptionTier: 'FREE', subscriptionExpiresAt: null },
  });

  await prisma.payment.updateMany({
    where: { userId, stripeSubscriptionId: subscription.id },
    data: { status: 'REFUNDED' },
  });

  console.log(`[Payment] Subscription deleted — user ${userId} downgraded to FREE`);
};

// ─── Exports ───────────────────────────────────────────────────────────────────

export const PaymentService = {
  createEssentialWillCheckout,
  createUnlimitedLegacyCheckout,
  getSubscriptionStatus,
  cancelSubscription,
  reactivateSubscription,
  handleWebhook,
};