import { z } from 'zod';

const checkoutSchema = z.object({
  body: z.object({
    successUrl: z.string().url('successUrl must be a valid URL'),
    cancelUrl: z.string().url('cancelUrl must be a valid URL'),
  }),
});

export const paymentValidation = {
  checkoutSchema,
};