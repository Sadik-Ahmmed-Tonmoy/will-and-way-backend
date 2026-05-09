import { OTPPurpose } from "@prisma/client";

export interface IUser {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  profileImage?: string;
}

export interface LoginPayload {
  identifier: string;          // can be email or phone
  password: string;
  keepMeLogin?: boolean;
}

export interface SocialLoginPayload {
  email: string;
  logInProcess: 'GOOGLE' | 'APPLE';
  fcmToken?: string;
  fullName?: string;
  phoneNumber?: string;
  profileImage?: string;
  keepMeLogin?: boolean;
}

export interface OTPGeneratePayload {
  userId: string;
  purpose: OTPPurpose;
  expiresInMinutes?: number;
}

export interface OTPVerifyPayload {
  identifier: string;          // email or phone
  code: string;
  purpose: OTPPurpose;
}

export interface ResendOTPPayload {
  identifier: string;
  purpose: OTPPurpose;
}

export interface ForgetPasswordPayload {
  email: string;               // only email for now – extend if needed
}