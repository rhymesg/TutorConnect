/**
 * Post form validation schemas with Norwegian error messages
 * Enhanced validation for the post creation/editing form
 */

import { z } from 'zod';
import { PostType, PostStatus, Subject, AgeGroup, NorwegianRegion } from '@prisma/client';
const validationMessages = {
  no: {
    required: 'Dette feltet er påkrevd',
    minLength: 'Minimum {min} tegn påkrevd',
    maxLength: 'Maksimum {max} tegn tillatt',
    time: 'Tid må være i format TT:MM',
    atLeastOne: 'Du må velge minst ett alternativ',
    maxSelections: 'Du kan velge maksimum {max} alternativer',
  },
} as const;

const activeLanguage: keyof typeof validationMessages = 'no';

const validationMessage = (key: keyof typeof validationMessages.no | string, params?: Record<string, any>) => {
  const messages = validationMessages[activeLanguage];
  let message = messages[key as keyof typeof messages] ?? key;
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      message = message.replace(`{${param}}`, value.toString());
    });
  }
  return message;
};

// Base schemas with Norwegian error messages
export const PostTypeFormSchema = z.enum(['TEACHER', 'STUDENT'], {
  errorMap: () => ({ message: 'Ugyldig annonse-type' })
});

export const PostStatusFormSchema = z.enum(['AKTIV', 'PAUSET'], {
  errorMap: () => ({ message: 'Ugyldig annonse-status' })
});

// Updated subjects to match form options
export const SubjectFormSchema = z.enum([
  'math',
  'english', 
  'korean',
  'norwegian',
  'science',
  'programming',
  'sports',
  'art',
  'music',
  'childcare',
  'other'
], {
  errorMap: () => ({ message: 'Ugyldig fagområde' })
});

// Updated age groups to match Norwegian education system
export const AgeGroupFormSchema = z.enum([
  'PRESCHOOL',
  'PRIMARY_LOWER',
  'PRIMARY_UPPER',
  'MIDDLE',
  'SECONDARY',
  'ADULTS'
], {
  errorMap: () => ({ message: 'Ugyldig aldersgruppe' })
});

// Updated Norwegian regions to match form options
export const NorwegianRegionFormSchema = z.enum([
  'OSLO',
  'BERGEN', 
  'TRONDHEIM',
  'STAVANGER',
  'KRISTIANSAND',
  'FREDRIKSTAD',
  'DRAMMEN',
  'AKERSHUS',
  'VESTFOLD',
  'ROGALAND',
  'HORDALAND'
], {
  errorMap: () => ({ message: 'Ugyldig region' })
});

// Enhanced time slots validation with Norwegian messages
export const TimeSlotFormSchema = z.string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: validationMessage('time')
  })
  .refine(time => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    return totalMinutes >= 6 * 60 && totalMinutes <= 23 * 60; // 06:00 to 23:00
  }, {
    message: 'Tid må være mellom 06:00 og 23:00'
  });

// Weekdays with Norwegian validation
export const WeekdayFormSchema = z.enum([
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
], {
  errorMap: () => ({ message: 'Ugyldig ukedag' })
});

// Enhanced pricing validation for Norwegian market
export const PriceFormSchema = z.number()
  .min(0, 'Prisen kan ikke være negativ')
  .max(1500, 'Prisen kan ikke overstige 1 500 NOK per time')
  .multipleOf(0.01, 'Prisen må være til nærmeste øre')
  .optional()
  .or(z.literal(0))
  .transform(val => val === 0 ? undefined : val);

// Title validation with Norwegian messages
export const TitleFormSchema = z.string()
  .min(5, validationMessage('minLength', { min: 5 }))
  .max(100, validationMessage('maxLength', { max: 100 }))
  .trim()
  .refine(title => {
    // Check for common spam patterns or inappropriate content
    const spamPatterns = [
      /^\s*test\s*$/i,
      /\b(gratis|free|billig)\b.*\b(sex|dating|casino)\b/i,
      /\b(kjøp|buy|salg|sell)\b.*\b(diploma|certificate|eksamen)\b/i
    ];
    return !spamPatterns.some(pattern => pattern.test(title));
  }, {
    message: 'Tittelen inneholder upassende innhold eller spam'
  });

