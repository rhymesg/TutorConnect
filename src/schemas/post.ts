/**
 * Post validation schemas for TutorConnect
 * Norwegian tutoring platform with advanced search and filtering
 * Enhanced with security rules and content filtering
 */

import { z } from 'zod';
import { PostType, Subject, AgeGroup, NorwegianRegion } from '@prisma/client';
import { validateNorwegianPostalCode, validateNorwegianPhoneNumber } from '@/utils/norwegian-validation';

// Security patterns for content filtering
const SUSPICIOUS_PATTERNS = [
  // Script injection patterns
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload=/gi,
  /onerror=/gi,
  /onclick=/gi,
  /onmouseover=/gi,
  
  // SQL injection patterns
  /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b)/gi,
  
  // Command injection patterns
  /(\b(exec|eval|system|shell|cmd)\s*\()/gi,
  
  // Suspicious URLs and links
  /(https?:\/\/)?[a-z0-9\-\.]+\.(tk|ml|ga|cf|click|download|exe|zip|rar)/gi,
  
  // Social engineering keywords
  /\b(gratis\s*penger|lett\s*fortjent|garantert\s*inntekt|rask\s*penger|ingen\s*risiko)\b/gi,
];

const SPAM_PATTERNS = [
  // Excessive capitalization
  /[A-Z]{5,}/g,
  
  // Excessive punctuation
  /[!]{3,}|[?]{3,}|[.]{4,}/g,
  
  // Suspicious contact patterns
  /\b(ring\s*nå|kontakt\s*meg\s*nå|send\s*melding\s*nå)\b/gi,
  
  // Money-related spam
  /\b(100%\s*sikker|garantert\s*suksess|ingen\s*erfaring\s*nødvendig)\b/gi,
];

// Common Norwegian profanity and inappropriate words
const INAPPROPRIATE_WORDS = [
  'faen', 'helvete', 'dritt', 'satan', 'pokker',
  // Add more as needed but keep this list minimal and context-aware
];

// Security validation functions
function validateTextSecurity(text: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      errors.push('Content contains potentially malicious patterns');
      break;
    }
  }
  
  // Check for spam patterns
  let spamScore = 0;
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      spamScore++;
    }
  }
  
  if (spamScore >= 2) {
    errors.push('Content appears to be spam or promotional');
  }
  
  // Check for excessive inappropriate language
  const lowerText = text.toLowerCase();
  const inappropriateCount = INAPPROPRIATE_WORDS.reduce((count, word) => {
    return count + (lowerText.split(word).length - 1);
  }, 0);
  
  if (inappropriateCount > 2) {
    errors.push('Content contains inappropriate language');
  }
  
  // Check for excessive length without proper structure
  if (text.length > 500 && !text.includes('.') && !text.includes('!') && !text.includes('?')) {
    errors.push('Long text should be properly structured with punctuation');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Enhanced string validation with security checks
const SecureStringSchema = (minLength: number, maxLength: number, field: string) =>
  z.string()
    .min(minLength, `${field} must be at least ${minLength} characters`)
    .max(maxLength, `${field} cannot exceed ${maxLength} characters`)
    .trim()
    .refine((text) => {
      const validation = validateTextSecurity(text);
      return validation.isValid;
    }, {
      message: 'Content does not meet security requirements'
    })
    .refine((text) => {
      // Ensure it's not just whitespace or special characters
      return /[a-zA-ZæøåÆØÅ]/.test(text);
    }, {
      message: `${field} must contain actual text content`
    });

// Contact information validation
const ContactInfoSchema = z.string()
  .optional()
  .refine((text) => {
    if (!text) return true;
    
    // Check for Norwegian phone numbers
    const phoneMatches = text.match(/(\+47\s*)?[\d\s]{8,}/g);
    if (phoneMatches) {
      for (const match of phoneMatches) {
        const validation = validateNorwegianPhoneNumber(match);
        if (!validation.valid) {
          return false;
        }
      }
    }
    
    // Check for email patterns (should be minimal in posts)
    const emailCount = (text.match(/@/g) || []).length;
    if (emailCount > 1) {
      return false; // Suspicious multiple emails
    }
    
    return true;
  }, {
    message: 'Contact information contains invalid Norwegian phone numbers or suspicious patterns'
  });

// Base post validation schemas
export const PostTypeSchema = z.nativeEnum(PostType);
export const SubjectSchema = z.nativeEnum(Subject);
export const AgeGroupSchema = z.nativeEnum(AgeGroup);
export const NorwegianRegionSchema = z.nativeEnum(NorwegianRegion);

// Norwegian time slots validation
export const TimeSlotSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
  message: 'Time must be in HH:MM format (24-hour)'
});

