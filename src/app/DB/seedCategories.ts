// prisma/seed.ts

import {
  PrismaClient,
  SubscriptionTier,
  LogInProcess,
  UserRole,
  UserStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();



export async function seedDemoUser() {
  // Optional: create a demo user for testing
  const existingUser = await prisma.user.findUnique({
    where: { email: 'demo@example.com' },
  });
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('Demo1234', 12);
    await prisma.user.create({
      data: {
        fullName: 'Demo User',
        email: 'demo@example.com',
        
        password: hashedPassword,
        logInProcess: LogInProcess.EMAIL,
        isVerified: true,
        isEmailVerified: true,
        subscriptionTier: SubscriptionTier.PREMIUM,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
       
      },
    });
    console.log('✅ Demo user created (demo@example.com / Demo1234)');
  } else {
    console.log('ℹ️ Demo user already exists.');
  }
}