// Description validation with Norwegian messages
export const DescriptionFormSchema = z.string()
  .min(20, validationMessage('minLength', { min: 20 }))
  .max(2000, validationMessage('maxLength', { max: 2000 }))
  .trim()
  .refine(description => {
    // Check for contact info in description (should use proper contact fields)
    const contactPatterns = [
      /\b\d{8}\b/, // Norwegian phone numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
      /\b(facebook|instagram|snapchat|whatsapp|telegram)\b/i // Social media
    ];
    return !contactPatterns.some(pattern => pattern.test(description));
  }, {
    message: 'Beskrivelsen kan ikke inneholde kontaktinformasjon. Bruk chat-funksjonen for å ta kontakt.'
  });

// Location validation
export const LocationFormSchema = z.string()
  .min(1, validationMessage('required'))
  .refine(location => {
    // Ensure it's a valid Norwegian region/county
    const validLocations = [
      'Oslo', 'Akershus', 'Bergen', 'Trondheim', 'Stavanger',
      'Vestland', 'Rogaland', 'Trøndelag', 'Viken', 'Innlandet',
      'Vestfold og Telemark', 'Agder', 'Møre og Romsdal',
      'Nordland', 'Troms og Finnmark'
    ];
    return validLocations.includes(location);
  }, {
    message: 'Ugyldig lokasjon. Velg et gyldig norsk fylke.'
  });

// Specific location validation
export const SpecificLocationFormSchema = z.string()
  .max(200, validationMessage('maxLength', { max: 200 }))
  .trim()
  .optional()
  .refine(location => {
    if (!location) return true;
    // Prevent contact info in specific location
    const contactPatterns = [
      /\b\d{8}\b/, // Phone numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Emails
    ];
    return !contactPatterns.some(pattern => pattern.test(location));
  }, {
    message: 'Stedsbeskrivelsen kan ikke inneholde kontaktinformasjon'
  });

// Enhanced create post schema with Norwegian validation
export const CreatePostFormSchema = z.object({
  type: PostTypeFormSchema,
  status: PostStatusFormSchema.optional().default('AKTIV'),
  title: TitleFormSchema,
  subject: SubjectFormSchema,
  customSubject: z.string()
    .min(1, 'Spesifiser fagområdet')
    .max(50, 'Fagområdet kan ikke være lengre enn 50 tegn')
    .optional(),
  ageGroups: z.array(AgeGroupFormSchema)
    .min(1, validationMessage('atLeastOne'))
    .max(6, validationMessage('maxSelections', { max: 6 })),
  
  description: DescriptionFormSchema,
  
  availableDays: z.array(z.string())
    .min(1, validationMessage('atLeastOne'))
    .max(7, 'Du kan ikke velge mer enn 7 dager'),
  
  // Time range
  startTime: TimeSlotFormSchema,
  endTime: TimeSlotFormSchema,
  
  location: NorwegianRegionFormSchema,
  
  // Postnummer (optional for teachers, required for students)
  postnummer: z.string()
    .regex(/^\d{4}$/, 'Postnummer må være 4 siffer')
    .optional()
    .or(z.literal('')),
  
  // Enhanced pricing validation
  hourlyRate: PriceFormSchema,
  hourlyRateMin: PriceFormSchema,
  hourlyRateMax: PriceFormSchema,
}).superRefine((data, ctx) => {
  // Validate customSubject when subject is 'other'
  if (data.subject === 'other' && (!data.customSubject || data.customSubject.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Du må spesifisere fagområdet når du velger "Annet"',
      path: ['customSubject']
    });
  }

  // Complex pricing validation with Norwegian messages
  const hasFixedRate = data.hourlyRate !== undefined && data.hourlyRate !== null;
  const hasMinRate = data.hourlyRateMin !== undefined && data.hourlyRateMin !== null;
  const hasMaxRate = data.hourlyRateMax !== undefined && data.hourlyRateMax !== null;
  
  if (hasFixedRate && (hasMinRate || hasMaxRate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Du kan ikke angi både fast pris og prisområde',
      path: ['hourlyRate']
    });
  }
  
  if (hasMinRate && hasMaxRate) {
    if (data.hourlyRateMin! >= data.hourlyRateMax!) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum pris må være lavere enn maksimum pris',
        path: ['hourlyRateMin']
      });
    }
  }
  
  if (hasMinRate && !hasMaxRate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Maksimum pris påkrevd når minimum pris er oppgitt',
      path: ['hourlyRateMax']
    });
  }
  
  if (hasMaxRate && !hasMinRate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Minimum pris påkrevd når maksimum pris er oppgitt',
      path: ['hourlyRateMin']
    });
  }
  
  // Ensure at least one pricing option
  if (!hasFixedRate && !hasMinRate && !hasMaxRate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Du må angi minst ett prisalternativ, eller la det stå tomt for "etter avtale"',
      path: ['hourlyRate']
    });
  }
  
  // Validate time range
  if (data.startTime && data.endTime) {
    const [startHours, startMinutes] = data.startTime.split(':').map(Number);
    const [endHours, endMinutes] = data.endTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    if (startTotalMinutes >= endTotalMinutes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Sluttid må være etter starttid',
        path: ['endTime']
      });
    }
  }
});