// Norwegian weekdays validation
export const WeekdaySchema = z.enum([
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
], {
  errorMap: () => ({ message: 'Invalid weekday' })
});

// Enhanced Norwegian postal code validation
export const PostalCodeSchema = z.string()
  .regex(/^\d{4}$/, {
    message: 'Norwegian postal code must be 4 digits'
  })
  .refine((code) => {
    return validateNorwegianPostalCode(code);
  }, {
    message: 'Invalid Norwegian postal code'
  })
  .optional();

// Enhanced pricing validation for Norwegian market (NOK)
export const PriceSchema = z.number()
  .min(50, 'Minimum hourly rate is 50 NOK (prevents unrealistic low prices)')
  .max(2000, 'Maximum hourly rate is 2,000 NOK per hour (prevents price gouging)')
  .multipleOf(0.01, 'Price must be to the nearest øre')
  .refine((price) => {
    // Prevent common pricing scams
    const priceStr = price.toString();
    if (priceStr.includes('999') && priceStr.length > 3) {
      return false; // Psychological pricing often used in scams
    }
    return true;
  }, {
    message: 'Price appears suspicious'
  })
  .optional();

// Create post schema with enhanced security
export const CreatePostSchema = z.object({
  type: PostTypeSchema,
  subject: SubjectSchema,
  ageGroups: z.array(AgeGroupSchema)
    .min(1, 'At least one age group must be selected')
    .max(4, 'Maximum 4 age groups allowed'),
  
  title: SecureStringSchema(5, 100, 'Title'),
  
  description: SecureStringSchema(20, 2000, 'Description')
    .refine((desc) => {
      // Ensure description has educational content
      const educationalKeywords = [
        'læring', 'undervisning', 'hjelp', 'utdanning', 'skole', 'kurs', 'erfaring',
        'learning', 'teaching', 'help', 'education', 'school', 'course', 'experience',
        'matematikk', 'norsk', 'engelsk', 'fysikk', 'kjemi', 'biologi'
      ];
      
      const lowerDesc = desc.toLowerCase();
      const hasEducationalContent = educationalKeywords.some(keyword => 
        lowerDesc.includes(keyword)
      );
      
      return hasEducationalContent;
    }, {
      message: 'Description must contain educational content relevant to tutoring'
    }),
  
  availableDays: z.array(WeekdaySchema)
    .min(1, 'At least one day must be selected')
    .max(7, 'Cannot select more than 7 days'),
  
  availableTimes: z.array(TimeSlotSchema)
    .min(1, 'At least one time slot must be provided')
    .max(10, 'Maximum 10 time slots allowed')
    .refine((times) => {
      // Ensure realistic time slots (no overnight tutoring)
      return times.every(time => {
        const [hour] = time.split(':').map(Number);
        return hour >= 7 && hour <= 22; // 7 AM to 10 PM
      });
    }, {
      message: 'Available times should be between 07:00 and 22:00'
    }),
  
  preferredSchedule: SecureStringSchema(0, 500, 'Preferred schedule').optional(),
  
  location: NorwegianRegionSchema,
  
  specificLocation: z.string()
    .max(200, 'Specific location cannot exceed 200 characters')
    .trim()
    .optional()
    .refine((location) => {
      if (!location) return true;
      
      // Check for suspicious location patterns
      const suspiciousPatterns = [
        /private\s*location/gi,
        /meet\s*anywhere/gi,
        /your\s*place/gi,
        /mitt\s*hjem/gi, // Norwegian: my home
        /privat\s*adresse/gi // Norwegian: private address
      ];
      
      return !suspiciousPatterns.some(pattern => pattern.test(location));
    }, {
      message: 'Specific location should not contain suspicious meeting arrangements'
    }),
  
  // Pricing options for Norwegian market
  hourlyRate: PriceSchema,
  hourlyRateMin: PriceSchema,
  hourlyRateMax: PriceSchema,
}).superRefine((data, ctx) => {
  // Ensure pricing logic is consistent
  if (data.hourlyRate && (data.hourlyRateMin || data.hourlyRateMax)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Cannot specify both fixed rate and rate range',
      path: ['hourlyRate']
    });
  }
  
  if (data.hourlyRateMin && data.hourlyRateMax) {
    if (data.hourlyRateMin >= data.hourlyRateMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum rate must be less than maximum rate',
        path: ['hourlyRateMin']
      });
    }
  }
  
  if (data.hourlyRateMin && !data.hourlyRateMax) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Maximum rate required when minimum rate is specified',
      path: ['hourlyRateMax']
    });
  }
  
  if (data.hourlyRateMax && !data.hourlyRateMin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Minimum rate required when maximum rate is specified',
      path: ['hourlyRateMin']
    });
  }
  
  // Ensure at least one pricing option is provided
  if (!data.hourlyRate && !data.hourlyRateMin && !data.hourlyRateMax) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one pricing option must be provided',
      path: ['hourlyRate']
    });
  }
});

