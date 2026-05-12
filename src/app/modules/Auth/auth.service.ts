import { LogInProcess, OTPPurpose, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import { otpEmail } from '../../../emails/otpEmail';
import ApiError from '../../../errors/ApiErrors';
import { generateRandomCode } from '../../../helpars/generateCode';
import { jwtHelpers } from '../../../helpars/jwtHelpers';
import {
  comparePassword,
  hashPassword,
} from '../../../helpars/passwordHelpers';
import prisma from '../../../shared/prisma';
import { sendEmail } from '../../utils/sendEmail';
import { ChatService } from '../chat/chat.service'; // 👈 import ChatService
import {
  LoginPayload,
  OTPVerifyPayload,
  ResendOTPPayload,
  SocialLoginPayload,
} from './auth.interface';

// Helper: find user by email or phone
const findUserByIdentifier = async (identifier: string) => {
  const isEmail = identifier.includes('@');
  if (isEmail) {
    return prisma.user.findUnique({ where: { email: identifier } });
  } else {
    return prisma.user.findFirst({ where: { phoneNumber: identifier } });
  }
};

// Helper: send OTP based on purpose and identifier
const sendOTP = async (
  userId: string,
  identifier: string,
  purpose: OTPPurpose,
): Promise<{ id: string; code: string; expiresAt: Date }> => {
  const code = generateRandomCode(6);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const data: any = {
    userId,
    code,
    purpose,
    expiresAt,
  };
  if (identifier.includes('@')) {
    data.email = identifier;
  } else {
    data.phone = identifier;
  }

  const otp = await prisma.oTP.create({ data });

  // Send via appropriate channel
  if (identifier.includes('@')) {
    const html = otpEmail(code, identifier, `OTP for ${purpose}`);
    await sendEmail(`Your OTP for ${purpose}`, identifier, html);
  } else {
    const message = `Your verification code is: ${code}`;
    // await sendSMS(identifier, message);
  }

  return otp;
};

// SIGNUP (handles EMAIL, PHONE, and even SOCIAL if needed, but social is separate)
const signup = async (payload: any) => {
  const {
    fullName,
    email,
    phoneNumber,
    password,
    logInProcess,
    fcmToken,
    profileImage,
    role,
    shortBio,
    keepMeLogin = false,
  } = payload;

  // Validate required identifier based on logInProcess
  if (logInProcess === LogInProcess.EMAIL && !email) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Email is required for email signup',
    );
  }
  if (logInProcess === LogInProcess.PHONE && !phoneNumber) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Phone number is required for phone signup',
    );
  }
  if (
    (logInProcess === LogInProcess.EMAIL ||
      logInProcess === LogInProcess.PHONE) &&
    !password
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Password is required for this signup method',
    );
  }

  // Check uniqueness
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already registered');
  }
  if (phoneNumber) {
    const existing = await prisma.user.findFirst({ where: { phoneNumber } });
    if (existing)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Phone number already registered',
      );
  }

  const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

  // Create user (unverified)
  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      phoneNumber,
      shortBio,
      password: hashedPassword,
      logInProcess,
      fcmToken,
      profileImage,
      isVerified: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      role: role || UserRole.USER,
      status: UserStatus.ACTIVE,
      salutation: payload.salutation,
      region: payload.region,
    },
  });

  let vendorDetails = null;


  const accessToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  const refreshToken = jwtHelpers.generateToken(
    { id: user.id, role: user.role },
    config.jwt.refresh_secret as Secret,
    keepMeLogin ? '30d' : (config.jwt.refresh_expires_in as string),
  );
  // Determine identifier for OTP
  // const identifier = logInProcess === LogInProcess.EMAIL ? email! : phoneNumber!;
  // const purpose =
  //   logInProcess === LogInProcess.EMAIL
  //     ? OTPPurpose.EMAIL_VERIFICATION
  //     : OTPPurpose.PHONE_VERIFICATION;

  // // Generate and send OTP
  // const otp = await sendOTP(user.id, identifier, purpose);

  const { password: _, ...userWithoutPassword } = user;
  // return {
  //   ...userWithoutPassword,
  //   otp,
  //   otpSent: true,
  //   otpId: otp.id,
  //   expiresAt: otp.expiresAt,
  // };

  return {
    ...userWithoutPassword,
    vendorDetails,
    accessToken,
    refreshToken,
    keepMeLogin,
  };
};

