import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { authValidation } from "./auth.validation";

const router = express.Router();

// Unified signup (handles EMAIL, PHONE, SOCIAL via logInProcess field)
router.post(
  "/signup",
  validateRequest(authValidation.signupValidationSchema),
  AuthController.signup
);

// Unified login (identifier can be email or phone)
router.post(
  "/login",
  validateRequest(authValidation.loginValidationSchema),
  AuthController.login
);

// Social signup/login (explicitly for Google/Apple)
router.post(
  "/social-signup-login",
  validateRequest(authValidation.socialSignupLoginValidationSchema),
  AuthController.socialSignupOrLogin
);

// OTP verification (works for both email and phone)
router.post(
  "/verify-otp",
  validateRequest(authValidation.verifyOTPValidationSchema),
  AuthController.verifyOTP
);

// Resend OTP (works for both email and phone)
router.post(
  "/resend-otp",
  validateRequest(authValidation.resendOTPValidationSchema),
  AuthController.resendOTP
);

// Get current user
router.get("/me", auth(), AuthController.getMe);

// Change password
router.put(
  "/change-password",
  auth(),
  validateRequest(authValidation.changePasswordValidationSchema),
  AuthController.changePassword
);

// Forgot password (email only)
router.post(
  "/forgot-password",
  validateRequest(authValidation.forgetPasswordValidationSchema),
  AuthController.forgotPassword
);

// Reset password
router.post(
  "/reset-password",
  validateRequest(authValidation.resetPasswordValidationSchema),
  AuthController.resetPassword
);

// Refresh token
router.post("/refresh-token", AuthController.refreshToken);

// Logout
router.post("/logout", AuthController.logout);

// Admin: update user status
router.patch(
  "/user-status/:id",
  auth("SUPER_ADMIN", "ADMIN"),
  AuthController.updateUserStatus
);

export const AuthRoutes = router;