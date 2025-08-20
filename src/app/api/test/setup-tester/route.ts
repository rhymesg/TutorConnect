import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// This endpoint should only be available in test/development environments
export async function POST(request: NextRequest) {
  // Only allow in non-production environments
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_SETUP) {
    return NextResponse.json(
      { success: false, error: 'Not allowed in production' },
      { status: 403 }
    );
  }

  try {
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password required' },
        { status: 400 }
      );
    }

    const email = 'tester@tutorconnect.no';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update the password for the existing test user
      await prisma.user.update({
        where: { email },
        data: { 
          password: hashedPassword,
          isActive: true,
          emailVerified: true,
        },
      });
    } else {
      // Create new test user
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Test User',
          region: 'OSLO',
          isActive: true,
          emailVerified: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test user setup complete',
    });

  } catch (error) {
    console.error('Test user setup error:', error);
    return NextResponse.json(
      { success: false, error: 'Setup failed' },
      { status: 500 }
    );
  }
}