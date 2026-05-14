import { LogInProcess, OTPPurpose, UserStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
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
import { ForgetPasswordPayload, OTPVerifyPayload } from './auth.interface';
import { sendEmail } from '../../utils/sendEmail';

// SIGNUP
const signupToDb = async (payload: any) => {
  const { email, password, fcmToken, fullName, phoneNumber, keepMeLogin } =
    payload;

  if (!email) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Email is required to create an account',
    );
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'User with this email already exists',
    );
  }

  // EMAIL signup requires password
  if (payload.logInProcess === LogInProcess.EMAIL && !password) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Password is required for EMAIL login process',
    );
  }

  let hashedPassword: string | null = null;
  if (password) hashedPassword = await bcrypt.hash(password, 12);

  // EMAIL SIGNUP -> user must verify email → send OTP
  if (payload.logInProcess === LogInProcess.EMAIL) {
    const result = await prisma.$transaction(async tx => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          fcmToken,
          logInProcess: payload.logInProcess || LogInProcess.EMAIL,
          isVerified: false,
          isProfileCompleted: false,
          profileImage: payload.profileImage || null,
          fullName: fullName || '',
          phoneNumber: phoneNumber || '',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
        },
      });

      const otp = await tx.oTP.create({
        data: {
          userId: user.id,
          code: generateRandomCode(6),
          email: user.email,
          purpose: OTPPurpose.EMAIL_VERIFICATION,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      const { password, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, otp };
    });

    // Send OTP email AFTER transaction is complete
    const html = otpEmail(result.otp.code, email, 'OTP for Email Verification');

    // await sendEmailWithBrevo(
    //   result.user.email,
    //   "Verify Your Email Address",
    //   html
    // );

    await sendEmail('Verify Your Email Address', email, html);

    return {
      ...result.user,
      otp: result.otp,
      isVerified: false,
    };
  }

  // SOCIAL SIGNUP (GOOGLE, APPLE)
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fcmToken,
      logInProcess: payload.logInProcess,
      isVerified: true,
      isProfileCompleted: false,
      fullName: fullName || '',
      phoneNumber: phoneNumber || '',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });

  // Generate tokens
  const accessToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  const refreshToken = jwtHelpers.generateToken(
    { id: user.id, role: user.role },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string,
  );

  return {
    isVerified: true,
    accessToken,
    refreshToken,
    keepMeLogin,
    role: user.role,
  };
};

// LOGIN
const loginUser = async (payload: {
  email: string;
  password: string;
  keepMeLogin: boolean;
}) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found with this email');
  }

  if (userData.logInProcess !== LogInProcess.EMAIL) {
    throw new ApiError(
      400,
      `Please login with your ${userData.logInProcess} Account`,
    );
  }

  if (
    userData.status === UserStatus.INACTIVE ||
    userData.status === UserStatus.BANNED
  ) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account is Suspended');
  }

  if (userData.status === UserStatus.BLOCKED) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account is Blocked');
  }

  if (!payload.password || !userData?.password) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'User does not have a password set',
    );
  }

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password,
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password is incorrect');
  }

  if (userData?.isVerified === false) {
    const code = generateRandomCode(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const otp = await prisma.oTP.create({
      data: {
        userId: userData.id,
        code,
        email: userData.email,
        purpose: OTPPurpose.EMAIL_VERIFICATION,
        expiresAt,
      },
    });

    // Send verification email
    const html = otpEmail(
      otp.code,
      userData.email!,
      'OTP for Email Verification',
    );
    // await sendEmailWithBrevo(userData.email, 'Verify Your Email Address', html);
    await sendEmail('Verify Your Email Address', userData.email!, html);
    return {
      email: userData.email,
      isVerified: userData.isVerified,
    };
  } else {
    const accessToken = jwtHelpers.generateToken(
      {
        id: userData.id,
        email: userData.email,
        role: userData.role,
      },
      config.jwt.access_secret as Secret,
      config.jwt.access_expires_in as string,
    );

    let refreshToken;

    if (payload.keepMeLogin) {
      refreshToken = jwtHelpers.generateToken(
        {
          id: userData.id,
          role: userData.role,
        },
        config.jwt.refresh_secret as Secret,
        '30d', // Longer expiry for "keep me logged in"
      );
    } else {
      refreshToken = jwtHelpers.generateToken(
        {
          id: userData.id,
          role: userData.role,
        },
        config.jwt.refresh_secret as Secret,
        config.jwt.refresh_expires_in as string,
      );
    }

    return {
      isVerified: userData.isVerified,
      accessToken,
      refreshToken,
      keepMeLogin: payload.keepMeLogin,
      role: userData.role,
    };
  }
};

