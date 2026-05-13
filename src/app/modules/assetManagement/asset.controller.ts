import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { AssetService } from './asset.service';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

const createAsset = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetService.createAsset(req.user.id, req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: 'Asset created', data: result });
});

const getAssets = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetService.getAssetsByUser(req.user.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Assets fetched', data: result });
});

const updateAsset = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetService.updateAsset(req.user.id, req.params.id, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Asset updated', data: result });
});

const deleteAsset = catchAsync(async (req: Request, res: Response) => {
  await AssetService.deleteAsset(req.user.id, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Asset deleted',
    data: null,
  });
});

const createProperty = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetService.createProperty(req.user.id, req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: 'Property created', data: result });
});

const getProperties = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetService.getProperties(req.user.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Properties fetched', data: result });
});

const getPropertyById = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetService.getPropertyById(req.user.id, req.params.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Property fetched', data: result });
}
);

const updateProperty = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetService.updateProperty(req.user.id, req.params.id, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Property updated', data: result });
});

const deleteProperty = catchAsync(async (req: Request, res: Response) => {
  await AssetService.deleteProperty(req.user.id, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Property deleted',
    data: null,
  });
}
);

const createLoan = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetService.createLoan(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Loan created',
    data: result
  });
});

const getLoans = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetService.getLoans(req.user.id);
  sendResponse(res,
    {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Loans fetched',
      data: result
    });
}
);

const getLoanById = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetService.getLoanById(req.user.id, req.params.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Loan fetched', data: result });
});

const updateLoan = catchAsync(async (req: Request, res: Response) => {
  const result = await AssetService.updateLoan(req.user.id, req.params.id, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Loan updated', data: result });
});

const deleteLoan = catchAsync(async (req: Request, res: Response) => {
  await AssetService.deleteLoan(req.user.id, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Loan deleted',
    data: null,
  });
}
);




export const AssetController = {
  createAsset, getAssets, updateAsset, deleteAsset, createProperty, getProperties, getPropertyById, updateProperty, deleteProperty, createLoan,
  getLoans, getLoanById, updateLoan, deleteLoan
};