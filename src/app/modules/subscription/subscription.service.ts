// import { Prisma, SubscriptionTier } from '@prisma/client';
// import httpStatus from 'http-status';
// import ApiError from '../../../errors/ApiErrors';
// import prisma from '../../../shared/prisma';
// import { IUpdatePaymentMethodPayload, ICreatePlanPayload } from './subscription.interface';

// // Subscription tiers and their default features (can be overridden by admin plans)
// const DEFAULT_PLANS: Record<string, { price: number; features: string[] }> = {
//   BASIC: { price: 0, features: ['Basic analytics', 'Up to 5 listings', 'Email support'] },
//   PRO: { price: 49, features: ['Advanced analytics', 'Unlimited listings', 'Priority support', 'No transaction fee'] },
// };

// // Helper to sync plan from admin settings
// const getPlanDetails = async (tier: string) => {
//   const plan = await prisma.subscriptionPlan.findUnique({
//     where: { name: tier as any, isActive: true },
//   });
//   if (plan) return plan;
//   // Fallback to default
//   return {
//     name: tier,
//     price: DEFAULT_PLANS[tier]?.price || 0,
//     features: DEFAULT_PLANS[tier]?.features || [],
//   };
// };

// const getVendorSubscription = async (vendorUserId: string) => {
//   const vendor = await prisma.vendorProfile.findUnique({
//     where: { userId: vendorUserId },
//     select: {
//       subscriptionTier: true,
//       subscriptionRenewalDate: true,
//       paymentMethodToken: true,
//     },
//   });
//   if (!vendor) throw new ApiError(httpStatus.NOT_FOUND, 'Vendor profile not found');

//   // Get plan details
//   const plan = await getPlanDetails(vendor.subscriptionTier as SubscriptionTier);

//   return {
//     tier: vendor.subscriptionTier,
//     renewalDate: vendor.subscriptionRenewalDate,
//     paymentMethod: vendor.paymentMethodToken ? { hasPaymentMethod: true } : null,
//     plan,
//   };
// };

// const updatePaymentMethod = async (vendorUserId: string, payload: IUpdatePaymentMethodPayload) => {
//   const vendor = await prisma.vendorProfile.findUnique({
//     where: { userId: vendorUserId },
//   });
//   if (!vendor) throw new ApiError(httpStatus.NOT_FOUND, 'Vendor profile not found');

//   // In real implementation, tokenize payment method via Stripe/PayPal
//   const updated = await prisma.vendorProfile.update({
//     where: { userId: vendorUserId },
//     data: {
//       paymentMethodToken: payload.paymentMethodToken,
//       // Optionally store last4, brand, expiry in separate fields or JSON
//     },
//   });
//   return { paymentMethodUpdated: true };
// };

// const upgradeSubscription = async (vendorUserId: string, tier: string) => {
//   const vendor = await prisma.vendorProfile.findUnique({
//     where: { userId: vendorUserId },
//   });
//   if (!vendor) throw new ApiError(httpStatus.NOT_FOUND, 'Vendor profile not found');

//   const plan = await getPlanDetails(tier);
//   if (!plan) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid subscription tier');

//   // Check if downgrading or upgrading
//   const isUpgrade = tier === 'PRO' && vendor.subscriptionTier === 'BASIC';
//   const isDowngrade = tier === 'BASIC' && vendor.subscriptionTier === 'PRO';

//   // For PRO, ensure payment method exists
//   if (tier === 'PRO' && !vendor.paymentMethodToken) {
//     throw new ApiError(httpStatus.PAYMENT_REQUIRED, 'Payment method required for Pro subscription');
//   }

//   // Calculate renewal date (e.g., 30 days from now)
//   const renewalDate = new Date();
//   renewalDate.setDate(renewalDate.getDate() + 30);

//   // In real implementation, create/update subscription in Stripe/PayPal
//   // and handle proration for downgrades

//   const updated = await prisma.vendorProfile.update({
//     where: { userId: vendorUserId },
//     data: {
//       subscriptionTier: tier,
//       subscriptionRenewalDate: renewalDate,
//     },
//   });

//   // Log subscription change
//   await prisma.subscriptionLog.create({
//     data: {
//       vendorId: vendor.id,
//       action: isUpgrade ? 'UPGRADE' : isDowngrade ? 'DOWNGRADE' : 'CHANGE',
//         // oldTier: vendor.subscriptionTier,
//         oldTier: vendor.subscriptionTier as SubscriptionTier,
//       newTier: tier as SubscriptionTier,
//     },
//   });

