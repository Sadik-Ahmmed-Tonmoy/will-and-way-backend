import { AssetType, CoverType, LoanType, PropertyType } from '@prisma/client';

export interface ICreateAsset {
  type: AssetType;
  isJointlyOwned?: boolean;
  isNominated?: boolean;
  approximateValue?: number;
  description?: string;
  institutionName?: string;
  accountNumber?: string;
  companyName?: string;
  policyNumber?: string;
  coverType?: CoverType;
  maturityDate?: Date;
  faceValue?: number;
}

export interface IUpdateAsset extends Partial<ICreateAsset> {}

export interface ICreateProperty {
  propertyType: PropertyType;
  country: string;
  streetAddress: string;
  unitNumber?: string;
  postalCode: string;
  isJoint?: boolean;
  estimatedValue: number;
}


export interface ICreateLoan {
  loanType: LoanType;
  institutionName: string;
  accountNumber: string;
  approximateBalance: number;
}