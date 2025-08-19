/**
 * Post form validation schemas with Norwegian error messages
 * Enhanced validation for the post creation/editing form
 */

import { z } from 'zod';
import { PostType, Subject, AgeGroup, NorwegianRegion } from '@prisma/client';
import { forms } from '@/lib/translations';

// Helper function to create Norwegian error messages
const norMsg = (key: string, params?: Record<string, any>) => {
  let message = forms.no.validation[key as keyof typeof forms.no.validation] || key;
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      message = message.replace(`{${param}}`, value.toString());
    });
  }
  return message;
};

// Base schemas with Norwegian error messages
export const PostTypeFormSchema = z.nativeEnum(PostType, {
  errorMap: () => ({ message: 'Ugyldig annonse-type' })
});

export const SubjectFormSchema = z.nativeEnum(Subject, {
  errorMap: () => ({ message: 'Ugyldig fagområde' })
});

export const AgeGroupFormSchema = z.nativeEnum(AgeGroup, {
  errorMap: () => ({ message: 'Ugyldig aldersgruppe' })
});

export const NorwegianRegionFormSchema = z.nativeEnum(NorwegianRegion, {
  errorMap: () => ({ message: 'Ugyldig region' })
});

// Enhanced time slots validation with Norwegian messages
export const TimeSlotFormSchema = z.string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: norMsg('time')
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
  .max(10000, 'Prisen kan ikke overstige 10 000 NOK per time')
  .multipleOf(0.01, 'Prisen må være til nærmeste øre')
  .optional()
  .or(z.literal(0))
  .transform(val => val === 0 ? undefined : val);

// Title validation with Norwegian messages
export const TitleFormSchema = z.string()
  .min(5, norMsg('minLength', { min: 5 }))
  .max(100, norMsg('maxLength', { max: 100 }))
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
  .min(20, norMsg('minLength', { min: 20 }))
  .max(2000, norMsg('maxLength', { max: 2000 }))
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
  .min(1, norMsg('required'))
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
  .max(200, norMsg('maxLength', { max: 200 }))
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
  subject: SubjectFormSchema,
  ageGroups: z.array(AgeGroupFormSchema)
    .min(1, norMsg('atLeastOne'))
    .max(4, norMsg('maxSelections', { max: 4 })),
  
  title: TitleFormSchema,
  description: DescriptionFormSchema,
  
  availableDays: z.array(WeekdayFormSchema)
    .min(1, norMsg('atLeastOne'))
    .max(7, 'Du kan ikke velge mer enn 7 dager'),
  
  availableTimes: z.array(TimeSlotFormSchema)
    .min(1, 'Minst ett tidspunkt må oppgis')
    .max(10, 'Maksimum 10 tidspunkter tillatt')
    .refine(times => {
      // Ensure no duplicate times
      return new Set(times).size === times.length;
    }, {
      message: 'Kan ikke ha identiske tidspunkter'
    }),
  
  preferredSchedule: z.string()
    .max(500, norMsg('maxLength', { max: 500 }))
    .trim()
    .optional(),
  
  location: LocationFormSchema,
  specificLocation: SpecificLocationFormSchema,
  
  // Enhanced pricing validation
  hourlyRate: PriceFormSchema,
  hourlyRateMin: PriceFormSchema,
  hourlyRateMax: PriceFormSchema,
}).superRefine((data, ctx) => {
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
  
  // Validate time slots don't overlap or are too close
  if (data.availableTimes && data.availableTimes.length > 1) {
    const sortedTimes = data.availableTimes
      .map(time => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      })
      .sort((a, b) => a - b);
    
    for (let i = 1; i < sortedTimes.length; i++) {
      if (sortedTimes[i] - sortedTimes[i - 1] < 30) { // 30 minutes minimum gap
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tidspunkter må ha minst 30 minutters mellomrom',
          path: ['availableTimes']
        });
        break;
      }
    }
  }
});

// Update schema (similar validation but all fields optional)
export const UpdatePostFormSchema = CreatePostFormSchema.partial().superRefine((data, ctx) => {
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
  
  // Validate available times if provided
  if (data.availableTimes && data.availableTimes.length > 1) {
    const sortedTimes = data.availableTimes
      .map(time => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      })
      .sort((a, b) => a - b);
    
    for (let i = 1; i < sortedTimes.length; i++) {
      if (sortedTimes[i] - sortedTimes[i - 1] < 30) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tidspunkter må ha minst 30 minutters mellomrom',
          path: ['availableTimes']
        });
        break;
      }
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