
import { PropertyType,  LoanType } from "@prisma/client";

import { z } from 'zod';
import { AssetType, CoverType } from '@prisma/client';

const createAssetSchema = z.object({
  type: z.nativeEnum(AssetType),
  isJointlyOwned: z.boolean().optional(),
  isNominated: z.boolean().optional(),
  approximateValue: z.number().positive().optional(),
  description: z.string().optional(),
  institutionName: z.string().optional(),
  accountNumber: z.string().optional(),
  companyName: z.string().optional(),
  policyNumber: z.string().optional(),
  coverType: z.nativeEnum(CoverType).optional(),
  maturityDate: z.string().datetime().optional(),
  faceValue: z.number().positive().optional(),
});

// const createAssetValidationSchema = z.object({
//   body: z.object({
//     category: z.nativeEnum(AssetCategory),
//     name: z.string().min(1, "Name is required"),
//     description: z.string().optional(),
//     estimatedValue: z.number().positive().optional(),

//     // Property fields
//     propertyType: z.nativeEnum(PropertyType).optional(),
//     country: z.string().optional(),
//     streetAddress: z.string().optional(),
//     unitNumber: z.string().optional(),
//     postalCode: z.string().optional(),
//     isJoint: z.boolean().optional(),

//     // Financial fields
//     assetType: z.nativeEnum(AssetType).optional(),
//     institutionName: z.string().optional(),
//     accountNumber: z.string().optional(),
//     isNominated: z.boolean().optional(),
//     cryptoWalletAddress: z.string().optional(),
//     cryptoType: z.string().optional(),

//     // Loan fields
//     loanType: z.nativeEnum(LoanType).optional(),
//     institutionNameLoan: z.string().optional(),
//     accountNumberLoan: z.string().optional(),
//     approximateBalance: z.number().positive().optional(),

//     // Advisor fields
//     email: z.string().email().optional(),
//     phone: z.string().optional(),
//     firm: z.string().optional(),
//     specialization: z.string().optional(),
//   }).superRefine((data, ctx) => {
//     if (data.category === 'PROPERTY' && !data.streetAddress) {
//       ctx.addIssue({ code: 'custom', path: ['streetAddress'], message: 'Street address is required for property' });
//     }
//     if ((data.category === 'FINANCIAL' || data.category === 'LOAN') && !data.institutionName && !data.institutionNameLoan) {
//       ctx.addIssue({ code: 'custom', path: ['institutionName'], message: 'Institution name is required' });
//     }
//     if (data.category === 'ADVISOR' && !data.email) {
//       ctx.addIssue({ code: 'custom', path: ['email'], message: 'Email is required for advisor' });
//     }
//   }),
// });

const updateAssetValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    estimatedValue: z.number().positive().optional(),
    propertyType: z.nativeEnum(PropertyType).optional(),
    country: z.string().optional(),
    streetAddress: z.string().optional(),
    unitNumber: z.string().optional(),
    postalCode: z.string().optional(),
    isJoint: z.boolean().optional(),
    assetType: z.nativeEnum(AssetType).optional(),
    institutionName: z.string().optional(),
    accountNumber: z.string().optional(),
    isNominated: z.boolean().optional(),
    cryptoWalletAddress: z.string().optional(),
    cryptoType: z.string().optional(),
    loanType: z.nativeEnum(LoanType).optional(),
    institutionNameLoan: z.string().optional(),
    accountNumberLoan: z.string().optional(),
    approximateBalance: z.number().positive().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    firm: z.string().optional(),
    specialization: z.string().optional(),
  }),
});

const linkAssetToWillValidationSchema = z.object({
  body: z.object({
    assetId: z.string().min(1, "Asset ID is required"),
  }),
});

const unlinkAssetFromWillValidationSchema = z.object({
  body: z.object({
    assetId: z.string().min(1, "Asset ID is required"),
  }),
});

export const assetValidation = {
  createAssetSchema,
  // createAssetValidationSchema,
  updateAssetValidationSchema,
  linkAssetToWillValidationSchema,
  unlinkAssetFromWillValidationSchema,
};