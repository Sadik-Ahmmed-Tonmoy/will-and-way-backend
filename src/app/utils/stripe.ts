import Stripe from 'stripe';
import config from '../../config';
import prisma from '../../shared/prisma';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
});


export default stripe;

// ─── Product / Price helpers ──────────────────────────────────────────────────

async function findOrCreateProduct(name: string, description: string): Promise<Stripe.Product> {
  const list = await stripe.products.list({ limit: 100, active: true });
  const existing = list.data.find(p => p.name === name);
  if (existing) return existing;

  const created = await stripe.products.create({ name, description });
  console.log(`✅ Created Stripe product: ${name}`);
  return created;
}

async function findOrCreateOneTimePrice(
  productId: string,
  unitAmount: number,
  currency: string,
  nickname: string,
): Promise<Stripe.Price> {
  const list = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const existing = list.data.find(
    p => p.type === 'one_time' && p.unit_amount === unitAmount && p.currency === currency,
  );
  if (existing) return existing;

  const created = await stripe.prices.create({
    product: productId,
    unit_amount: unitAmount,
    currency,
    nickname,
  });
  console.log(`✅ Created one-time price: ${nickname} (${unitAmount / 100} ${currency})`);
  return created;
}

async function findOrCreateAnnualPrice(
  productId: string,
  unitAmount: number,
  currency: string,
  nickname: string,
): Promise<Stripe.Price> {
  const list = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const existing = list.data.find(
    p =>
      p.recurring?.interval === 'year' &&
      p.unit_amount === unitAmount &&
      p.currency === currency,
  );
  if (existing) return existing;

  const created = await stripe.prices.create({
    product: productId,
    unit_amount: unitAmount,
    currency,
    recurring: { interval: 'year' },
    nickname,
  });
  console.log(`✅ Created annual price: ${nickname} ($${unitAmount / 100}/year)`);
  return created;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Idempotent — safe to call on every server startup.
 * Creates Stripe products/prices if they don't exist, then caches their IDs in the DB.
 */
export const initializeStripeProducts = async (): Promise<void> => {
  try {
    // ── Essential Will — one-time $88 ────────────────────────────────────────
    const essentialProduct = await findOrCreateProduct(
      'Essential Will',
      'A meticulously crafted self-customed will for your estate and final intentions',
    );

    const essentialPrice = await findOrCreateOneTimePrice(
      essentialProduct.id,
      8800,   // $88.00 in cents
      'usd',
      'Essential Will – One Time',
    );

    // ── Unlimited Legacy — annual subscription ($144/year = $12/month) ───────
    const unlimitedProduct = await findOrCreateProduct(
      'Unlimited Legacy',
      'A living document for those whose lives, assets, and families are in beautiful state of growth',
    );

    const unlimitedPrice = await findOrCreateAnnualPrice(
      unlimitedProduct.id,
      14400,  // $144.00/year in cents
      'usd',
      'Unlimited Legacy – Annual ($12/month)',
    );

    // ── Persist IDs to DB so services can read them at runtime ───────────────
    await Promise.all([
      prisma.storePaymentInfo.upsert({
        where: { key: 'STRIPE_ESSENTIAL_PRICE_ID' },
        update: { value: essentialPrice.id, name: 'Essential Will' },
        create: { key: 'STRIPE_ESSENTIAL_PRICE_ID', value: essentialPrice.id, name: 'Essential Will' },
      }),
      prisma.storePaymentInfo.upsert({
        where: { key: 'STRIPE_UNLIMITED_PRICE_ID' },
        update: { value: unlimitedPrice.id, name: 'Unlimited Legacy' },
        create: { key: 'STRIPE_UNLIMITED_PRICE_ID', value: unlimitedPrice.id, name: 'Unlimited Legacy' },
      }),
    ]);

    console.log('✅ Stripe products initialized');
    console.log(`   Essential Will price:  ${essentialPrice.id}`);
    console.log(`   Unlimited Legacy price: ${unlimitedPrice.id}`);
  } catch (error) {
    console.error('❌ Failed to initialize Stripe products:', error);
    throw error; // Rethrow so server startup fails loudly
  }
};