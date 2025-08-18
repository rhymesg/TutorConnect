import { z } from 'zod';
import { NorwegianRegion, Gender, PrivacySetting } from '@prisma/client';

// Norwegian postal code validation (4 digits, 0000-9999)
const norwegianPostalCodeSchema = z.string()
  .regex(/^\d{4}$/, 'Invalid Norwegian postal code format')
  .refine((code) => {
    const num = parseInt(code);
    return num >= 1 && num <= 9999;
  }, 'Postal code must be between 0001 and 9999');

// Bio validation schema
const bioSchema = z.string()
  .min(10, 'Bio must be at least 10 characters')
  .max(1000, 'Bio must not exceed 1000 characters')
  .optional();

// School/Degree validation
const educationFieldSchema = z.string()
  .min(2, 'Minimum 2 characters required')
  .max(200, 'Maximum 200 characters allowed')
  .optional();

// Certifications validation
const certificationsSchema = z.string()
  .max(1000, 'Certifications must not exceed 1000 characters')
  .optional();

/**
 * Profile update validation schema
 */
export const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .optional(),
  
  region: z.nativeEnum(NorwegianRegion, {
    errorMap: () => ({ message: 'Invalid Norwegian region' })
  }).optional(),
  
  postalCode: norwegianPostalCodeSchema.optional(),
  
  gender: z.nativeEnum(Gender, {
    errorMap: () => ({ message: 'Invalid gender value' })
  }).optional(),
  
  birthYear: z.number()
    .int('Birth year must be an integer')
    .min(1900, 'Birth year must be after 1900')
    .max(new Date().getFullYear() - 13, 'Must be at least 13 years old')
    .optional(),
  
  school: educationFieldSchema,
  degree: educationFieldSchema,
  certifications: certificationsSchema,
  bio: bioSchema,
});

/**
 * Privacy settings update schema
 */
export const updatePrivacySettingsSchema = z.object({
  privacyGender: z.nativeEnum(PrivacySetting, {
    errorMap: () => ({ message: 'Invalid privacy setting for gender' })
  }).optional(),
  
  privacyAge: z.nativeEnum(PrivacySetting, {
    errorMap: () => ({ message: 'Invalid privacy setting for age' })
  }).optional(),
  
  privacyDocuments: z.nativeEnum(PrivacySetting, {
    errorMap: () => ({ message: 'Invalid privacy setting for documents' })
  }).optional(),
  
  privacyContact: z.nativeEnum(PrivacySetting, {
    errorMap: () => ({ message: 'Invalid privacy setting for contact' })
  }).optional(),
});

/**
 * Profile image upload schema
 */
export const profileImageUploadSchema = z.object({
  imageUrl: z.string()
    .url('Invalid image URL')
    .max(500, 'Image URL too long'),
});

/**
 * Norwegian postal code validation helper
 */
export function validateNorwegianPostalCode(code: string): boolean {
  const regex = /^\d{4}$/;
  if (!regex.test(code)) return false;
  
  const num = parseInt(code);
  return num >= 1 && num <= 9999;
}

/**
 * Privacy-aware profile data transformation
 */
export interface ProfilePrivacyOptions {
  isOwner: boolean;
  hasRequestPermission?: boolean;
  requesterId?: string;
}

export function applyPrivacySettings(
  profile: any,
  privacyOptions: ProfilePrivacyOptions
): any {
  const { isOwner, hasRequestPermission = false } = privacyOptions;
  
  // If it's the owner, return full profile
  if (isOwner) {
    return profile;
  }
  
  const filteredProfile = { ...profile };
  
  // Apply gender privacy
  if (profile.privacyGender === PrivacySetting.PRIVATE || 
      (profile.privacyGender === PrivacySetting.ON_REQUEST && !hasRequestPermission)) {
    delete filteredProfile.gender;
  }
  
  // Apply age privacy
  if (profile.privacyAge === PrivacySetting.PRIVATE || 
      (profile.privacyAge === PrivacySetting.ON_REQUEST && !hasRequestPermission)) {
    delete filteredProfile.birthYear;
  }
  
  // Apply document privacy
  if (profile.privacyDocuments === PrivacySetting.PRIVATE || 
      (profile.privacyDocuments === PrivacySetting.ON_REQUEST && !hasRequestPermission)) {
    delete filteredProfile.documents;
    delete filteredProfile.certifications;
    delete filteredProfile.school;
    delete filteredProfile.degree;
  }
  
  // Apply contact privacy
  if (profile.privacyContact === PrivacySetting.PRIVATE || 
      (profile.privacyContact === PrivacySetting.ON_REQUEST && !hasRequestPermission)) {
    delete filteredProfile.email;
    delete filteredProfile.postalCode;
  }
  
  // Always hide privacy settings and sensitive data from non-owners
  delete filteredProfile.privacyGender;
  delete filteredProfile.privacyAge;
  delete filteredProfile.privacyDocuments;
  delete filteredProfile.privacyContact;
  delete filteredProfile.emailVerified;
  delete filteredProfile.verificationToken;
  delete filteredProfile.password;
  
  return filteredProfile;
}

/**
 * Profile completeness calculator
 */
export function calculateProfileCompleteness(profile: any): {
  percentage: number;
  missingFields: string[];
} {
  const requiredFields = ['name', 'region', 'bio'];
  const optionalFields = ['postalCode', 'school', 'degree', 'certifications', 'profileImage'];
  
  let completedCount = 0;
  const missingFields: string[] = [];
  const totalFields = requiredFields.length + optionalFields.length;
  
  // Check required fields
  requiredFields.forEach(field => {
    if (profile[field] && profile[field].trim()) {
      completedCount++;
    } else {
      missingFields.push(field);
    }
  });
  
  // Check optional fields
  optionalFields.forEach(field => {
    if (profile[field] && profile[field].trim()) {
      completedCount++;
    }
  });
  
  return {
    percentage: Math.round((completedCount / totalFields) * 100),
    missingFields,
  };
}

/**
 * Education level validation
 */
export const educationLevelSchema = z.object({
  level: z.string().min(1, 'Education level is required'),
  institution: z.string().min(2, 'Institution name must be at least 2 characters'),
  field: z.string().min(2, 'Field of study must be at least 2 characters'),
  year: z.number()
    .int('Year must be an integer')
    .min(1980, 'Year must be after 1980')
    .max(new Date().getFullYear() + 5, 'Year cannot be more than 5 years in the future'),
  ongoing: z.boolean().default(false),
});

/**
 * Certification validation
 */
export const certificationSchema = z.object({
  name: z.string().min(2, 'Certification name must be at least 2 characters'),
  issuer: z.string().min(2, 'Issuer name must be at least 2 characters'),
  dateIssued: z.date(),
  expiryDate: z.date().optional(),
  credentialUrl: z.string().url().optional(),
  verified: z.boolean().default(false),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePrivacySettingsInput = z.infer<typeof updatePrivacySettingsSchema>;
export type ProfileImageUploadInput = z.infer<typeof profileImageUploadSchema>;
export type EducationLevelInput = z.infer<typeof educationLevelSchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;