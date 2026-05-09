import { z } from 'zod';

export const createReviewValidation = z.object({
  body: z.object({
    listingId: z.string().min(1, 'Listing ID is required'),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }),
});

export const updateReviewValidation = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().max(1000).optional(),
  }),
});

export const reviewFilterValidation = z.object({
  query: z.object({
    listingId: z.string().optional(),
    userId: z.string().optional(),
    rating: z.string().optional().transform(Number),
    page: z.string().optional().transform(Number),
    limit: z.string().optional().transform(Number),
  }),
});