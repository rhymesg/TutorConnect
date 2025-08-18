import { z } from 'zod';
import { NorwegianRegion } from '@prisma/client';

// Norwegian postal code regex (4 digits)
const norwegianPostalCodeRegex = /^\d{4}$/;

// Strong password regex - at least 8 chars with uppercase, lowercase, number, and special char
const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Email validation with common Norwegian domains
const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(254, 'Email cannot exceed 254 characters')
  .toLowerCase()
  .transform((email) => email.trim());

// Password validation
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password cannot exceed 100 characters')
  .regex(
    passwordStrengthRegex,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

// Name validation (Norwegian names can have special characters)
const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name cannot exceed 100 characters')
  .regex(/^[a-zA-ZæøåÆØÅ\s'-]+$/, 'Name can only contain letters, spaces, apostrophes, and hyphens')
  .transform((name) => name.trim());

// Norwegian region validation
const regionSchema = z.nativeEnum(NorwegianRegion, {
  errorMap: () => ({ message: 'Valid Norwegian region required' })
});

/**
 * User Registration Schema
 */
export const registerUserSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    name: nameSchema,
    region: regionSchema,
    postalCode: z
      .string()
      .regex(norwegianPostalCodeRegex, 'Norwegian postal code must be 4 digits')
      .optional(),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, 'You must accept the terms and conditions'),
    acceptPrivacy: z
      .boolean()
      .refine((val) => val === true, 'You must accept the privacy policy'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterUserInput = z.infer<typeof registerUserSchema>;

/**
 * User Login Schema
 */
export const loginUserSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Password is required')
    .max(100, 'Password cannot exceed 100 characters'),
  remember: z.boolean().optional().default(false),
});

export type LoginUserInput = z.infer<typeof loginUserSchema>;

/**
 * Password Reset Request Schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

/**
 * Password Reset Confirmation Schema
 */
export const passwordResetConfirmSchema = z
  .object({
    token: z
      .string()
      .min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;

/**
 * Change Password Schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .max(100, 'Password cannot exceed 100 characters'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Email Verification Schema
 */
export const emailVerificationSchema = z.object({
  token: z
    .string()
    .min(1, 'Verification token is required'),
});

export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;

/**
 * Resend Verification Email Schema
 */
export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

/**
 * Token Refresh Schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * Update Profile Schema (Auth-related fields only)
 */
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  region: regionSchema.optional(),
  postalCode: z
    .string()
    .regex(norwegianPostalCodeRegex, 'Norwegian postal code must be 4 digits')
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Account Deletion Schema
 */
export const deleteAccountSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required for account deletion'),
  confirmation: z
    .string()
    .refine((val) => val === 'DELETE_MY_ACCOUNT', {
      message: 'You must type "DELETE_MY_ACCOUNT" to confirm account deletion',
    }),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

/**
 * Common validation helpers
 */

/**
 * Validate Norwegian postal code and return region info
 */
export function validateNorwegianPostalCode(postalCode: string): {
  isValid: boolean;
  region?: NorwegianRegion;
  city?: string;
} {
  if (!norwegianPostalCodeRegex.test(postalCode)) {
    return { isValid: false };
  }

  const code = parseInt(postalCode);

  // Norwegian postal code region mapping
  if (code >= 0 && code <= 1299) {
    return { isValid: true, region: NorwegianRegion.OSLO, city: 'Oslo' };
  }
  if (code >= 1300 && code <= 1999) {
    return { isValid: true, region: NorwegianRegion.AKERSHUS, city: 'Akershus' };
  }
  if (code >= 2000 && code <= 2999) {
    return { isValid: true, region: NorwegianRegion.OESTFOLD, city: 'Østfold' };
  }
  if (code >= 3000 && code <= 3999) {
    return { isValid: true, region: NorwegianRegion.BUSKERUD, city: 'Buskerud' };
  }
  if (code >= 4000 && code <= 4999) {
    return { isValid: true, region: NorwegianRegion.VESTFOLD, city: 'Vestfold' };
  }
  if (code >= 5000 && code <= 5999) {
    return { isValid: true, region: NorwegianRegion.BERGEN, city: 'Bergen/Hordaland' };
  }
  if (code >= 6000 && code <= 6999) {
    return { isValid: true, region: NorwegianRegion.SOGN_OG_FJORDANE, city: 'Sogn og Fjordane' };
  }
  if (code >= 7000 && code <= 7999) {
    return { isValid: true, region: NorwegianRegion.MOERE_OG_ROMSDAL, city: 'Møre og Romsdal' };
  }
  if (code >= 8000 && code <= 8999) {
    return { isValid: true, region: NorwegianRegion.NORDLAND, city: 'Nordland' };
  }
  if (code >= 9000 && code <= 9999) {
    return { isValid: true, region: NorwegianRegion.TROMS, city: 'Troms/Finnmark' };
  }

  // Default fallback for other codes
  return { isValid: true, region: NorwegianRegion.OSLO };
}

/**
 * Password strength checker
 */
export function checkPasswordStrength(password: string): {
  isStrong: boolean;
  score: number; // 0-5
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Password should be at least 8 characters long');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Password should contain lowercase letters');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Password should contain uppercase letters');
  }

  // Number check
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Password should contain numbers');
  }

  // Special character check
  if (/[@$!%*?&]/.test(password)) {
    score++;
  } else {
    feedback.push('Password should contain special characters (@$!%*?&)');
  }

  return {
    isStrong: score >= 4,
    score,
    feedback,
  };
}

/**
 * Email domain validation for Norwegian institutions
 */
export function isNorwegianEducationalEmail(email: string): boolean {
  const norwegianEduDomains = [
    '.no',
    'uio.no',
    'ntnu.no',
    'uib.no',
    'uis.no',
    'uit.no',
    'nord.no',
    'inn.no',
    'hiof.no',
    'hinn.no',
    'hvl.no',
    'oslomet.no',
    'usn.no',
    'kristiania.no',
  ];

  return norwegianEduDomains.some(domain => email.toLowerCase().endsWith(domain));
}