import { z } from 'zod';

const createCheckoutSessionSchema = z.object({
  body: z.object({
    productType: z.enum(['essential_will', 'unlimited_legacy'], {
      errorMap: () => ({ message: "productType must be 'essential_will' or 'unlimited_legacy'" }),
    }),
  }),
});

export const paymentValidation = {
  createCheckoutSessionSchema,
};