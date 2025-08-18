import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';

/**
 * Appointment Management Validation Schemas
 * For TutorConnect FRONT-009: Appointment Management UI
 */

// Meeting type enum
export const MeetingType = {
  FIRST_MEETING: 'first_meeting',
  REGULAR_LESSON: 'regular_lesson',
  EXAM_PREP: 'exam_prep',
  CONSULTATION: 'consultation',
  TRIAL_LESSON: 'trial_lesson',
  INTENSIVE_SESSION: 'intensive_session',
  GROUP_LESSON: 'group_lesson',
  REVIEW_SESSION: 'review_session',
} as const;

export type MeetingTypeValue = typeof MeetingType[keyof typeof MeetingType];

// Location type enum
export const LocationType = {
  ONLINE: 'online',
  STUDENT_PLACE: 'student_place',
  TUTOR_PLACE: 'tutor_place',
  PUBLIC_LOCATION: 'public_location',
  LIBRARY: 'library',
  CAFE: 'cafe',
  SCHOOL: 'school',
} as const;

export type LocationTypeValue = typeof LocationType[keyof typeof LocationType];

// Duration options in minutes
export const DurationOptions = [30, 60, 90, 120, 150, 180, 240] as const;

// Recurring pattern enum
export const RecurringPattern = {
  NONE: 'none',
  WEEKLY: 'weekly',
  BI_WEEKLY: 'bi_weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
} as const;

export type RecurringPatternValue = typeof RecurringPattern[keyof typeof RecurringPattern];

// Reminder time options in minutes
export const ReminderOptions = [15, 30, 60, 120, 1440, 2880] as const; // 15min to 2 days

// Norwegian holidays for calendar integration
export const NorwegianHolidays = {
  2024: [
    '2024-01-01', // New Year's Day
    '2024-03-28', // Maundy Thursday
    '2024-03-29', // Good Friday
    '2024-04-01', // Easter Monday
    '2024-05-01', // Labour Day
    '2024-05-09', // Ascension Day
    '2024-05-17', // Constitution Day
    '2024-05-20', // Whit Monday
    '2024-12-25', // Christmas Day
    '2024-12-26', // Boxing Day
  ],
  2025: [
    '2025-01-01', // New Year's Day
    '2025-04-17', // Maundy Thursday
    '2025-04-18', // Good Friday
    '2025-04-21', // Easter Monday
    '2025-05-01', // Labour Day
    '2025-05-17', // Constitution Day
    '2025-05-29', // Ascension Day
    '2025-06-09', // Whit Monday
    '2025-12-25', // Christmas Day
    '2025-12-26', // Boxing Day
  ],
} as const;

// Business hours constraints for Norwegian market
export const BusinessHours = {
  weekdays: { start: '08:00', end: '21:00' },
  saturday: { start: '09:00', end: '18:00' },
  sunday: { start: '10:00', end: '18:00' },
} as const;

// Appointment creation schema
export const createAppointmentSchema = z.object({
  chatId: z.string().cuid('Invalid chat ID format'),
  dateTime: z.string().datetime('Invalid date time format'),
  duration: z.number().int().min(15).max(480).default(60), // 15 min to 8 hours
  locationType: z.nativeEnum(LocationType),
  location: z.string().min(1, 'Location is required').max(200),
  specificLocation: z.string().max(500).optional(),
  meetingType: z.nativeEnum(MeetingType),
  notes: z.string().max(1000).optional(),
  agenda: z.string().max(1000).optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.nativeEnum(RecurringPattern).optional(),
  recurringEndDate: z.string().datetime().optional(),
  reminderTime: z.number().int().min(0).max(10080).optional(), // up to 1 week
  price: z.number().positive().optional(),
  currency: z.string().length(3).default('NOK'),
  specialRate: z.boolean().default(false),
  isTrialLesson: z.boolean().default(false),
  preparationMaterials: z.array(z.string()).optional(),
  requiredMaterials: z.array(z.string()).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

// Appointment update schema
export const updateAppointmentSchema = z.object({
  dateTime: z.string().datetime().optional(),
  duration: z.number().int().min(15).max(480).optional(),
  locationType: z.nativeEnum(LocationType).optional(),
  location: z.string().min(1).max(200).optional(),
  specificLocation: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  agenda: z.string().max(1000).optional(),
  reminderTime: z.number().int().min(0).max(10080).optional(),
  price: z.number().positive().optional(),
  cancellationReason: z.string().max(500).optional(),
  preparationMaterials: z.array(z.string()).optional(),
  requiredMaterials: z.array(z.string()).optional(),
});

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

// Appointment status update schema
export const updateAppointmentStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
  teacherReady: z.boolean().optional(),
  studentReady: z.boolean().optional(),
  cancellationReason: z.string().max(500).optional(),
  completionNotes: z.string().max(1000).optional(),
});