// Update schema (similar validation but all fields optional)
export const UpdatePostFormSchema = z.object({
  type: PostTypeFormSchema.optional(),
  status: PostStatusFormSchema.optional(),
  title: TitleFormSchema.optional(),
  subject: SubjectFormSchema.optional(),
  customSubject: z.string()
    .min(1, 'Spesifiser fagområdet')
    .max(50, 'Fagområdet kan ikke være lengre enn 50 tegn')
    .optional(),
  ageGroups: z.array(AgeGroupFormSchema)
    .min(1, validationMessage('atLeastOne'))
    .max(6, validationMessage('maxSelections', { max: 6 }))
    .optional(),
  
  description: DescriptionFormSchema.optional(),
  
  availableDays: z.array(z.string())
    .min(1, validationMessage('atLeastOne'))
    .max(7, 'Du kan ikke velge mer enn 7 dager')
    .optional(),
  
  // Time range
  startTime: TimeSlotFormSchema.optional(),
  endTime: TimeSlotFormSchema.optional(),
  
  location: NorwegianRegionFormSchema.optional(),
  
  // Postnummer (optional for teachers, required for students)
  postnummer: z.string()
    .regex(/^\d{4}$/, 'Postnummer må være 4 siffer')
    .optional()
    .or(z.literal('')),
  
  // Enhanced pricing validation
  hourlyRate: PriceFormSchema,
  hourlyRateMin: PriceFormSchema,
  hourlyRateMax: PriceFormSchema,
}).superRefine((data, ctx) => {
  // Apply same pricing validation if any pricing field is provided
  const hasPricing = data.hourlyRate !== undefined || data.hourlyRateMin !== undefined || data.hourlyRateMax !== undefined;
  
  if (hasPricing) {
    const hasFixedRate = data.hourlyRate !== undefined && data.hourlyRate !== null;
    const hasMinRate = data.hourlyRateMin !== undefined && data.hourlyRateMin !== null;
    const hasMaxRate = data.hourlyRateMax !== undefined && data.hourlyRateMax !== null;
    
    if (hasFixedRate && (hasMinRate || hasMaxRate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Du kan ikke angi både fast pris og prisområde',
        path: ['hourlyRate']
      });
    }
    
    if (hasMinRate && hasMaxRate && data.hourlyRateMin! >= data.hourlyRateMax!) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum pris må være lavere enn maksimum pris',
        path: ['hourlyRateMin']
      });
    }
  }
  
  // Validate customSubject when subject is 'other'
  if (data.subject === 'other' && (!data.customSubject || data.customSubject.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Du må spesifisere fagområdet når du velger "Annet"',
      path: ['customSubject']
    });
  }

  // Validate time range if provided
  if (data.startTime && data.endTime) {
    const [startHours, startMinutes] = data.startTime.split(':').map(Number);
    const [endHours, endMinutes] = data.endTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    if (startTotalMinutes >= endTotalMinutes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Sluttid må være etter starttid',
        path: ['endTime']
      });
    }
  }
});

// Export types
export type CreatePostFormInput = z.infer<typeof CreatePostFormSchema>;
export type UpdatePostFormInput = z.infer<typeof UpdatePostFormSchema>;

// Form field validation helpers
export const validateTitle = (title: string): string | null => {
  try {
    TitleFormSchema.parse(title);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || 'Ugyldig tittel';
    }
    return 'Ugyldig tittel';
  }
};

export const validateDescription = (description: string): string | null => {
  try {
    DescriptionFormSchema.parse(description);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || 'Ugyldig beskrivelse';
    }
    return 'Ugyldig beskrivelse';
  }
};

export const validatePrice = (price: number | undefined): string | null => {
  try {
    PriceFormSchema.parse(price);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || 'Ugyldig pris';
    }
    return 'Ugyldig pris';
  }
};
