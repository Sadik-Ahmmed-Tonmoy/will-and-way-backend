import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiErrors';
import prisma from '../../../shared/prisma';
import { ICreateReviewPayload, IUpdateReviewPayload, IReviewFilter } from './review.interface';

// Helper to update listing average rating
const updateListingAvgRating = async (listingId: string) => {
  const result = await prisma.review.aggregate({
    where: { listingId },
    _avg: { rating: true },
    _count: true,
  });
  const avgRating = result._avg.rating || 0;
  await prisma.listing.update({
    where: { id: listingId },
    data: { avgRating },
  });
};

// Check if user has completed a booking for this listing (can review)
const canUserReviewListing = async (userId: string, listingId: string): Promise<boolean> => {
  const booking = await prisma.booking.findFirst({
    where: {
      userId,
      listingId,
      status: 'PAID', // or CONFIRMED/COMPLETED
    },
  });
  return !!booking;
};

const createReview = async (userId: string, payload: ICreateReviewPayload) => {
  const { listingId, rating, comment } = payload;

  // Check if listing exists
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new ApiError(httpStatus.NOT_FOUND, 'Listing not found');

  // Check if user already reviewed this listing
  const existing = await prisma.review.findFirst({
    where: { userId, listingId },
  });
  if (existing) throw new ApiError(httpStatus.BAD_REQUEST, 'You have already reviewed this listing');

  // Check if user is eligible to review (has a paid booking)
  const eligible = await canUserReviewListing(userId, listingId);
  if (!eligible) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only review listings you have booked');
  }

  const review = await prisma.review.create({
    data: {
      userId,
      listingId,
      rating,
      comment,
    },
  });

  // Update listing average rating
  await updateListingAvgRating(listingId);

  return review;
};

const getReviews = async (filters: IReviewFilter & Record<string, any>) => {
  const { listingId, userId, rating, page = 1, limit = 10 } = filters;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Prisma.ReviewWhereInput = {};
  if (listingId) where.listingId = listingId;
  if (userId) where.userId = userId;
  if (rating) where.rating = rating;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { fullName: true, profileImage: true } },
        listing: { select: { name: true, vendorId: true } },
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.count({ where }),
  ]);

  return { data: reviews, meta: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } };
};

const getReviewById = async (reviewId: string) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      user: { select: { fullName: true, profileImage: true } },
      listing: true,
    },
  });
  if (!review) throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
  return review;
};

const updateReview = async (reviewId: string, userId: string, payload: IUpdateReviewPayload) => {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId },
  });
  if (!review) throw new ApiError(httpStatus.NOT_FOUND, 'Review not found or not owned by you');

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: payload.rating,
      comment: payload.comment,
    },
  });

  // Update listing average rating
  await updateListingAvgRating(review.listingId);

  return updated;
};

const deleteReview = async (reviewId: string, userId: string) => {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId },
  });
  if (!review) throw new ApiError(httpStatus.NOT_FOUND, 'Review not found or not owned by you');

  const listingId = review.listingId;
  await prisma.review.delete({ where: { id: reviewId } });

  // Update listing average rating
  await updateListingAvgRating(listingId);
};

// Vendor: get all reviews for their listings
const getVendorListingsReviews = async (vendorUserId: string, query: any) => {
  const { page = 1, limit = 10 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Prisma.ReviewWhereInput = {
    listing: { vendorId: vendorUserId },
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { fullName: true, profileImage: true } },
        listing: { select: { name: true } },
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.count({ where }),
  ]);

  return { data: reviews, meta: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } };
};

// Admin: get all reviews
const getAllReviews = async (query: any) => {
  const { listingId, vendorId, page = 1, limit = 10 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Prisma.ReviewWhereInput = {};
  if (listingId) where.listingId = listingId;
  if (vendorId) where.listing = { vendorId };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true } },
        listing: { select: { name: true, vendor: { select: { fullName: true } } } },
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.count({ where }),
  ]);

  return { data: reviews, meta: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } };
};

const adminDeleteReview = async (reviewId: string) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');

  const listingId = review.listingId;
  await prisma.review.delete({ where: { id: reviewId } });
  await updateListingAvgRating(listingId);
};

export const ReviewServices = {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getVendorListingsReviews,
  getAllReviews,
  adminDeleteReview,
};