export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;

// Appointment listing/filtering schema
export const listAppointmentsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: z.array(z.nativeEnum(AppointmentStatus)).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  chatId: z.string().cuid().optional(),
  locationType: z.array(z.nativeEnum(LocationType)).optional(),
  meetingType: z.array(z.nativeEnum(MeetingType)).optional(),
  sortBy: z.enum(['dateTime', 'createdAt', 'updatedAt']).default('dateTime'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  includeRecurring: z.boolean().default(true),
});

export type ListAppointmentsInput = z.infer<typeof listAppointmentsSchema>;

// Availability check schema
export const checkAvailabilitySchema = z.object({
  userId: z.string().cuid(),
  dateTime: z.string().datetime(),
  duration: z.number().int().min(15).max(480),
  bufferTime: z.number().int().min(0).max(120).default(15), // minutes before/after
});

export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;

// Calendar event export schema
export const calendarExportSchema = z.object({
  appointmentIds: z.array(z.string().cuid()).min(1),
  format: z.enum(['ical', 'google', 'outlook']).default('ical'),
  includeReminders: z.boolean().default(true),
  timezone: z.string().default('Europe/Oslo'),
});

export type CalendarExportInput = z.infer<typeof calendarExportSchema>;

// Appointment feedback schema
export const appointmentFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(1000).optional(),
  wouldRecommend: z.boolean().optional(),
  punctuality: z.number().int().min(1).max(5).optional(),
  preparedness: z.number().int().min(1).max(5).optional(),
  clarity: z.number().int().min(1).max(5).optional(),
  helpfulness: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
});

export type AppointmentFeedbackInput = z.infer<typeof appointmentFeedbackSchema>;

/**
 * Norwegian-specific validation helpers
 */

/**
 * Validates if the appointment time is within Norwegian business hours
 */
