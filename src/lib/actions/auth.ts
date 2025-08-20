'use server';

import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { loginUserSchema, registerUserSchema } from '@/schemas/auth';
import { 
  ValidationError, 
  InvalidCredentialsError,
  AccountLockedError,
  RateLimitError,
  UserExistsError
} from '@/lib/errors';
import { generateTokenPair } from '@/lib/jwt';

const prisma = new PrismaClient();

export type LoginFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
} | null;

export type RegisterFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
} | null;

/**
 * React 19 Server Action for login
 */
export async function loginAction(
  prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  try {
    // Extract form data
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const remember = formData.get('remember') === 'true';

    // Validate using Zod schema
    const validatedData = loginUserSchema.parse({
      email,
      password,
      remember,
    });

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        region: true,
        postalCode: true,
        isActive: true,
        emailVerified: true,
        lastActive: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      }
    });

    // Check if user exists
    if (!user) {
      return {
        error: 'Ugyldig e-postadresse eller passord.',
      };
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      return {
        error: 'Kontoen din er midlertidig låst. Prøv igjen senere.',
      };
    }

    // Check if account is active
    if (!user.isActive) {
      return {
        error: 'Kontoen din er deaktivert. Kontakt support for hjelp.',
      };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
    if (!isValidPassword) {
      // Increment failed login attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const shouldLock = failedAttempts >= 5;
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null, // 15 minutes
        }
      });

      if (shouldLock) {
        return {
          error: 'For mange mislykkede innloggingsforsøk. Kontoen er låst i 15 minutter.',
        };
      }

      return {
        error: 'Ugyldig e-postadresse eller passord.',
      };
    }

    // Reset failed login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastActive: new Date(),
      }
    });

    // Generate token pair
    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      region: user.region,
      tokenVersion: 1,
    });

    // Set secure HTTP-only cookies
    const cookieStore = await cookies();
    const accessTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const refreshTokenExpiry = remember 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);  // 7 days

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    cookieStore.set('accessToken', tokens.accessToken, {
      ...cookieOptions,
      expires: accessTokenExpiry,
    });

    cookieStore.set('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      expires: refreshTokenExpiry,
    });

    // Store user data in localStorage (via client-side after redirect)
    cookieStore.set('userLoginSuccess', JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        region: user.region,
        postalCode: user.postalCode,
        isActive: user.isActive,
        emailVerified: !!user.emailVerified,
        lastActive: user.lastActive,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: accessTokenExpiry.toISOString(),
      requiresEmailVerification: !user.emailVerified,
    }), {
      maxAge: 60, // 1 minute - just for the redirect
      httpOnly: false, // Allow client access for localStorage
    });

    // Handle email verification requirement
    if (!user.emailVerified) {
      // Generate new verification token and send email
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
        const { sendVerificationEmail } = await import('@/lib/email');
        await sendVerificationEmail(user.email, user.name, verificationToken);
        console.log('Verification email sent to:', user.email);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Continue even if email fails
      }
      
      redirect('/auth/verify-email?message=login-verification-required&email=' + encodeURIComponent(user.email));
    }

    // Revalidate relevant pages
    revalidatePath('/dashboard');
    revalidatePath('/profile');

    // Redirect to dashboard
    redirect('/dashboard');

  } catch (error) {
    console.error('Login action error:', error);

    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      const fieldErrors: Record<string, string> = {};
      
      zodError.errors.forEach((err: any) => {
        const field = err.path[0];
        fieldErrors[field] = err.message;
      });

      return {
        fieldErrors,
      };
    }

    // Handle redirect (this is actually success)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error; // Re-throw redirect
    }

    return {
      error: 'Det oppstod en feil ved innlogging. Prøv igjen senere.',
    };
  }
}

/**
 * React 19 Server Action for registration
 */
export async function registerAction(
  prevState: RegisterFormState,
  formData: FormData
): Promise<RegisterFormState> {
  try {
    // Extract form data
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const name = formData.get('name') as string;
    const region = formData.get('region') as string;

    // Create simplified validation object
    const validationData = {
      email,
      password,
      confirmPassword,
      name,
      region,
      acceptTerms: true, // Implicit acceptance by submitting form
      acceptPrivacy: true, // Implicit acceptance by submitting form
    };

    // Validate using Zod schema
    const validatedData = registerUserSchema.parse(validationData);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return {
        error: 'En bruker med denne e-postadressen eksisterer allerede.',
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        name: validatedData.name,
        region: validatedData.region as any,
        isActive: true,
        emailVerified: null, // Will be set when email is verified
      },
    });

    // Generate verification token
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Store verification token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: verificationToken,
      }
    });

    // Send verification email
    try {
      const { sendVerificationEmail } = await import('@/lib/email');
      await sendVerificationEmail(user.email, user.name, verificationToken);
      console.log('Verification email sent to:', user.email);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails - user can still verify later
    }

    // Revalidate pages
    revalidatePath('/auth/login');

    // Redirect to email verification
    redirect('/auth/verify-email?email=' + encodeURIComponent(user.email));

  } catch (error) {
    console.error('Register action error:', error);

    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      const fieldErrors: Record<string, string> = {};
      
      zodError.errors.forEach((err: any) => {
        const field = err.path[0];
        fieldErrors[field] = err.message;
      });

      return {
        fieldErrors,
      };
    }

    // Handle redirect (this is actually success)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error; // Re-throw redirect
    }

    return {
      error: 'Det oppstod en feil ved registrering. Prøv igjen senere.',
    };
  }
}

/**
 * Logout action
 */
export async function logoutAction() {
  const cookieStore = cookies();
  
  // Clear auth cookies
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
  cookieStore.delete('userLoginSuccess');

  // Revalidate pages
  revalidatePath('/');
  revalidatePath('/dashboard');
  revalidatePath('/profile');

  // Redirect to home
  redirect('/');
}