//   return {
//     tier: updated.subscriptionTier,
//     renewalDate: updated.subscriptionRenewalDate,
//     plan,
//   };
// };

// const cancelSubscription = async (vendorUserId: string, reason?: string) => {
//   const vendor = await prisma.vendorProfile.findUnique({
//     where: { userId: vendorUserId },
//   });
//   if (!vendor) throw new ApiError(httpStatus.NOT_FOUND, 'Vendor profile not found');

//   // Set to BASIC and cancel future renewals
//   const updated = await prisma.vendorProfile.update({
//     where: { userId: vendorUserId },
//     data: {
//       subscriptionTier: 'BASIC',
//       subscriptionRenewalDate: null,
//     },
//   });

//   await prisma.subscriptionLog.create({
//     data: {
//       vendorId: vendor.id,
//       action: 'CANCELLED',
//       oldTier: vendor.subscriptionTier as SubscriptionTier,
//       newTier: 'BASIC' as SubscriptionTier,
//       reason,
//     },
//   });

//   // In real implementation, cancel subscription in Stripe/PayPal

//   return { message: 'Subscription cancelled', currentTier: 'BASIC' };
// };

// // Admin: get all vendor subscriptions
// const getAllSubscriptions = async (query: any) => {
//   const { status, page = 1, limit = 10 } = query;
//   const skip = (Number(page) - 1) * Number(limit);

//   const where: Prisma.VendorProfileWhereInput = {};
//   if (status === 'ACTIVE') where.subscriptionRenewalDate = { gt: new Date() };
//   if (status === 'EXPIRED') where.subscriptionRenewalDate = { lt: new Date() };
//   if (status === 'CANCELLED') where.subscriptionTier = 'BASIC';

//   const [vendors, total] = await Promise.all([
//     prisma.vendorProfile.findMany({
//       where,
//       include: { user: { select: { fullName: true, email: true } } },
//       skip,
//       take: Number(limit),
//       orderBy: { subscriptionRenewalDate: 'desc' },
//     }),
//     prisma.vendorProfile.count({ where }),
//   ]);

//   return { data: vendors, meta: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } };
// };

// // Admin: manage subscription plans
// const createPlan = async (payload: ICreatePlanPayload) => {
//   const existing = await prisma.subscriptionPlan.findUnique({
//     where: { name: payload.name as any },
//   });
//   if (existing) throw new ApiError(httpStatus.BAD_REQUEST, 'Plan already exists');

//   const plan = await prisma.subscriptionPlan.create({
//     data: {
//       name: payload.name as any,
//       price: payload.price,
//       features: payload.features,
//       isActive: payload.isActive ?? true,
//     },
//   });
//   return plan;
// };

// const updatePlan = async (planId: string, payload: Partial<ICreatePlanPayload>) => {
//   const plan = await prisma.subscriptionPlan.update({
//     where: { id: planId },
//     data: {
//       price: payload.price,
//       features: payload.features,
//       isActive: payload.isActive,
//     },
//   });
//   return plan;
// };

// const getPlans = async () => {
//   const plans = await prisma.subscriptionPlan.findMany({
//     where: { isActive: true },
//     orderBy: { price: 'asc' },
//   });
//   if (plans.length) return plans;
//   // Return defaults if no plans configured
//   return Object.entries(DEFAULT_PLANS).map(([name, data]) => ({
//     id: name,
//     name,
//     price: data.price,
//     features: data.features,
//     isActive: true,
//   }));
// };

// // Webhook handler (placeholder for Stripe)
// const handleWebhook = async (payload: any, signature: string) => {
//   // Verify webhook signature
//   // Parse event type
//   // Handle subscription.created, subscription.updated, subscription.deleted, invoice.payment_succeeded, etc.
//   console.log('Webhook received:', payload.type);
//   return { received: true };
// };

// export const SubscriptionServices = {
//   getVendorSubscription,
//   updatePaymentMethod,
//   upgradeSubscription,
//   cancelSubscription,
//   getAllSubscriptions,
//   createPlan,
//   updatePlan,
//   getPlans,
//   handleWebhook,
// };