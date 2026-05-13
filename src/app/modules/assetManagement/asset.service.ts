
import ApiError from '../../../errors/ApiErrors';
import prisma from '../../../shared/ommitedPrisma';
import { ICreateAsset, ICreateLoan, ICreateProperty, IUpdateAsset } from './asset.interface';
import httpStatus from 'http-status';

const createAsset = async (userId: string, data: ICreateAsset) => {
  return prisma.asset.create({
    data: { userId, ...data },
  });
};

const getAssetsByUser = async (userId: string) => {
  return prisma.asset.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
};

const updateAsset = async (userId: string, assetId: string, data: IUpdateAsset) => {
  const asset = await prisma.asset.findFirst({ where: { id: assetId, userId } });
  if (!asset) throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
  return prisma.asset.update({ where: { id: assetId }, data });
};

const deleteAsset = async (userId: string, assetId: string) => {
  const asset = await prisma.asset.findFirst({ where: { id: assetId, userId } });
  if (!asset) throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
  await prisma.asset.delete({ where: { id: assetId } });
  return { deleted: true };
};

const createProperty = async (userId: string, data: ICreateProperty) => {
  console.log(data);
  return prisma.property.create({
    data: {
      userId,
      type: data.propertyType,
      country: data.country,
      streetAddress: data.streetAddress,
      unitNumber: data.unitNumber,
      postcode: data.postalCode,
      isJointProperty: data.isJoint ?? false,
      estimatedValue: data.estimatedValue,
    },
  });
};


const getProperties = async (userId: string) =>
  prisma.property.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });

const getPropertyById = async (userId: string, propertyId: string) => {
  const property = await prisma.property.findFirst({ where: { id: propertyId, userId } });
  if (!property) throw new ApiError(httpStatus.NOT_FOUND, 'Property not found');
  return property;
}

const updateProperty = async (userId: string, propertyId: string, data: ICreateProperty) => {
  const property = await prisma.property.findFirst({ where: { id: propertyId, userId } });
  if (!property) throw new ApiError(httpStatus.NOT_FOUND, 'Property not found');
  return prisma.property.update({
    where: { id: propertyId },
    data: {
      type: data.propertyType,
      country: data.country,
      streetAddress: data.streetAddress,
      unitNumber: data.unitNumber,
      postcode: data.postalCode,
      isJointProperty: data.isJoint ?? false,
      estimatedValue: data.estimatedValue,
    },
  });
}

const deleteProperty = async (userId: string, propertyId: string) => {
  const property = await prisma.property.findFirst({ where: { id: propertyId, userId } });
  if (!property) throw new ApiError(httpStatus.NOT_FOUND, 'Property not found');
  await prisma.property.delete({ where: { id: propertyId } });
  return { deleted: true };
}

const createLoan = async (userId: string, data: ICreateLoan) => {
  return prisma.loan.create({
    data: {
      userId,
      type: data.loanType,
      institutionName: data.institutionName,
      accountNumber: data.accountNumber,
      approximateBalance: data.approximateBalance,
    },
  });
};

const getLoans = async (userId: string) =>
  prisma.loan.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });

const getLoanById = async (userId: string, loanId: string) => {
  const loan = await prisma.loan.findFirst({ where: { id: loanId, userId } });
  if (!loan) throw new ApiError(httpStatus.NOT_FOUND, 'Loan not found');
  return loan;
}

const updateLoan = async (userId: string, loanId: string, data: ICreateLoan) => {
  const loan = await prisma.loan.findFirst({ where: { id: loanId, userId } });
  if (!loan) throw new ApiError(httpStatus.NOT_FOUND, 'Loan not found');
  return prisma.loan.update({
    where: { id: loanId },
    data: {
      type: data.loanType,
      institutionName: data.institutionName,
      accountNumber: data.accountNumber,
      approximateBalance: data.approximateBalance,
    },
  });
}

const deleteLoan = async (userId: string, loanId: string) => {
  const loan = await prisma.loan.findFirst({ where: { id: loanId, userId } });
  if (!loan) throw new ApiError(httpStatus.NOT_FOUND, 'Loan not found');
  await prisma.loan.delete({ where: { id: loanId } });
  return { deleted: true };
}


export const AssetService = {
  createAsset, getAssetsByUser, updateAsset, deleteAsset, createProperty, getProperties, getPropertyById, updateProperty, deleteProperty, createLoan, getLoans, getLoanById, updateLoan, deleteLoan

};