// Update post schema with enhanced security (all fields optional except validation rules)
export const UpdatePostSchema = z.object({
  type: PostTypeSchema.optional(),
  subject: SubjectSchema.optional(),
  ageGroups: z.array(AgeGroupSchema)
    .min(1, 'At least one age group must be selected')
    .max(4, 'Maximum 4 age groups allowed')
    .optional(),
  
  title: SecureStringSchema(5, 100, 'Title').optional(),
  
  description: SecureStringSchema(20, 2000, 'Description')
    .refine((desc) => {
      if (!desc) return true;
      
      // Ensure description has educational content
      const educationalKeywords = [
        'læring', 'undervisning', 'hjelp', 'utdanning', 'skole', 'kurs', 'erfaring',
        'learning', 'teaching', 'help', 'education', 'school', 'course', 'experience',
        'matematikk', 'norsk', 'engelsk', 'fysikk', 'kjemi', 'biologi'
      ];
      
      const lowerDesc = desc.toLowerCase();
      const hasEducationalContent = educationalKeywords.some(keyword => 
        lowerDesc.includes(keyword)
      );
      
      return hasEducationalContent;
    }, {
      message: 'Description must contain educational content relevant to tutoring'
    })
    .optional(),
  
  availableDays: z.array(WeekdaySchema)
    .min(1, 'At least one day must be selected')
    .max(7, 'Cannot select more than 7 days')
    .optional(),
  
  availableTimes: z.array(TimeSlotSchema)
    .min(1, 'At least one time slot must be provided')
    .max(10, 'Maximum 10 time slots allowed')
    .refine((times) => {
      if (!times) return true;
      
      // Ensure realistic time slots (no overnight tutoring)
      return times.every(time => {
        const [hour] = time.split(':').map(Number);
        return hour >= 7 && hour <= 22; // 7 AM to 10 PM
      });
    }, {
      message: 'Available times should be between 07:00 and 22:00'
    })
    .optional(),
  
  preferredSchedule: SecureStringSchema(0, 500, 'Preferred schedule').optional(),
  
  location: NorwegianRegionSchema.optional(),
  
  specificLocation: z.string()
    .max(200, 'Specific location cannot exceed 200 characters')
    .trim()
    .optional()
    .refine((location) => {
      if (!location) return true;
      
      // Check for suspicious location patterns
      const suspiciousPatterns = [
        /private\s*location/gi,
        /meet\s*anywhere/gi,
        /your\s*place/gi,
        /mitt\s*hjem/gi, // Norwegian: my home
        /privat\s*adresse/gi // Norwegian: private address
      ];
      
      return !suspiciousPatterns.some(pattern => pattern.test(location));
    }, {
      message: 'Specific location should not contain suspicious meeting arrangements'
    }),
  
  // Pricing options for Norwegian market
  hourlyRate: PriceSchema,
  hourlyRateMin: PriceSchema,
  hourlyRateMax: PriceSchema,
}).superRefine((data, ctx) => {
  // Apply same pricing validation if any pricing field is provided
  const hasPricing = data.hourlyRate !== undefined || data.hourlyRateMin !== undefined || data.hourlyRateMax !== undefined;
  
  if (hasPricing) {
    if (data.hourlyRate && (data.hourlyRateMin || data.hourlyRateMax)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cannot specify both fixed rate and rate range',
        path: ['hourlyRate']
      });
    }
    
    if (data.hourlyRateMin !== undefined && data.hourlyRateMax !== undefined) {
      if (data.hourlyRateMin >= data.hourlyRateMax) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Minimum rate must be less than maximum rate',
          path: ['hourlyRateMin']
        });
      }
    }
  }
});

