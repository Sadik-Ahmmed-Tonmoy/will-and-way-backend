import {  LogInProcess, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../../shared/prisma';
import { MongoClient } from 'mongodb';

export const initiateSuperAdmin = async () => {
  // TTL index created on expiresAt field in OTP collection'
  const mongo = new MongoClient(process.env.DATABASE_URL!);
  await mongo.connect();

  const db = mongo.db(); // get default DB from URL
  const collection = db.collection('otps');

  // Create TTL index on expiresAt
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  // TTL index created on expiresAt field in otps collection
  console.log('✅ TTL index ensured on otps.expiresAt');

  await mongo.close();

  const payload = {
    fullName : 'Super Admin',
    email: 'superadmin@yopmail.com',
    password: '123456789',
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    isVerified: true,
    logInProcess: LogInProcess.EMAIL,
  };

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingSuperAdmin) {
    return;
  }

  await prisma.$transaction(async TransactionClient => {
    const hashedPassword: string = await bcrypt.hash(payload.password, 12);

    await TransactionClient.user.create({
      data: {
        email: payload.email,
        password: hashedPassword,
        role: payload.role,
        fullName: payload.fullName,
        profileImage: '',
        status: payload.status,
        isVerified: payload.isVerified,
        logInProcess: payload.logInProcess,
        isProfileCompleted: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    // await TransactionClient.superAdmin.create({
    //   data: {
    //     userId: user.id,
    //     fullName: payload.fullName,
    //   },
    // });
  });
};
