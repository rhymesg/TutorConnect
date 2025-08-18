/**
 * Post validation schemas for TutorConnect
 * Norwegian tutoring platform with advanced search and filtering
 */

import { z } from 'zod';
import { PostType, Subject, AgeGroup, NorwegianRegion } from '@prisma/client';

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

// Norwegian postal code validation (4 digits)
export const PostalCodeSchema = z.string().regex(/^\d{4}$/, {
  message: 'Norwegian postal code must be 4 digits'
}).optional();

// Pricing validation for Norwegian market (NOK)
export const PriceSchema = z.number()
  .min(0, 'Price cannot be negative')
  .max(10000, 'Price cannot exceed 10,000 NOK per hour')
  .multipleOf(0.01, 'Price must be to the nearest øre')
  .optional();

// Create post schema
export const CreatePostSchema = z.object({
  type: PostTypeSchema,
  subject: SubjectSchema,
  ageGroups: z.array(AgeGroupSchema)
    .min(1, 'At least one age group must be selected')
    .max(4, 'Maximum 4 age groups allowed'),
  
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters')
    .trim(),
  
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim(),
  
  availableDays: z.array(WeekdaySchema)
    .min(1, 'At least one day must be selected')
    .max(7, 'Cannot select more than 7 days'),
  
  availableTimes: z.array(TimeSlotSchema)
    .min(1, 'At least one time slot must be provided')
    .max(10, 'Maximum 10 time slots allowed'),
  
  preferredSchedule: z.string()
    .max(500, 'Preferred schedule cannot exceed 500 characters')
    .trim()
    .optional(),
  
  location: NorwegianRegionSchema,
  
  specificLocation: z.string()
    .max(200, 'Specific location cannot exceed 200 characters')
    .trim()
    .optional(),
  
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

// Update post schema (all fields optional except validation rules)
export const UpdatePostSchema = z.object({
  type: PostTypeSchema.optional(),
  subject: SubjectSchema.optional(),
  ageGroups: z.array(AgeGroupSchema)
    .min(1, 'At least one age group must be selected')
    .max(4, 'Maximum 4 age groups allowed')
    .optional(),
  
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters')
    .trim()
    .optional(),
  
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .optional(),
  
  availableDays: z.array(WeekdaySchema)
    .min(1, 'At least one day must be selected')
    .max(7, 'Cannot select more than 7 days')
    .optional(),
  
  availableTimes: z.array(TimeSlotSchema)
    .min(1, 'At least one time slot must be provided')
    .max(10, 'Maximum 10 time slots allowed')
    .optional(),
  
  preferredSchedule: z.string()
    .max(500, 'Preferred schedule cannot exceed 500 characters')
    .trim()
    .optional(),
  
  location: NorwegianRegionSchema.optional(),
  
  specificLocation: z.string()
    .max(200, 'Specific location cannot exceed 200 characters')
    .trim()
    .optional(),
  
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
  CHILDREN_7_12: ['1', '2', '3', '4', '5', '6', '7'] as const,
  TEENAGERS_13_15: ['8', '9', '10'] as const,
  YOUTH_16_18: ['VG1', 'VG2', 'VG3'] as const,
  ADULTS_19_PLUS: ['University', 'Adult Education'] as const,
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