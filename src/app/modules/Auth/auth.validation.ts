import { z } from "zod";
import { LogInProcess, OTPPurpose, UserRole } from "@prisma/client";

const phoneSchema = z.string().min(8, "Phone number must be at least 8 characters").max(25, "Phone number must not exceed 25 characters");

const signupValidationSchema = z.object({
  body: z.object({
    fullName: z.string().optional(),
    email: z.string().email().optional(),
    phoneNumber: phoneSchema.optional(),
    role: z.nativeEnum(UserRole).optional(),
    password: z.string().min(8, "Password must be at least 8 characters").optional(),
    logInProcess: z.nativeEnum(LogInProcess),
    fcmToken: z.string().optional(),
    profileImage: z.string().optional(),
    keepMeLogin: z.boolean().optional(),
    shortBio: z.string().max(160, "Short bio must not exceed 160 characters").optional(),
  }).refine(data => {
    // If logInProcess is EMAIL or PHONE, the respective identifier must be present
    if (data.logInProcess === LogInProcess.EMAIL && !data.email) {
      return false;
    }
    if (data.logInProcess === LogInProcess.PHONE && !data.phoneNumber) {
      return false;
    }
    return true;
  }, {
    message: "Missing required identifier for the chosen login method",
  }),
});

const loginValidationSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Email or phone number is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    keepMeLogin: z.boolean().optional(),
  }),
});

const socialSignupLoginValidationSchema = z.object({
  body: z.object({
    email: z.string().email(),
    logInProcess: z.enum([LogInProcess.GOOGLE, LogInProcess.APPLE]),
    fcmToken: z.string().optional(),
    fullName: z.string().optional(),
    phoneNumber: phoneSchema.optional(),
    profileImage: z.string().optional(),
    keepMeLogin: z.boolean().optional(),
  }),
});

const changePasswordValidationSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(8, "Old password must be at least 8 characters"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
  }),
});

const forgetPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const resetPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6, "New password must be at least 6 characters"),
    token: z.string(),
  }),
});

const verifyOTPValidationSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Email or phone is required"),
    code: z.string().length(6, "Code must be 6 digits"),
    purpose: z.nativeEnum(OTPPurpose),
  }),
});

const resendOTPValidationSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Email or phone is required"),
    purpose: z.nativeEnum(OTPPurpose),
  }),
});

export const authValidation = {
  signupValidationSchema,
  loginValidationSchema,
  socialSignupLoginValidationSchema,
  changePasswordValidationSchema,
  forgetPasswordValidationSchema,
  resetPasswordValidationSchema,
  verifyOTPValidationSchema,
  resendOTPValidationSchema,
};