// Search and filter schemas
export const PostSearchSchema = z.object({
  // Text search
  q: z.string().trim().optional(),
  
  // Core filters
  type: PostTypeSchema.optional(),
  subject: SubjectSchema.optional(),
  ageGroups: z.union([
    AgeGroupSchema,
    z.array(AgeGroupSchema)
  ]).optional().transform(val => Array.isArray(val) ? val : val ? [val] : undefined),
  
  location: NorwegianRegionSchema.optional(),
  
  // Pricing filters
  minRate: z.coerce.number().min(0).optional(),
  maxRate: z.coerce.number().min(0).optional(),
  
  // Availability filters
  availableDays: z.union([
    WeekdaySchema,
    z.array(WeekdaySchema)
  ]).optional().transform(val => Array.isArray(val) ? val : val ? [val] : undefined),
  
  // Date filters
  createdAfter: z.coerce.date().optional(),
  createdBefore: z.coerce.date().optional(),
  
  // Pagination
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  
  // Sorting
  sortBy: z.enum(['createdAt', 'updatedAt', 'hourlyRate', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Advanced filters
  hasActiveChats: z.coerce.boolean().optional(),
  userRegion: NorwegianRegionSchema.optional(),
  
  // Norwegian-specific filters
  includeNearbyRegions: z.coerce.boolean().default(false),
  onlyVerifiedUsers: z.coerce.boolean().default(false),
}).superRefine((data, ctx) => {
  // Validate price range
  if (data.minRate !== undefined && data.maxRate !== undefined) {
    if (data.minRate >= data.maxRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum rate must be less than maximum rate',
        path: ['minRate']
      });
    }
  }
  
  // Validate date range
  if (data.createdAfter && data.createdBefore) {
    if (data.createdAfter >= data.createdBefore) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Created after date must be before created before date',
        path: ['createdAfter']
      });
    }
  }
});

// Post ID parameter validation
export const PostIdSchema = z.object({
  postId: z.string().cuid('Invalid post ID format')
});

// Post statistics schema
export const PostStatsSchema = z.object({
  postId: z.string().cuid(),
  viewCount: z.number().min(0),
  chatCount: z.number().min(0),
  responseRate: z.number().min(0).max(100),
  averageResponseTime: z.number().min(0), // in minutes
  rating: z.number().min(1).max(5).optional(),
  totalRatings: z.number().min(0).optional(),
});

