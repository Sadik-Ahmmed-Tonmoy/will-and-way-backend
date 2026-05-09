import { Request, Response } from 'express';
import httpStatus from 'http-status';
import config from '../../../config';
import ApiError from '../../../errors/ApiErrors';
import sendResponse from '../../../shared/sendResponse';
import { AuthServices } from './auth.service';
import catchAsync from '../../utils/catchAsync';

const signup = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.signup(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.isVerified
      ? 'Verification code sent'
      : 'Account created successfully',
    data: result,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.login(req.body);

  if (result.isVerified) {
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'none',
      secure: true,
    });
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      maxAge: result.keepMeLogin ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
      sameSite: 'none',
      secure: true,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.isVerified
      ? 'Login successful'
      : 'Verification code sent',
    data: result,
  });
});

const socialSignupOrLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.socialSignupOrLogin(req.body);

  if (result.isVerified) {
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'none',
      secure: true,
    });
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      maxAge: result.keepMeLogin ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
      sameSite: 'none',
      secure: true,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Social authentication successful',
    data: result,
  });
});

const verifyOTP = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.verifyOTP(req.body);

  if (result.isVerified && result.accessToken) {
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'none',
      secure: true,
    });
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'none',
      secure: true,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP verified successfully',
    data: result,
  });
});

const resendOTP = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.resendOTP(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP resent successfully',
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await AuthServices.getMe(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile fetched',
    data: user,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  await AuthServices.changePassword(req.user.id, req.body.oldPassword, req.body.newPassword);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password changed successfully',
    data: null,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.forgotPassword(req.body.email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password reset OTP sent',
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthServices.resetPassword(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password reset successfully',
    data: null,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const refreshToken =  req.headers.authorization || req.cookies.refreshToken;
  console.log("refreshToken", refreshToken);
  if (!refreshToken) throw new ApiError(httpStatus.UNAUTHORIZED, 'No refresh token');

  const result = await AuthServices.refreshToken(refreshToken);
  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'none',
    secure: true,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Token refreshed',
    data: result,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const user = await AuthServices.updateUserStatus(req.params.id, req.body.status);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User status updated',
    data: user,
  });
});

export const AuthController = {
  signup,
  login,
  socialSignupOrLogin,
  verifyOTP,
  resendOTP,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  updateUserStatus,
};