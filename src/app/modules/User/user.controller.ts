import { Request, Response } from 'express';
import httpStatus from 'http-status';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from '../../utils/catchAsync';
import { RelationType } from '@prisma/client';
import { ProfileServices } from './user.service';

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as Record<string, Express.Multer.File[]>;
  const result = await ProfileServices.updateProfile(req.user.id, req.body, files);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});

const addAddress = catchAsync(async (req: Request, res: Response) => {
  const { country, streetAddress, unitNumber, postCode } = req.body;
  const result = await ProfileServices.addAddress(req.user.id, country, streetAddress, unitNumber, postCode);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Address added successfully',
    data: result,
  });
});

const updateAddress = catchAsync(async (req: Request, res: Response) => {

  const { id } = req.params;
  const { country, streetAddress, unitNumber, postCode } = req.body;
  const result = await ProfileServices.updateAddress(req.user.id, id as string, country, streetAddress, unitNumber, postCode);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Address updated successfully',
    data: result,
  });
});

const getProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await ProfileServices.getProfile(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile fetched successfully',
    data: result,
  });
});

const addPerson = catchAsync(async (req: Request, res: Response) => {
  const result = await ProfileServices.addPerson(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'People added successfully',
    data: result,
  });
});

const getPeople = catchAsync(async (req: Request, res: Response) => {
  const result = await ProfileServices.getPeople(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'People fetched successfully',
    data: result,
  });
});

const getPeopleByType = catchAsync(async (req: Request, res: Response) => {
  const { relationType } = req.params;
  const result = await ProfileServices.getPeopleByType(
    req.user.id,
    relationType as RelationType
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'People fetched successfully',
    data: result,
  });
});

const updatePerson = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProfileServices.updatePerson(req.user.id, id as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'People updated successfully',
    data: result,
  });
});

const deletePerson = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProfileServices.deletePerson(req.user.id, id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'People deleted successfully',
    data: result,
  });
});

export const ProfileController = {
  updateProfile,
  addAddress,
  updateAddress,
  getProfile,
  addPerson,
  getPeople,
  getPeopleByType,
  updatePerson,
  deletePerson,
};