const socialLogin = async (payload: {
  email: string;
  logInProcess: LogInProcess;
  fcmToken?: string;
}) => {
  console.log(payload);
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (
    userData.status === UserStatus.INACTIVE ||
    userData.status === UserStatus.BANNED
  ) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account is Suspended');
  }

  if (userData?.isVerified === false) {
    const code = generateRandomCode(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const otp = await prisma.oTP.create({
      data: {
        userId: userData.id,
        code,
        email: userData.email,
        purpose: OTPPurpose.EMAIL_VERIFICATION,
        expiresAt,
      },
    });

    // Send verification email
    const html = otpEmail(
      otp.code,
      userData.email!,
      'OTP for Email Verification',
    );
    // await sendEmailWithBrevo(userData.email!, 'Verify Your Email Address', html);
    await sendEmail('Verify Your Email Address', userData.email!, html);

    return {
      email: userData.email,
      isVerified: userData.isVerified,
    };
  } else {
    // update fcm token
    if (payload.fcmToken && userData.fcmToken !== payload.fcmToken) {
      await prisma.user.update({
        where: { id: userData.id },
        data: { fcmToken: payload.fcmToken },
      });
    }

    const accessToken = jwtHelpers.generateToken(
      {
        id: userData.id,
        email: userData.email,
        role: userData.role,
      },
      config.jwt.access_secret as Secret,
      config.jwt.access_expires_in as string,
    );

    const refreshToken = jwtHelpers.generateToken(
      {
        id: userData.id,
        role: userData.role,
      },
      config.jwt.refresh_secret as Secret,
      config.jwt.refresh_expires_in as string,
    );

    return {
      isVerified: userData.isVerified,
      accessToken,
      refreshToken,
      role: userData.role,
    };
  }
};