// LOGIN (by email or phone)
const login = async (payload: LoginPayload) => {
  const { identifier, password, keepMeLogin = false } = payload;

  const user = await findUserByIdentifier(identifier);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account is not active');
  }

  if (!user.password) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'This account has no password set',
    );
  }
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect password');
  }

  const isEmailIdentifier = identifier.includes('@');
  const isVerified = isEmailIdentifier
    ? user.isEmailVerified
    : user.isPhoneVerified;

  if (!isVerified) {
    const purpose = isEmailIdentifier
      ? OTPPurpose.EMAIL_VERIFICATION
      : OTPPurpose.PHONE_VERIFICATION;
    const otp = await sendOTP(user.id, identifier, purpose);
    return {
      email: user.email,
      phoneNumber: user.phoneNumber,
      isVerified: false,
      otpSent: true,
      expiresAt: otp.expiresAt,
    };
  }

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  const refreshToken = jwtHelpers.generateToken(
    { id: user.id, role: user.role },
    config.jwt.refresh_secret as Secret,
    keepMeLogin ? '30d' : (config.jwt.refresh_expires_in as string),
  );

  // Fire and forget: sync user conversations for chat
  Promise.resolve().then(() => {
    ChatService.syncUserConversations(user.id).catch(err =>
      console.error('Failed to sync user conversations:', err),
    );
  });

  return {
    isVerified: true,
    accessToken,
    refreshToken,
    keepMeLogin,
    role: user.role,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profileImage: user.profileImage,
    },
  };
};

// SOCIAL SIGNUP/LOGIN (unchanged from your version, but integrated)
const socialSignupOrLogin = async (payload: SocialLoginPayload) => {
  const {
    email,
    logInProcess,
    fcmToken,
    fullName,
    phoneNumber,
    profileImage,
    keepMeLogin = false,
  } = payload;

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    if (existingUser.logInProcess !== logInProcess) {
      throw new ApiError(400, `Please login with ${existingUser.logInProcess}`);
    }
    if (existingUser.status !== UserStatus.ACTIVE) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Account suspended');
    }

    if (fcmToken && existingUser.fcmToken !== fcmToken) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { fcmToken },
      });
    }

    if (!existingUser.isVerified) {
      const otp = await sendOTP(
        existingUser.id,
        email,
        OTPPurpose.EMAIL_VERIFICATION,
      );
      return {
        email,
        isVerified: false,
        otpSent: true,
        expiresAt: otp.expiresAt,
      };
    }

    const accessToken = jwtHelpers.generateToken(
      {
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
      },
      config.jwt.access_secret as Secret,
      config.jwt.access_expires_in as string,
    );
    const refreshToken = jwtHelpers.generateToken(
      { id: existingUser.id, role: existingUser.role },
      config.jwt.refresh_secret as Secret,
      keepMeLogin ? '30d' : (config.jwt.refresh_expires_in as string),
    );

    // Fire and forget: sync user conversations for chat
    Promise.resolve().then(() => {
      ChatService.syncUserConversations(existingUser.id).catch(err =>
        console.error('Failed to sync user conversations:', err),
      );
    });

    return {
      isVerified: true,
      accessToken,
      refreshToken,
      keepMeLogin,
      role: existingUser.role,
      user: {
        id: existingUser.id,
        fullName: existingUser.fullName,
        email: existingUser.email,
        phoneNumber: existingUser.phoneNumber,
        profileImage: existingUser.profileImage,
      },
    };
  }

  const newUser = await prisma.user.create({
    data: {
      email,
      fullName: fullName || '',
      phoneNumber,
      profileImage,
      fcmToken,
      logInProcess,
      isVerified: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });

  const accessToken = jwtHelpers.generateToken(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );
  const refreshToken = jwtHelpers.generateToken(
    { id: newUser.id, role: newUser.role },
    config.jwt.refresh_secret as Secret,
    keepMeLogin ? '30d' : (config.jwt.refresh_expires_in as string),
  );

  // Fire and forget: sync user conversations for chat
  Promise.resolve().then(() => {
    ChatService.syncUserConversations(newUser.id).catch(err =>
      console.error('Failed to sync user conversations:', err),
    );
  });

  return {
    isVerified: true,
    accessToken,
    refreshToken,
    keepMeLogin,
    role: newUser.role,
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      phoneNumber: newUser.phoneNumber,
      profileImage: newUser.profileImage,
    },
  };
};

