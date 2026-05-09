import { z } from "zod";
import { AssetType, LoanType, PropertyType } from "@prisma/client";

// Property Validation
const createPropertyValidationSchema = z.object({
  body: z.object({
    propertyType: z.nativeEnum(PropertyType),
    country: z.string().optional(),
    streetAddress: z.string().min(1, "Street address is required"),
    unitNumber: z.string().optional(),
    postalCode: z.string().optional(),
    isJoint: z.boolean().optional(),
    estimatedValue: z.number().positive("Estimated value must be positive").optional(),
  }),
});

const updatePropertyValidationSchema = z.object({
  body: z.object({
    country: z.string().optional(),
    streetAddress: z.string().min(1, "Street address is required").optional(),
    unitNumber: z.string().optional(),
    postalCode: z.string().optional(),
    isJoint: z.boolean().optional(),
    estimatedValue: z.number().positive("Estimated value must be positive").optional(),
  }),
});

// Asset Validation
const createAssetValidationSchema = z.object({
  body: z.object({
    assetType: z.nativeEnum(AssetType),
    institutionName: z.string().min(1, "Institution name is required"),
    accountNumber: z.string().optional(),
    isJoint: z.boolean().optional(),
    isNominated: z.boolean().optional(),
    approximateValue: z.number().positive("Value must be positive").optional(),
    cryptoWalletAddress: z.string().optional(),
    cryptoType: z.string().optional(),
    description: z.string().optional(),
  }).superRefine((data, ctx) => {
    // Crypto-specific validation
    if (data.assetType === AssetType.CRYPTO && !data.cryptoWalletAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cryptoWalletAddress"],
        message: "Crypto wallet address is required for crypto assets",
      });
    }
  }),
});

const updateAssetValidationSchema = z.object({
  body: z.object({
    institutionName: z.string().min(1, "Institution name is required").optional(),
    accountNumber: z.string().optional(),
    isJoint: z.boolean().optional(),
    isNominated: z.boolean().optional(),
    approximateValue: z.number().positive("Value must be positive").optional(),
    cryptoWalletAddress: z.string().optional(),
    cryptoType: z.string().optional(),
    description: z.string().optional(),
  }),
});

// Loan Validation
const createLoanValidationSchema = z.object({
  body: z.object({
    loanType: z.nativeEnum(LoanType),
    institutionName: z.string().min(1, "Institution or person name is required"),
    accountNumber: z.string().optional(),
    approximateBalance: z.number().positive("Balance must be positive").optional(),
  }),
});

const updateLoanValidationSchema = z.object({
  body: z.object({
    institutionName: z.string().min(1, "Institution name is required").optional(),
    accountNumber: z.string().optional(),
    approximateBalance: z.number().positive("Balance must be positive").optional(),
  }),
});

// Advisor Validation
const createAdvisorValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Advisor name is required"),
    email: z.string().email("Invalid email").optional(),
    phone: z.string().optional(),
    firm: z.string().optional(),
    specialization: z.string().optional(),
  }),
});

const updateAdvisorValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Advisor name is required").optional(),
    email: z.string().email("Invalid email").optional(),
    phone: z.string().optional(),
    firm: z.string().optional(),
    specialization: z.string().optional(),
  }),
});

export const assetValidation = {
  createPropertyValidationSchema,
  updatePropertyValidationSchema,
  createAssetValidationSchema,
  updateAssetValidationSchema,
  createLoanValidationSchema,
  updateLoanValidationSchema,
  createAdvisorValidationSchema,
  updateAdvisorValidationSchema,
};