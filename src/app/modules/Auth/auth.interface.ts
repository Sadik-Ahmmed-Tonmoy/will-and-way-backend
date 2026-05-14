import { OTPPurpose } from "@prisma/client";


export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  profileImage?: string;
}

export interface ForgetPasswordPayload {
  email: string;
}


export interface OTPGeneratePayload {
  userId: string;
  purpose: OTPPurpose;
  expiresInMinutes?: number;
}

export interface OTPVerifyPayload {
  email: string;
  code: string;
  purpose: OTPPurpose;
}