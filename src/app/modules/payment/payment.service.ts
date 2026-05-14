import Stripe from 'stripe';
import httpStatus from 'http-status';
import { PaymentStatus, PaymentType } from '@prisma/client';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import stripe from '../../utils/stripe';
import config from '../../../config';

// Stripe basil API compat:
// current_period_end / cancel_at / cancel_at_period_end were removed from the
// Subscription type definitions in the basil API, but still exist at runtime.
// This interface re-declares them for type-safe access without scattering `any`.
interface StripeSubscriptionCompat extends Stripe.Subscription {
  current_period_end: number;
  cancel_at_period_end: boolean;
  cancel_at: number | null;
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPriceIds = async (): Promise<{ essentialPriceId: string; unlimitedPriceId: string }> => {
  const [essential, unlimited] = await Promise.all([
    prisma.storePaymentInfo.findUnique({ where: { key: 'STRIPE_ESSENTIAL_PRICE_ID' } }),
    prisma.storePaymentInfo.findUnique({ where: { key: 'STRIPE_UNLIMITED_PRICE_ID' } }),
  ]);

  if (!essential?.value || !unlimited?.value) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Stripe products not yet initialized. Please contact support.',
    );
  }

  return { essentialPriceId: essential.value, unlimitedPriceId: unlimited.value };
};

/** Find or create a Stripe Customer for a user. Caches the ID in the Payment table. */
const getOrCreateStripeCustomer = async (userId: string): Promise<string> => {
  // Re-use existing customer ID if we have one
  const existing = await prisma.payment.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
    select: { stripeCustomerId: true },
    orderBy: { createdAt: 'desc' },
  });
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, fullName: true },
  });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const customer = await stripe.customers.create({
    email: user.email!,
    name: user.fullName ?? undefined,
    metadata: { userId },
  });

  return customer.id;
};

// ─── Public service methods ────────────────────────────────────────────────────

export type ProductType = 'essential_will' | 'unlimited_legacy';

/**
 * Create a Stripe Checkout Session.
 * Returns { sessionUrl, sessionId }.
 */
