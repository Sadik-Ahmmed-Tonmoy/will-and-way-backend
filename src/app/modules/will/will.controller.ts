import { Request, Response } from 'express';
import httpStatus from 'http-status';
import sendResponse from '../../../shared/sendResponse';
import { WillServices } from './will.service';
import catchAsync from '../../utils/catchAsync';

// ========== WILL CONTROLLERS ==========
const createWill = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.createWill(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Will created successfully',
    data: result,
  });
});

const getMyWill = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.getMyWill(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Will fetched successfully',
    data: result,
  });
});

const getFullWill = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.getFullWill(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Full will fetched successfully',
    data: result,
  });
});

const updateWillStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.updateWillStatus(req.user.id, req.body.status);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Will status updated successfully',
    data: result,
  });
});

const updateWillStep = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.updateWillStep(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Will step updated successfully',
    data: result,
  });
});

// ========== EXECUTOR CONTROLLERS ==========
const addExecutor = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.addExecutor(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Executor added successfully',
    data: result,
  });
});

const addBackupExecutor = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.addBackupExecutor(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Backup executor added successfully',
    data: result,
  });
});

const updateExecutor = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.updateExecutor(req.user.id, req.params.id as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Executor updated successfully',
    data: result,
  });
});

const deleteExecutor = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.deleteExecutor(req.user.id, req.params.id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Executor deleted successfully',
    data: result,
  });
});

const removePersonFromExecutor = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.removePersonFromExecutor(req.user.id, req.params.peopleId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Person removed from executor successfully',
    data: result,
  });
}
);

const removeBackupPersonFromExecutor = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.removeBackupPersonFromExecutor(req.user.id, req.params.peopleId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Backup person removed from executor successfully',
    data: result,
  });
});


// ========== DISTRIBUTION CONTROLLERS ==========

// Add multiple distributions with auto-calculated percentages
const addDistributions = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.addDistributions(req.user.id, req.body.distributions);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Distributions added successfully',
    data: result,
  });
});

// Bulk update distributions (add/update/remove)
const bulkUpdateDistributions = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.bulkUpdateDistributions(req.user.id, req.body.distributions);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Distributions updated successfully',
    data: result,
  });
});

const getAllDistributions = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.getAllDistributions(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Distributions fetched successfully',
    data: result,
  });
});

// Add backup distributor to a distribution
const addBackupDistributor = catchAsync(async (req: Request, res: Response) => {
  const { distributionId } = req.params;
  const result = await WillServices.addBackupDistributor(req.user.id, distributionId as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Backup distributor added successfully',
    data: result,
  });
});

// Update backup distributor
const updateBackupDistributor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await WillServices.updateBackupDistributor(req.user.id, id as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Backup distributor updated successfully',
    data: result,
  });
});

// Delete backup distributor
const deleteBackupDistributor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await WillServices.deleteBackupDistributor(req.user.id, id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Backup distributor deleted successfully',
    data: result,
  });
});

const deleteEstateDistribution = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.deleteEstateDistribution(req.user.id, req.params.id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Distribution deleted successfully',
    data: result,
  });
});




// ========== WILL GIFT CONTROLLERS ==========
const addWillGift = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.addWillGift(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Gift added to will successfully',
    data: result,
  });
});

const deleteWillGift = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.deleteWillGift(req.user.id, req.params.id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Gift removed from will successfully',
    data: result,
  });
});

// ========== PET CARETAKER CONTROLLERS ==========
// ========== PET CARETAKER CONTROLLERS ==========

const addPetCaretaker = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.addPetCaretaker(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Pet caretaker added successfully',
    data: result,
  });
});

const updatePetCaretaker = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.updatePetCaretaker(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Pet caretaker updated successfully',
    data: result,
  });
});

const deletePetCaretaker = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.deletePetCaretaker(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Pet caretakers deleted successfully',
    data: result,
  });
});

const getPetCaretakers = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.getPetCaretakers(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Pet caretakers fetched successfully',
    data: result,
  });
});

const getDashboard = catchAsync(async (req: Request, res: Response) => {
  const result = await WillServices.getDashboard(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard data fetched',
    data: result
  });
});


export const WillController = {
  createWill,
  getMyWill,
  getFullWill,
  updateWillStatus,
  updateWillStep,
  addExecutor,
  addBackupExecutor,
  updateExecutor,
  deleteExecutor,
  removePersonFromExecutor,
  removeBackupPersonFromExecutor,
  addWillGift,
  deleteWillGift,
  addPetCaretaker,
  updatePetCaretaker,
  deletePetCaretaker,
  getAllDistributions,
  addDistributions,
  bulkUpdateDistributions,
  addBackupDistributor,
  getPetCaretakers,
  updateBackupDistributor,
  deleteBackupDistributor,
  deleteEstateDistribution,
  getDashboard,
};