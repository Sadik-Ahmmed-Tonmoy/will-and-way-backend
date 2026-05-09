import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ReviewServices } from './review.service';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await ReviewServices.createReview(userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Review created successfully',
    data: result,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await ReviewServices.getReviews({ userId, ...req.query });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My reviews retrieved',
    data: result,
  });
});

const getReviewsByListing = catchAsync(async (req: Request, res: Response) => {
  const { listingId } = req.params;
  const result = await ReviewServices.getReviews({ listingId, ...req.query });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Listing reviews retrieved',
    data: result,
  });
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReviewServices.getReviewById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review retrieved',
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;
  const result = await ReviewServices.updateReview(id, userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review updated successfully',
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;
  await ReviewServices.deleteReview(id, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review deleted successfully',
    data: null,
  });
});

// Vendor routes
const getVendorListingsReviews = catchAsync(async (req: Request, res: Response) => {
  const vendorId = req.user.id;
  const result = await ReviewServices.getVendorListingsReviews(vendorId, req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vendor listings reviews retrieved',
    data: result,
  });
});

// Admin routes
const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.getAllReviews(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All reviews retrieved',
    data: result,
  });
});

const adminDeleteReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await ReviewServices.adminDeleteReview(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review deleted by admin',
    data: null,
  });
});

export const ReviewController = {
  createReview,
  getMyReviews,
  getReviewsByListing,
  getReviewById,
  updateReview,
  deleteReview,
  getVendorListingsReviews,
  getAllReviews,
  adminDeleteReview,
};