const getMe = async (id: string) => {
  const result = await prisma.user.findUnique({
    where: { id },
    select: {
       id: true,
      fullName: true,
      nickname: true,
      email: true,
      profileImage: true,
      region: true,
      religion: true,
      maritalStatus: true,
      phoneNumber: true,
      role: true,
      status: true,
      isVerified: true,
      isProfileCompleted: true,
      createdAt: true,
      addresses: true,
      payments: true
    }
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }



  return result;
};

const getUserForScan = async (id: string) => {
  const result = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return result;
};

const googleLoginWithNextAuth = async (data: any) => {
  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: {
      logInProcess: LogInProcess.GOOGLE,
      isVerified: true,
    },
    create: {
      email: data.email,
      logInProcess: LogInProcess.GOOGLE,
      isVerified: true,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });

  if (user.status === UserStatus.INACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account is Suspended');
  }

  if (user.logInProcess !== LogInProcess.GOOGLE) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Please login with your ${user.logInProcess} account`,
    );
  }

  const accessToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string,
  );

  return { isValid: true, isVerified: true, accessToken, refreshToken, user };
};

// CHANGE PASSWORD
const changePassword = async (
  id: string,
  newPassword: string,
  oldPassword: string,
) => {
  if (!oldPassword) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Old Password is required');
  }

  if (!newPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'New Password is required');
  }

  const userData = await prisma.user.findUnique({
    where: { id },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No record found with this email');
  }

  if (userData.logInProcess !== LogInProcess.EMAIL) {
    throw new ApiError(
      400,
      `Please login with your ${userData.logInProcess} account. This account was created using login with ${userData.logInProcess} process.`,
    );
  }

  const isCorrectPassword = await comparePassword(
    oldPassword,
    userData.password as string,
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect old password!');
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: {
      id: userData.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  return;
};

const forgetPassword = async (payload: ForgetPasswordPayload) => {
  const { email } = payload;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'User not found with this email address',
    );
  }

  if (user.logInProcess !== LogInProcess.EMAIL) {
    throw new ApiError(
      400,
      `Please login with ${user.logInProcess} account, because you have registered with ${user.logInProcess}`,
    );
  }

  // Check if user account is active
  if (user.status !== UserStatus.ACTIVE) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User account is not active');
  }

  // Generate OTP for password reset
  const code = generateRandomCode(6);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const otp = await prisma.oTP.create({
    data: {
      userId: user.id,
      code,
      email: user.email,
      purpose: OTPPurpose.PASSWORD_RESET,
      expiresAt,
    },
  });

  // Send verification email
  const html = otpEmail(otp.code, user.email!, 'OTP for Password Reset');
  // await sendEmailWithBrevo(user.email!, 'Reset your password', html);
  await sendEmail('Reset your password', user.email!, html);

  return {
    email: user.email,
    role: user.role,
    logInProcess: user.logInProcess,
    purpose: otp.purpose,
    status: user.status,
    isVerified: user.isVerified,
    expiresAt: otp.expiresAt,
  };
};

// RESET PASSWORD
const resetPassword = async (payload: {
  email: string;
  token: string;
  password: string;
}) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const isValidToken = jwtHelpers.verifyToken(
    payload.token,
    config.jwt.access_secret as Secret,
  );

  if (!isValidToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token');
  }

  // hash password
  const hashedPassword = await hashPassword(payload.password);

  // update into database
  await prisma.user.update({
    where: {
      email: payload.email,
    },
    data: {
      password: hashedPassword,
    },
  });

  return { message: 'Password reset successfully' };
};

// REFRESH TOKEN
const refreshToken = async (refreshToken: string) => {
  const decodedToken = jwtHelpers.verifyToken(
    refreshToken,
    config.jwt.refresh_secret as Secret,
  );

  if (!decodedToken) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Refresh token expired or invalid',
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: decodedToken.id,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const accessToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  return { accessToken };
};

const userStatusUpdate = async (id: string, status: UserStatus) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { status },
  });

  return updatedUser;
};

const generateOTP = async (
  email: string,
  purpose: OTPPurpose,
): Promise<{ id: string }> => {
  // First, find the user by email
  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Generate new OTP code
  const code = generateRandomCode(6);

  // Set expiration time (10 minutes from now)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  // Create new OTP
  const otp = await prisma.oTP.create({
    data: {
      email: user.email,
      code,
      userId: user.id,
      purpose,
      expiresAt,
    },
  });

  // Send OTP via email
  const html = otpEmail(
    otp.code,
    user.email!,
    `OTP for ${purpose == OTPPurpose.EMAIL_VERIFICATION ? 'Email Verification' : 'Password Reset'}`,
  );

  // await sendEmailWithBrevo(
  //   user.email,
  //   `OTP for ${purpose == OTPPurpose.EMAIL_VERIFICATION ? 'Email Verification' : 'Password Reset'}`,
  //   html,
  // );

  await sendEmail(
    `OTP for ${purpose == OTPPurpose.EMAIL_VERIFICATION ? 'Email Verification' : 'Password Reset'}`,
    user.email!,
    html,
  );

  return { id: otp.id };
};

const verifyOTP = async (payload: OTPVerifyPayload) => {
  const { email, code, purpose } = payload;

  // First, find the user by email
  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Find the valid OTP for this user
  const otp = await prisma.oTP.findFirst({
    where: {
      userId: user.id,
      code,
      purpose,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otp) {
    return { isValid: false, user };
  }

  // Mark OTP as used
  await prisma.oTP.update({
    where: { id: otp.id },
    data: { used: true },
  });

  if (purpose === OTPPurpose.EMAIL_VERIFICATION) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
      },
    });

    const accessToken = jwtHelpers.generateToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwt.access_secret as Secret,
      config.jwt.access_expires_in as string,
    );

    const refreshToken = jwtHelpers.generateToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwt.refresh_secret as Secret,
      config.jwt.refresh_expires_in as string,
    );

    return {
      isValid: true,
      isVerified: true,
      accessToken,
      refreshToken,
      user,
    };
  } else {
    const resetPasswordToken = jwtHelpers.generateToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwt.access_secret as Secret,
      config.jwt.access_expires_in as string,
    );

    return {
      isValid: true,
      isVerified: false,
      resetPasswordToken,
      email,
      user,
    };
  }
};

const resendOTP = async (payload: { email: string; purpose: OTPPurpose }) => {
  // First, find the user by email
  const user = await prisma.user.findUnique({
    where: { email: payload?.email, status: UserStatus.ACTIVE },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Generate new OTP code
  const code = generateRandomCode(6);

  // Set expiration time (10 minutes from now)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  // Create new OTP
  const otp = await prisma.oTP.create({
    data: {
      userId: user.id,
      code,
      email: user.email,
      purpose: payload.purpose,
      expiresAt,
    },
  });

  const html = otpEmail(
    otp.code,
    user.email!,
    `OTP for ${payload.purpose == OTPPurpose.EMAIL_VERIFICATION ? 'Email Verification' : 'Password Reset'}`,
  );

  // await sendEmailWithBrevo(
  //   user.email,
  //   `OTP for ${payload.purpose == OTPPurpose.EMAIL_VERIFICATION ? 'Email Verification' : 'Password Reset'}`,
  //   html,
  // );
  await sendEmail(`OTP for ${payload.purpose == OTPPurpose.EMAIL_VERIFICATION ? 'Email Verification' : 'Password Reset'}`,
     user.email!, html);

  return {
    email: user.email,
    role: user.role,
    logInProcess: user.logInProcess,
    status: user.status,
    isVerified: user.isVerified,
    expiresAt: otp.expiresAt,
  };
};

const socialSignupOrLogin = async (payload: {
  email: string;
  logInProcess: LogInProcess;
  fcmToken?: string;
  fullName?: string;
  phoneNumber?: string;
  profileImage?: string;
  keepMeLogin?: boolean;
}) => {
  const {
    email,
    logInProcess,
    fcmToken,
    fullName,
    phoneNumber,
    profileImage,
    keepMeLogin = false,
  } = payload;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  // If user exists -> LOGIN
  if (existingUser) {
    // Check if user is trying to login with different social provider
    if (existingUser.logInProcess !== logInProcess) {
      throw new ApiError(
        400,
        `Please login with your ${existingUser.logInProcess} account`,
      );
    }

    // Check account status
    if (
      existingUser.status === UserStatus.INACTIVE ||
      existingUser.status === UserStatus.BANNED
    ) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Your account is Suspended');
    }

    if (existingUser.status === UserStatus.BLOCKED) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Your account is Blocked');
    }

    // Update FCM token if provided and different
    if (fcmToken && existingUser.fcmToken !== fcmToken) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { fcmToken },
      });
    }

    // If user is not verified, send OTP
    if (!existingUser.isVerified) {
      const code = generateRandomCode(6);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const otp = await prisma.oTP.create({
        data: {
          userId: existingUser.id,
          code,
          email: existingUser.email,
          purpose: OTPPurpose.EMAIL_VERIFICATION,
          expiresAt,
        },
      });

      // Send verification email
      const html = otpEmail(
        otp.code,
        existingUser.email!,
        'OTP for Email Verification',
      );

      // await sendEmailWithBrevo(
      //   existingUser.email,
      //   'Verify Your Email Address',
      //   html,
      // );

      await sendEmail('Verify Your Email Address', existingUser.email!, html);

      return {
        email: existingUser.email,
        isVerified: existingUser.isVerified,
        needsVerification: true,
      };
    }

    // Generate tokens for verified user
    const accessToken = jwtHelpers.generateToken(
      {
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
      },
      config.jwt.access_secret as Secret,
      config.jwt.access_expires_in as string,
    );

    let refreshToken;

    if (keepMeLogin) {
      refreshToken = jwtHelpers.generateToken(
        {
          id: existingUser.id,
          role: existingUser.role,
        },
        config.jwt.refresh_secret as Secret,
        '30d', // Longer expiry for "keep me logged in"
      );
    } else {
      refreshToken = jwtHelpers.generateToken(
        {
          id: existingUser.id,
          role: existingUser.role,
        },
        config.jwt.refresh_secret as Secret,
        config.jwt.refresh_expires_in as string,
      );
    }

    return {
      isVerified: true,
      accessToken,
      refreshToken,
      keepMeLogin,
      role: existingUser.role,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        fullName: existingUser.fullName,
        phoneNumber: existingUser.phoneNumber,
        profileImage: existingUser.profileImage,
        role: existingUser.role,
        status: existingUser.status,
        logInProcess: existingUser.logInProcess,
      },
    };
  }

  // If user doesn't exist -> SIGNUP
  const isSocialSignup =
    logInProcess === LogInProcess.GOOGLE || logInProcess === LogInProcess.APPLE;

  if (!isSocialSignup) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Only social login (GOOGLE/APPLE) is supported for this endpoint',
    );
  }

  // Create new user
  const newUser = await prisma.user.create({
    data: {
      email,
      password: null, // Social login doesn't need password
      fcmToken,
      logInProcess,
      isVerified: true, // Social logins are considered verified
      isProfileCompleted: false,
      fullName: fullName || '',
      phoneNumber: phoneNumber || '',
      profileImage: profileImage || null,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });

  // Generate tokens
  const accessToken = jwtHelpers.generateToken(
    {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  let refreshToken;

  if (keepMeLogin) {
    refreshToken = jwtHelpers.generateToken(
      {
        id: newUser.id,
        role: newUser.role,
      },
      config.jwt.refresh_secret as Secret,
      '30d', // Longer expiry for "keep me logged in"
    );
  } else {
    refreshToken = jwtHelpers.generateToken(
      {
        id: newUser.id,
        role: newUser.role,
      },
      config.jwt.refresh_secret as Secret,
      config.jwt.refresh_expires_in as string,
    );
  }

  return {
    isVerified: true,
    accessToken,
    refreshToken,
    keepMeLogin,
    role: newUser.role,
    user: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      phoneNumber: newUser.phoneNumber,
      profileImage: newUser.profileImage,
      role: newUser.role,
      status: newUser.status,
      logInProcess: newUser.logInProcess,
    },
  };
};

export const AuthServices = {
  signupToDb,
  loginUser,
  socialLogin,
  getMe,
  getUserForScan,
  googleLoginWithNextAuth,
  changePassword,
  forgetPassword,
  resetPassword,
  refreshToken,
  userStatusUpdate,
  generateOTP,
  verifyOTP,
  resendOTP,
  socialSignupOrLogin,
};