const createCheckoutSession = async (userId: string, productType: ProductType) => {
  const { essentialPriceId, unlimitedPriceId } = await getPriceIds();

  const isSubscription = productType === 'unlimited_legacy';
  const priceId = isSubscription ? unlimitedPriceId : essentialPriceId;

  // Guard: no double purchases
  if (!isSubscription) {
    const paid = await prisma.payment.findFirst({
      where: { userId, productId: 'essential_will', status: PaymentStatus.SUCCEEDED },
    });
    if (paid) throw new ApiError(httpStatus.BAD_REQUEST, 'You have already purchased the Essential Will.');
  }

  if (isSubscription) {
    const activeSub = await prisma.payment.findFirst({
      where: {
        userId,
        productId: 'unlimited_legacy',
        status: PaymentStatus.SUCCEEDED,
        stripeSubscriptionId: { not: null },
      },
    });
    if (activeSub) throw new ApiError(httpStatus.BAD_REQUEST, 'You already have an active Unlimited Legacy subscription.');
  }

  const [customerId, will] = await Promise.all([
    getOrCreateStripeCustomer(userId),
    prisma.will.findUnique({ where: { userId }, select: { id: true } }),
  ]);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: isSubscription ? 'subscription' : 'payment',
    success_url: `${config.stripe.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: config.stripe.cancelUrl,
    allow_promotion_codes: true,
    metadata: {
      userId,
      productId: productType,
      willId: will?.id ?? '',
    },
    ...(isSubscription && {
      subscription_data: {
        metadata: { userId, productId: productType },
      },
    }),
  });

  // Persist a PENDING record so we can reconcile on webhook
  await prisma.payment.create({
    data: {
      userId,
      stripeCustomerId: customerId,
      amount: isSubscription ? 144 : 88,
      currency: 'usd',
      status: PaymentStatus.PENDING,
      type: isSubscription ? PaymentType.SUBSCRIPTION : PaymentType.ONE_TIME,
      productId: productType,
      metadata: { sessionId: session.id, willId: will?.id ?? null },
    },
  });

  return { sessionUrl: session.url, sessionId: session.id };
};

/** Return the user's purchase / subscription status. */
const getPaymentStatus = async (userId: string) => {
  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const essentialWill = payments.find(
    p => p.productId === 'essential_will' && p.status === PaymentStatus.SUCCEEDED,
  );

  const activeSubscription = payments.find(
    p =>
      p.productId === 'unlimited_legacy' &&
      p.status === PaymentStatus.SUCCEEDED &&
      p.stripeSubscriptionId,
  );

  let subscriptionDetails: {
    status: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  } | null = null;

  if (activeSubscription?.stripeSubscriptionId) {
    try {
      // Cast to Stripe.Subscription — Stripe.Response<T> wraps T but the basil
      // API version shifts the inferred generic, while the runtime shape is identical.
      const sub = (await stripe.subscriptions.retrieve(
        activeSubscription.stripeSubscriptionId,
      )) as unknown as StripeSubscriptionCompat;

      subscriptionDetails = {
        status: sub.status,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      };
    } catch {
      // Subscription may have been deleted directly in Stripe dashboard
    }
  }

  return {
    hasEssentialWill: !!essentialWill,
    hasUnlimitedLegacy: !!activeSubscription,
    essentialWillPurchasedAt: essentialWill?.createdAt ?? null,
    canDownloadWill: !!essentialWill || !!activeSubscription,
    subscription: subscriptionDetails,
    recentPayments: payments.slice(0, 5).map(p => ({
      id: p.id,
      productId: p.productId,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      type: p.type,
      createdAt: p.createdAt,
    })),
  };
};

/** Open the Stripe Customer Portal so users can manage billing themselves. */
const createCustomerPortalSession = async (userId: string) => {
  const record = await prisma.payment.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
    select: { stripeCustomerId: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!record?.stripeCustomerId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No billing account found for this user.');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: record.stripeCustomerId,
    return_url: `${config.base_url_client}/dashboard/billing`,
  });

  return { url: session.url };
};

/**
 * Cancel the active Unlimited Legacy subscription.
 * Cancels at period end (user keeps access until billing cycle ends).
 */
const cancelSubscription = async (userId: string) => {
  const record = await prisma.payment.findFirst({
    where: {
      userId,
      productId: 'unlimited_legacy',
      status: PaymentStatus.SUCCEEDED,
      stripeSubscriptionId: { not: null },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record?.stripeSubscriptionId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No active subscription found.');
  }

  const sub = (await stripe.subscriptions.update(record.stripeSubscriptionId, {
    cancel_at_period_end: true,
  })) as unknown as StripeSubscriptionCompat;

  const cancelAt = sub.cancel_at ? new Date(sub.cancel_at * 1000) : null;

  return {
    message: 'Your subscription will be cancelled at the end of the current billing period.',
    cancelAt,
  };
};

/** Retrieve a completed session (used on the success page). */
const getSessionDetails = async (sessionId: string, userId: string) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent', 'subscription'],
  });

  // Ensure this session belongs to the requesting user
  if (session.metadata?.userId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied.');
  }

  return {
    status: session.payment_status,
    productId: session.metadata?.productId,
    amountTotal: session.amount_total ? session.amount_total / 100 : null,
    currency: session.currency,
  };
};

// ─── Webhook event handlers ────────────────────────────────────────────────────

const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
  const { userId, productId, willId } = session.metadata ?? {};
  if (!userId || !productId) {
    console.warn('[Webhook] checkout.session.completed: missing metadata', session.id);
    return;
  }

  const isSubscription = productId === 'unlimited_legacy';

  // Update the pending payment record
  await prisma.payment.updateMany({
    where: { userId, productId, status: PaymentStatus.PENDING },
    data: {
      status: PaymentStatus.SUCCEEDED,
      stripePaymentIntentId: !isSubscription ? (session.payment_intent as string | null) : null,
      stripeSubscriptionId: isSubscription ? (session.subscription as string | null) : null,
    },
  });

  // Mark will as paid so the download gate can check this
  if (willId) {
    await prisma.storePaymentInfo.upsert({
      where: { key: `WILL_PAID_${userId}` },
      update: { value: 'true', name: willId },
      create: { key: `WILL_PAID_${userId}`, value: 'true', name: willId },
    });
  }

  console.log(`[Webhook] Payment succeeded for user ${userId}, product: ${productId}`);
};

const handleSubscriptionUpdated = async (subscription: any) => {
  const { userId } = subscription.metadata ?? {};
  if (!userId) return;

  const statusMap: Record<string, PaymentStatus> = {
    active: PaymentStatus.SUCCEEDED,
    past_due: PaymentStatus.FAILED,
    canceled: PaymentStatus.REFUNDED,
    unpaid: PaymentStatus.FAILED,
    incomplete: PaymentStatus.PENDING,
    incomplete_expired: PaymentStatus.FAILED,
    trialing: PaymentStatus.SUCCEEDED,
    paused: PaymentStatus.PENDING,
  };

  const status = statusMap[subscription.status] ?? PaymentStatus.FAILED;

  await prisma.payment.updateMany({
    where: { userId, stripeSubscriptionId: subscription.id },
    data: { status },
  });

  console.log(`[Webhook] Subscription ${subscription.id} updated → ${subscription.status}`);
};

const handleSubscriptionDeleted = async (subscription: Stripe.Subscription) => {
  const { userId } = subscription.metadata ?? {};

  await prisma.payment.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: PaymentStatus.REFUNDED },
  });

  console.log(`[Webhook] Subscription ${subscription.id} deleted (userId: ${userId})`);
};

const handlePaymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent) => {
  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { status: PaymentStatus.SUCCEEDED },
  });
};

const handlePaymentIntentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { status: PaymentStatus.FAILED },
  });
};

const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice) => {
  // In the Stripe basil API, invoice.subscription was moved to
  // invoice.parent.subscription_details.subscription. Support both shapes.
  const rawInvoice = invoice as any;
  const subscriptionId: string | null =
    rawInvoice.subscription ??
    rawInvoice.parent?.subscription_details?.subscription ??
    null;

  if (!subscriptionId) return;

  await prisma.payment.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: PaymentStatus.FAILED },
  });

  console.warn(`[Webhook] Invoice payment failed for subscription ${subscriptionId}`);
};

const handleChargeRefunded = async (charge: Stripe.Charge) => {
  const paymentIntentId = charge.payment_intent as string | null;
  if (!paymentIntentId) return;

  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: paymentIntentId },
    data: { status: PaymentStatus.REFUNDED },
  });
};

export const PaymentService = {
  createCheckoutSession,
  getPaymentStatus,
  createCustomerPortalSession,
  cancelSubscription,
  getSessionDetails,
  // Webhook handlers
  handleCheckoutSessionCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handleInvoicePaymentFailed,
  handleChargeRefunded,
};