// VERIFY OTP (handles both email and phone)
const verifyOTP = async (payload: OTPVerifyPayload) => {
  const { identifier, code, purpose } = payload;

  const user = await findUserByIdentifier(identifier);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const otp = await prisma.oTP.findFirst({
    where: {
      userId: user.id,
      code,
      purpose,
      used: false,
      expiresAt: { gt: new Date() },
      ...(identifier.includes('@')
        ? { email: identifier }
        : { phone: identifier }),
    },
  });

  if (!otp) {
    return { isValid: false };
  }

  await prisma.oTP.update({ where: { id: otp.id }, data: { used: true } });

  const updateData: any = {};
  if (purpose === OTPPurpose.EMAIL_VERIFICATION) {
    updateData.isEmailVerified = true;
    updateData.isVerified = true; // you can adjust logic
  } else if (purpose === OTPPurpose.PHONE_VERIFICATION) {
    updateData.isPhoneVerified = true;
    updateData.isVerified = true;
  } else if (purpose === OTPPurpose.PASSWORD_RESET) {
    const resetToken = jwtHelpers.generateToken(
      { id: user.id, email: user.email },
      config.jwt.access_secret as Secret,
      '15m',
    );
    return {
      isValid: true,
      isVerified: false,
      resetPasswordToken: resetToken,
      email: user.email,
    };
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({ where: { id: user.id }, data: updateData });
  }

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );
  const refreshToken = jwtHelpers.generateToken(
    { id: user.id, role: user.role },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string,
  );
  return {
    isValid: true,
    isVerified: true,
    accessToken,
    refreshToken,
  };
};

// RESEND OTP
const resendOTP = async (payload: ResendOTPPayload) => {
  const { identifier, purpose } = payload;

  const user = await findUserByIdentifier(identifier);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const otp = await sendOTP(user.id, identifier, purpose);
  return {
    email: user.email,
    phoneNumber: user.phoneNumber,
    expiresAt: otp.expiresAt,
    otpId: otp.id,
  };
};

// GET ME
const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      profileImage: true,
      role: true,
      status: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      isVerified: true,
      createdAt: true,
      vendorProfile: true,
    },
  });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  return user;
};

// CHANGE PASSWORD
const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  if (
    user.logInProcess !== LogInProcess.EMAIL &&
    user.logInProcess !== LogInProcess.PHONE
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Password change not allowed for social accounts',
    );
  }

  const isMatch = await comparePassword(oldPassword, user.password!);
  if (!isMatch)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect old password');

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
};

// FORGOT PASSWORD (email only for now)
const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  if (user.logInProcess !== LogInProcess.EMAIL) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Password reset not supported for this account type',
    );
  }

  const otp = await sendOTP(user.id, email, OTPPurpose.PASSWORD_RESET);
  return { email, expiresAt: otp.expiresAt };
};

// RESET PASSWORD (after OTP verification, using token)
const resetPassword = async (payload: {
  email: string;
  token: string;
  password: string;
}) => {
  const { email, token, password } = payload;
  const decoded = jwtHelpers.verifyToken(
    token,
    config.jwt.access_secret as Secret,
  );
  if (!decoded)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const hashed = await hashPassword(password);
  await prisma.user.update({ where: { email }, data: { password: hashed } });
};

// REFRESH TOKEN
const refreshToken = async (refreshToken: string) => {
  const decoded = jwtHelpers.verifyToken(
    refreshToken,
    config.jwt.refresh_secret as Secret,
  );
  if (!decoded)
    throw new ApiError(httpStatus.FORBIDDEN, 'Invalid refresh token');

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const newAccessToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );
  return { accessToken: newAccessToken };
};

// UPDATE USER STATUS (admin)
const updateUserStatus = async (userId: string, status: UserStatus) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  return prisma.user.update({ where: { id: userId }, data: { status } });
};

export const AuthServices = {
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
  updateUserStatus,
};
