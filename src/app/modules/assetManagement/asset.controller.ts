import { Request, Response } from 'express';
import httpStatus from 'http-status';
import sendResponse from '../../../shared/sendResponse';
import { AssetServices } from './asset.service';
import catchAsync from '../../utils/catchAsync';
import { AssetType, LoanType, PropertyType } from '@prisma/client';

// ========== PROPERTY CONTROLLERS ==========
const createProperty = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetServices.createProperty(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Property added successfully',
    data: result,
  });
});

const getProperties = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetServices.getProperties(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Properties fetched successfully',
    data: result,
  });
});

const getPropertyById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AssetServices.getPropertyById(req.user.id, id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Property fetched successfully',
    data: result,
  });
});

const updateProperty = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AssetServices.updateProperty(req.user.id, id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Property updated successfully',
    data: result,
  });
});

const deleteProperty = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AssetServices.deleteProperty(req.user.id, id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Property deleted successfully',
    data: result,
  });
});

const getPropertiesByType = catchAsync(async (req: Request, res: Response) => {
  const { propertyType } = req.params;
  const result = await AssetServices.getPropertiesByType(req.user.id, propertyType as PropertyType);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Properties fetched successfully',
    data: result,
  });
});

// ========== ASSET CONTROLLERS ==========
const createAsset = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetServices.createAsset(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Asset added successfully',
    data: result,
  });
});

const getAssets = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetServices.getAssets(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Assets fetched successfully',
    data: result,
  });
});

const getAssetById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AssetServices.getAssetById(req.user.id, id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Asset fetched successfully',
    data: result,
  });
});

const updateAsset = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AssetServices.updateAsset(req.user.id, id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Asset updated successfully',
    data: result,
  });
});

const deleteAsset = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AssetServices.deleteAsset(req.user.id, id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Asset deleted successfully',
    data: result,
  });
});

const getAssetsByType = catchAsync(async (req: Request, res: Response) => {
  const { assetType } = req.params;
  const result = await AssetServices.getAssetsByType(req.user.id, assetType as AssetType);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Assets fetched successfully',
    data: result,
  });
});

// ========== LOAN CONTROLLERS ==========
const createLoan = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetServices.createLoan(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Loan added successfully',
    data: result,
  });
});

const getLoans = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetServices.getLoans(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Loans fetched successfully',
    data: result,
  });
});

const getLoanById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AssetServices.getLoanById(req.user.id, id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Loan fetched successfully',
    data: result,
  });
});

const updateLoan = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AssetServices.updateLoan(req.user.id, id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Loan updated successfully',
    data: result,
  });
});

const deleteLoan = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AssetServices.deleteLoan(req.user.id, id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Loan deleted successfully',
    data: result,
  });
});

const getLoansByType = catchAsync(async (req: Request, res: Response) => {
  const { loanType } = req.params;
  const result = await AssetServices.getLoansByType(req.user.id, loanType as LoanType);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Loans fetched successfully',
    data: result,
  });
});

// ========== ADVISOR CONTROLLERS ==========
const createAdvisor = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetServices.createAdvisor(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Advisor added successfully',
    data: result,
  });
});

const getAdvisors = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetServices.getAdvisors(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Advisors fetched successfully',
    data: result,
  });
});

const getAdvisorById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AssetServices.getAdvisorById(req.user.id, id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Advisor fetched successfully',
    data: result,
  });
});

const updateAdvisor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AssetServices.updateAdvisor(req.user.id, id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Advisor updated successfully',
    data: result,
  });
});

const deleteAdvisor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AssetServices.deleteAdvisor(req.user.id, id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Advisor deleted successfully',
    data: result,
  });
});

export const AssetController = {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getPropertiesByType,
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  getAssetsByType,
  createLoan,
  getLoans,
  getLoanById,
  updateLoan,
  deleteLoan,
  getLoansByType,
  createAdvisor,
  getAdvisors,
  getAdvisorById,
  updateAdvisor,
  deleteAdvisor,
};