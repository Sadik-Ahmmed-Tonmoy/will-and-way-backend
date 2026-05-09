import { AssetType, LoanType, PropertyType } from "@prisma/client";

// Property interfaces
export interface ICreateProperty {
  propertyType: PropertyType;
  country?: string;
  streetAddress: string;
  unitNumber?: string;
  postalCode?: string;
  isJoint?: boolean;
  estimatedValue?: number;
}

export interface IUpdateProperty {
  country?: string;
  streetAddress?: string;
  unitNumber?: string;
  postalCode?: string;
  isJoint?: boolean;
  estimatedValue?: number;
}

// Asset interfaces
export interface ICreateAsset {
  assetType: AssetType;
  institutionName: string;
  accountNumber?: string;
  isJoint?: boolean;
  isNominated?: boolean;
  approximateValue?: number;
  cryptoWalletAddress?: string;
  cryptoType?: string;
  description?: string;
}

export interface IUpdateAsset {
  institutionName?: string;
  accountNumber?: string;
  isJoint?: boolean;
  isNominated?: boolean;
  approximateValue?: number;
  cryptoWalletAddress?: string;
  cryptoType?: string;
  description?: string;
}

// Loan interfaces
export interface ICreateLoan {
  loanType: LoanType;
  institutionName: string;
  accountNumber?: string;
  approximateBalance?: number;
}

export interface IUpdateLoan {
  institutionName?: string;
  accountNumber?: string;
  approximateBalance?: number;
}

// Advisor interfaces
export interface ICreateAdvisor {
  name: string;
  email?: string;
  phone?: string;
  firm?: string;
  specialization?: string;
}

export interface IUpdateAdvisor {
  name?: string;
  email?: string;
  phone?: string;
  firm?: string;
  specialization?: string;
}