export function validateNorwegianBusinessHours(dateTime: string): {
  isValid: boolean;
  reason?: string;
} {
  const date = new Date(dateTime);
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  const time = date.toTimeString().slice(0, 5); // HH:MM format

  // Check if it's a Norwegian holiday
  const dateStr = date.toISOString().slice(0, 10);
  const year = date.getFullYear();
  const holidays = NorwegianHolidays[year as keyof typeof NorwegianHolidays] || [];
  
  if (holidays.includes(dateStr)) {
    return {
      isValid: false,
      reason: 'Appointments cannot be scheduled on Norwegian public holidays',
    };
  }

  // Check business hours based on day of week
  if (day >= 1 && day <= 5) { // Monday to Friday
    if (time < BusinessHours.weekdays.start || time > BusinessHours.weekdays.end) {
      return {
        isValid: false,
        reason: `Appointments on weekdays must be between ${BusinessHours.weekdays.start} and ${BusinessHours.weekdays.end}`,
      };
    }
  } else if (day === 6) { // Saturday
    if (time < BusinessHours.saturday.start || time > BusinessHours.saturday.end) {
      return {
        isValid: false,
        reason: `Appointments on Saturday must be between ${BusinessHours.saturday.start} and ${BusinessHours.saturday.end}`,
      };
    }
  } else { // Sunday
    if (time < BusinessHours.sunday.start || time > BusinessHours.sunday.end) {
      return {
        isValid: false,
        reason: `Appointments on Sunday must be between ${BusinessHours.sunday.start} and ${BusinessHours.sunday.end}`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates if the appointment is scheduled at least 24 hours in advance
 */
export function validateAdvanceNotice(dateTime: string, minimumHours: number = 24): {
  isValid: boolean;
  reason?: string;
} {
  const appointmentDate = new Date(dateTime);
  const now = new Date();
  const timeDifference = appointmentDate.getTime() - now.getTime();
  const hoursDifference = timeDifference / (1000 * 3600);

  if (hoursDifference < minimumHours) {
    return {
      isValid: false,
      reason: `Appointments must be scheduled at least ${minimumHours} hours in advance`,
    };
  }

  return { isValid: true };
}

/**
 * Validates recurring appointment patterns
 */
export function validateRecurringPattern(
  pattern: RecurringPatternValue,
  startDate: string,
  endDate?: string
): {
  isValid: boolean;
  reason?: string;
  maxOccurrences?: number;
} {
  if (pattern === RecurringPattern.NONE) {
    return { isValid: true };
  }

  if (!endDate) {
    return {
      isValid: false,
      reason: 'End date is required for recurring appointments',
    };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDifference = end.getTime() - start.getTime();
  const daysDifference = timeDifference / (1000 * 3600 * 24);

  // Maximum 6 months for recurring appointments
  if (daysDifference > 180) {
    return {
      isValid: false,
      reason: 'Recurring appointments cannot exceed 6 months',
    };
  }

  let maxOccurrences = 0;
  switch (pattern) {
    case RecurringPattern.WEEKLY:
      maxOccurrences = Math.floor(daysDifference / 7);
      break;
    case RecurringPattern.BI_WEEKLY:
      maxOccurrences = Math.floor(daysDifference / 14);
      break;
    case RecurringPattern.MONTHLY:
      maxOccurrences = Math.floor(daysDifference / 30);
      break;
  }

  if (maxOccurrences > 24) { // Max 24 recurring appointments
    return {
      isValid: false,
      reason: 'Maximum 24 recurring appointments allowed',
    };
  }

  return { isValid: true, maxOccurrences };
}

/**
 * Format Norwegian currency
 */
export function formatNorwegianCurrency(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format Norwegian date and time
 */
export function formatNorwegianDateTime(dateTime: string): {
  date: string;
  time: string;
  weekday: string;
  full: string;
} {
  const date = new Date(dateTime);
  const locale = 'nb-NO';
  const timezone = 'Europe/Oslo';

  return {
    date: date.toLocaleDateString(locale, { timezone }),
    time: date.toLocaleTimeString(locale, { 
      timezone,
      hour: '2-digit',
      minute: '2-digit'
    }),
    weekday: date.toLocaleDateString(locale, { 
      timezone,
      weekday: 'long'
    }),
    full: date.toLocaleString(locale, { 
      timezone,
      dateStyle: 'full',
      timeStyle: 'short'
    }),
  };
}

/**
 * Generate appointment title based on type and participants
 */
export function generateAppointmentTitle(
  meetingType: MeetingTypeValue,
  subject?: string,
  participantName?: string
): string {
  const typeLabels = {
    [MeetingType.FIRST_MEETING]: 'Første møte',
    [MeetingType.REGULAR_LESSON]: 'Undervisning',
    [MeetingType.EXAM_PREP]: 'Eksamensforberedelse',
    [MeetingType.CONSULTATION]: 'Konsultasjon',
    [MeetingType.TRIAL_LESSON]: 'Prøvetime',
    [MeetingType.INTENSIVE_SESSION]: 'Intensivkurs',
    [MeetingType.GROUP_LESSON]: 'Gruppetime',
    [MeetingType.REVIEW_SESSION]: 'Repetisjon',
  };

  let title = typeLabels[meetingType] || 'Avtale';
  
  if (subject) {
    title += ` - ${subject}`;
  }
  
  if (participantName) {
    title += ` med ${participantName}`;
  }

  return title;
}

/**
 * Constants for UI components
 */
export const AppointmentConstants = {
  MeetingType,
  LocationType,
  RecurringPattern,
  DurationOptions,
  ReminderOptions,
  NorwegianHolidays,
  BusinessHours,
} as const;