import { MaritalStatus, Region, RelationType, Religion, TypeOfIdentifier } from "@prisma/client";

export interface IUpdateProfile {
  fullName?: string;
  nickname?: string;
  phoneNumber?: string;
  religion?: Religion; 
  region?: Region; 
  maritalStatus?: MaritalStatus;
  profileImage?: string;
}

export interface IAddPerson {
  fullName: string;
  email?: string;
  typeOfIdentifier?: TypeOfIdentifier;
  identifierValue?: string;
  dateOfBirth?: string;
  relationWithUser?: RelationType;
  governmentIssuedId?: boolean;
  relationType: RelationType;
}

export interface IUpdatePerson {
  fullName?: string;
  email?: string;
  typeOfIdentifier?: TypeOfIdentifier;
  identifierValue?: string;
  dateOfBirth?: string;
  relationWithUser?: RelationType;
  governmentIssuedId?: boolean;
}