// Norwegian curriculum subject categories
export const NorwegianSubjectCategories = {
  CORE_SUBJECTS: ['MATHEMATICS', 'NORWEGIAN', 'ENGLISH'] as const,
  SCIENCES: ['SCIENCE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY'] as const,
  HUMANITIES: ['HISTORY', 'GEOGRAPHY'] as const,
  CREATIVE: ['ART', 'MUSIC'] as const,
  TECHNICAL: ['PROGRAMMING'] as const,
  PHYSICAL: ['SPORTS'] as const,
  OTHER: ['OTHER'] as const,
};

// Norwegian age group to grade level mapping
export const AgeGroupToGrades = {
  PRESCHOOL: ['Barnehage'] as const,
  PRIMARY_LOWER: ['1', '2', '3', '4'] as const,
  PRIMARY_UPPER: ['5', '6', '7'] as const,
  MIDDLE: ['8', '9', '10'] as const,
  SECONDARY: ['VG1', 'VG2', 'VG3'] as const,
  ADULTS: ['University', 'Adult Education'] as const,
};

// Export commonly used types
export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
export type PostSearchInput = z.infer<typeof PostSearchSchema>;
export type PostIdInput = z.infer<typeof PostIdSchema>;
export type PostStatsInput = z.infer<typeof PostStatsSchema>;

// Norwegian region proximity mapping for nearby search
export const RegionProximity: Record<NorwegianRegion, NorwegianRegion[]> = {
  OSLO: ['AKERSHUS', 'OESTFOLD', 'BUSKERUD'],
  BERGEN: ['HORDALAND', 'SOGN_OG_FJORDANE'],
  TRONDHEIM: ['SOER_TROENDELAG', 'NORD_TROENDELAG'],
  STAVANGER: ['ROGALAND', 'VEST_AGDER'],
  KRISTIANSAND: ['VEST_AGDER', 'AUST_AGDER'],
  FREDRIKSTAD: ['OESTFOLD', 'OSLO', 'AKERSHUS'],
  SANDNES: ['ROGALAND', 'STAVANGER'],
  TROMSOE: ['TROMS', 'NORDLAND'],
  DRAMMEN: ['BUSKERUD', 'OSLO', 'AKERSHUS'],
  ASKER: ['AKERSHUS', 'OSLO', 'BUSKERUD'],
  BAERUM: ['AKERSHUS', 'OSLO'],
  AKERSHUS: ['OSLO', 'OESTFOLD', 'BUSKERUD'],
  OESTFOLD: ['OSLO', 'AKERSHUS'],
  BUSKERUD: ['OSLO', 'AKERSHUS', 'DRAMMEN'],
  VESTFOLD: ['BUSKERUD', 'TELEMARK'],
  TELEMARK: ['VESTFOLD', 'AUST_AGDER'],
  AUST_AGDER: ['TELEMARK', 'VEST_AGDER', 'KRISTIANSAND'],
  VEST_AGDER: ['AUST_AGDER', 'ROGALAND', 'KRISTIANSAND'],
  ROGALAND: ['VEST_AGDER', 'HORDALAND', 'STAVANGER', 'SANDNES'],
  HORDALAND: ['ROGALAND', 'SOGN_OG_FJORDANE', 'BERGEN'],
  SOGN_OG_FJORDANE: ['HORDALAND', 'MOERE_OG_ROMSDAL'],
  MOERE_OG_ROMSDAL: ['SOGN_OG_FJORDANE', 'SOER_TROENDELAG'],
  SOER_TROENDELAG: ['MOERE_OG_ROMSDAL', 'NORD_TROENDELAG', 'TRONDHEIM'],
  NORD_TROENDELAG: ['SOER_TROENDELAG', 'NORDLAND'],
  NORDLAND: ['NORD_TROENDELAG', 'TROMS'],
  TROMS: ['NORDLAND', 'FINNMARK', 'TROMSOE'],
  FINNMARK: ['TROMS'],
};