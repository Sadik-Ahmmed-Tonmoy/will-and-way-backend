import { z } from 'zod';

export const updatePaymentMethodValidation = z.object({
  body: z.object({
    paymentMethodToken: z.string().min(1),
    last4: z.string().length(4).optional(),
    cardBrand: z.string().optional(),
    expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/).optional(),
  }),
});

export const upgradeSubscriptionValidation = z.object({
  body: z.object({
    tier: z.enum(['BASIC', 'PRO']),
  }),
});

export const cancelSubscriptionValidation = z.object({
  body: z.object({
    reason: z.string().optional(),
  }),
});

export const createPlanValidation = z.object({
  body: z.object({
    name: z.enum(['BASIC', 'PRO']),
    price: z.number().min(0),
    features: z.array(z.string()),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updatePlanValidation = z.object({
  body: z.object({
    price: z.number().min(0).optional(),
    features: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const subscriptionFilterValidation = z.object({
  query: z.object({
    status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']).optional(),
    page: z.string().optional().transform(Number),
    limit: z.string().optional().transform(Number),
  }),
});