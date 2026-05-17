import Stripe from 'stripe';
import config from '../../config';
import prisma from '../../shared/prisma';

const stripe = new Stripe(config.stripe.secretKey);

// ─── Keys used in storePaymentInfo table ───────────────────────────────────────
const KEYS = {
  essentialPriceId: 'stripe_essential_will_price_id',
  unlimitedPriceId: 'stripe_unlimited_legacy_price_id',
} as const;

/**
 * Ensures required Stripe products and prices exist, then persists their IDs
 * into the storePaymentInfo table and config.stripe so the rest of the app
 * can use them immediately.
 *
 * Safe to call on every startup — it is fully idempotent.
 */
export const initializeStripeProducts = async () => {
  try {
    const essentialPriceId = await ensureEssentialWillPrice();
    const unlimitedPriceId = await ensureUnlimitedLegacyPrice();

    // Make IDs available in-process for payment.service.ts
    config.stripe.essentialPriceId = essentialPriceId;
    config.stripe.unlimitedPriceId = unlimitedPriceId;

    console.log('✅ Stripe products initialized');
    console.log(`   Essential Will price:   ${essentialPriceId}`);
    console.log(`   Unlimited Legacy price: ${unlimitedPriceId}`);

    return { essentialPriceId, unlimitedPriceId };
  } catch (error) {
    console.error('❌ Failed to initialize Stripe products:', error);
    throw error;
  }
};

// ─── Essential Will — SGD 88 one-time ─────────────────────────────────────────

const ensureEssentialWillPrice = async (): Promise<string> => {
  // 1. Check DB first (survives restarts)
  const stored = await prisma.storePaymentInfo.findUnique({
    where: { key: KEYS.essentialPriceId },
  });
  if (stored?.value) {
    try {
      const price = await stripe.prices.retrieve(stored.value);
      if (price.active) return price.id;
    } catch {
      // Price deleted from Stripe — recreate below
    }
  }

  // 2. Find or create product
  const productList = await stripe.products.list({ limit: 100, active: true });
  let product = productList.data.find(p => p.name === 'Essential Will');

  if (!product) {
    product = await stripe.products.create({
      name: 'Essential Will',
      description: 'One-time payment for a legally valid will',
    });
    console.log('✅ Created Essential Will product in Stripe');
  }

  // 3. Find or create one-time SGD 88 price
  const priceList = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  let price = priceList.data.find(
    p => p.type === 'one_time' && p.unit_amount === 8800 && p.currency === 'sgd',
  );

  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: 8800,    // SGD 88.00
      currency: 'sgd',
      nickname: 'Essential Will — SGD 88 one-time',
    });
    console.log('✅ Created Essential Will price (SGD 88 one-time)');
  }

  // 4. Persist to DB
  await prisma.storePaymentInfo.upsert({
    where: { key: KEYS.essentialPriceId },
    update: { value: price.id, name: 'Essential Will Price ID' },
    create: { key: KEYS.essentialPriceId, value: price.id, name: 'Essential Will Price ID' },
  });

  return price.id;
};

// ─── Unlimited Legacy — SGD 144/year (SGD 12/month, billed annually) ──────────

const ensureUnlimitedLegacyPrice = async (): Promise<string> => {
  // 1. Check DB first
  const stored = await prisma.storePaymentInfo.findUnique({
    where: { key: KEYS.unlimitedPriceId },
  });
  if (stored?.value) {
    try {
      const price = await stripe.prices.retrieve(stored.value);
      if (price.active) return price.id;
    } catch {
      // Price deleted — recreate below
    }
  }

  // 2. Find or create product
  const productList = await stripe.products.list({ limit: 100, active: true });
  let product = productList.data.find(p => p.name === 'Unlimited Legacy');

  if (!product) {
    product = await stripe.products.create({
      name: 'Unlimited Legacy',
      description: 'Annual subscription — unlimited will revisions and digital asset memo',
    });
    console.log('✅ Created Unlimited Legacy product in Stripe');
  }

  // 3. Find or create annual SGD 144 recurring price
  const priceList = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  let price = priceList.data.find(
    p =>
      p.recurring?.interval === 'year' &&
      p.unit_amount === 14400 &&     // SGD 144.00/year
      p.currency === 'sgd',
  );

  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: 14400,            // SGD 144.00 billed annually
      currency: 'sgd',
      recurring: { interval: 'year' },
      nickname: 'Unlimited Legacy — SGD 12/month billed annually',
    });
    console.log('✅ Created Unlimited Legacy price (SGD 144/year)');
  }

  // 4. Persist to DB
  await prisma.storePaymentInfo.upsert({
    where: { key: KEYS.unlimitedPriceId },
    update: { value: price.id, name: 'Unlimited Legacy Price ID' },
    create: { key: KEYS.unlimitedPriceId, value: price.id, name: 'Unlimited Legacy Price ID' },
  });

  return price.id;
};

export default stripe;