import { AssetType, LoanType, PropertyType } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiErrors';
import prisma from '../../../shared/prisma';
import { 
  ICreateProperty, IUpdateProperty,
  ICreateAsset, IUpdateAsset,
  ICreateLoan, IUpdateLoan,
  ICreateAdvisor, IUpdateAdvisor
} from './asset.interface';

// ========== PROPERTY SERVICES ==========

const createProperty = async (userId: string, payload: ICreateProperty) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const property = await prisma.property.create({
    data: {
      userId,
      ...payload,
    },
  });

  return property;
};

const getProperties = async (userId: string) => {
  const properties = await prisma.property.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return properties;
};

const getPropertyById = async (userId: string, propertyId: string) => {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId },
  });

  if (!property) throw new ApiError(httpStatus.NOT_FOUND, 'Property not found');
  return property;
};

const updateProperty = async (userId: string, propertyId: string, payload: IUpdateProperty) => {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId },
  });

  if (!property) throw new ApiError(httpStatus.NOT_FOUND, 'Property not found');

  const updatedProperty = await prisma.property.update({
    where: { id: propertyId },
    data: payload,
  });

  return updatedProperty;
};

const deleteProperty = async (userId: string, propertyId: string) => {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId },
  });

  if (!property) throw new ApiError(httpStatus.NOT_FOUND, 'Property not found');

  await prisma.property.delete({ where: { id: propertyId } });
  return { id: propertyId, deleted: true };
};

const getPropertiesByType = async (userId: string, propertyType: PropertyType) => {
  const properties = await prisma.property.findMany({
    where: { userId, propertyType },
    orderBy: { createdAt: 'desc' },
  });

  return properties;
};

// ========== ASSET SERVICES ==========

const createAsset = async (userId: string, payload: ICreateAsset) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const asset = await prisma.asset.create({
    data: {
      userId,
      ...payload,
    },
  });

  return asset;
};

const getAssets = async (userId: string) => {
  const assets = await prisma.asset.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return assets;
};

const getAssetById = async (userId: string, assetId: string) => {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, userId },
  });

  if (!asset) throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
  return asset;
};

const updateAsset = async (userId: string, assetId: string, payload: IUpdateAsset) => {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, userId },
  });

  if (!asset) throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');

  const updatedAsset = await prisma.asset.update({
    where: { id: assetId },
    data: payload,
  });

  return updatedAsset;
};

const deleteAsset = async (userId: string, assetId: string) => {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, userId },
  });

  if (!asset) throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');

  await prisma.asset.delete({ where: { id: assetId } });
  return { id: assetId, deleted: true };
};

const getAssetsByType = async (userId: string, assetType: AssetType) => {
  const assets = await prisma.asset.findMany({
    where: { userId, assetType },
    orderBy: { createdAt: 'desc' },
  });

  return assets;
};

// ========== LOAN SERVICES ==========

const createLoan = async (userId: string, payload: ICreateLoan) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const loan = await prisma.loan.create({
    data: {
      userId,
      ...payload,
    },
  });

  return loan;
};

const getLoans = async (userId: string) => {
  const loans = await prisma.loan.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return loans;
};

const getLoanById = async (userId: string, loanId: string) => {
  const loan = await prisma.loan.findFirst({
    where: { id: loanId, userId },
  });

  if (!loan) throw new ApiError(httpStatus.NOT_FOUND, 'Loan not found');
  return loan;
};

const updateLoan = async (userId: string, loanId: string, payload: IUpdateLoan) => {
  const loan = await prisma.loan.findFirst({
    where: { id: loanId, userId },
  });

  if (!loan) throw new ApiError(httpStatus.NOT_FOUND, 'Loan not found');

  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: payload,
  });

  return updatedLoan;
};

const deleteLoan = async (userId: string, loanId: string) => {
  const loan = await prisma.loan.findFirst({
    where: { id: loanId, userId },
  });

  if (!loan) throw new ApiError(httpStatus.NOT_FOUND, 'Loan not found');

  await prisma.loan.delete({ where: { id: loanId } });
  return { id: loanId, deleted: true };
};

const getLoansByType = async (userId: string, loanType: LoanType) => {
  const loans = await prisma.loan.findMany({
    where: { userId, loanType },
    orderBy: { createdAt: 'desc' },
  });

  return loans;
};

// ========== ADVISOR SERVICES ==========

const createAdvisor = async (userId: string, payload: ICreateAdvisor) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const advisor = await prisma.advisor.create({
    data: {
      userId,
      ...payload,
    },
  });

  return advisor;
};

const getAdvisors = async (userId: string) => {
  const advisors = await prisma.advisor.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return advisors;
};

const getAdvisorById = async (userId: string, advisorId: string) => {
  const advisor = await prisma.advisor.findFirst({
    where: { id: advisorId, userId },
  });

  if (!advisor) throw new ApiError(httpStatus.NOT_FOUND, 'Advisor not found');
  return advisor;
};

const updateAdvisor = async (userId: string, advisorId: string, payload: IUpdateAdvisor) => {
  const advisor = await prisma.advisor.findFirst({
    where: { id: advisorId, userId },
  });

  if (!advisor) throw new ApiError(httpStatus.NOT_FOUND, 'Advisor not found');

  const updatedAdvisor = await prisma.advisor.update({
    where: { id: advisorId },
    data: payload,
  });

  return updatedAdvisor;
};

const deleteAdvisor = async (userId: string, advisorId: string) => {
  const advisor = await prisma.advisor.findFirst({
    where: { id: advisorId, userId },
  });

  if (!advisor) throw new ApiError(httpStatus.NOT_FOUND, 'Advisor not found');

  await prisma.advisor.delete({ where: { id: advisorId } });
  return { id: advisorId, deleted: true };
};

export const AssetServices = {
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