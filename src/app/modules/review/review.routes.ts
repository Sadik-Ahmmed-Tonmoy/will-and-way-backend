import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserRole } from '@prisma/client';
import { ReviewController } from './review.controller';
import {
  createReviewValidation,
  updateReviewValidation,
  reviewFilterValidation,
} from './review.validation';

const router = express.Router();

// User routes (authenticated users can manage their own reviews)
router.post(
  '/',
  auth(),
  validateRequest(createReviewValidation),
  ReviewController.createReview
);

router.get(
  '/my-reviews',
  auth(),
  validateRequest(reviewFilterValidation),
  ReviewController.getMyReviews
);

router.get(
  '/my-reviews/:id',
  auth(UserRole.USER),
  ReviewController.getReviewById
);

router.put(
  '/my-reviews/:id',
  auth(),
  validateRequest(updateReviewValidation),
  ReviewController.updateReview
);

router.delete(
  '/my-reviews/:id',
  auth(),
  ReviewController.deleteReview
);

// Public routes (or optionally authenticated)
router.get(
  '/listings/:listingId/reviews',
  validateRequest(reviewFilterValidation),
  ReviewController.getReviewsByListing
);

// Vendor routes
router.get(
  '/vendor/reviews',
  auth(UserRole.VENDOR),
  validateRequest(reviewFilterValidation),
  ReviewController.getVendorListingsReviews
);

// Admin routes
router.get(
  '/admin/reviews',
  auth(),
  validateRequest(reviewFilterValidation),
  ReviewController.getAllReviews
);

router.delete(
  '/admin/reviews/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ReviewController.adminDeleteReview
);

export const ReviewRoutes = router;