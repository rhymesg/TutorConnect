import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendVerificationEmail } from '@/lib/email';
import { z } from 'zod';

const prisma = new PrismaClient();

const resendSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = resendSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    const { email } = validationResult.data;
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json(
        { message: 'If an account exists with this email, a verification email will be sent.' },
        { status: 200 }
      );
    }
    
    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email is already verified' },
        { status: 409 }
      );
    }
    
    // Generate new verification token
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: verificationToken,
      }
    });
    
    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
      console.log('Verification email resent to:', user.email);
    } catch (emailError) {
      console.error('Failed to resend verification email:', emailError);
      return NextResponse.json(
        { message: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Verification email sent successfully' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}