import { format, parseISO, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { nb } from 'date-fns/locale';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';

/**
 * Norwegian Timezone Utilities for TutorConnect
 * Handles Norwegian timezone (CET/CEST) conversions and formatting
 */

export const NORWEGIAN_TIMEZONE = 'Europe/Oslo';

/**
 * Format date/time in Norwegian timezone with Norwegian locale
 */
export function formatNorwegianDateTime(
  date: string | Date,
  formatStr: string = 'dd.MM.yyyy HH:mm'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = toZonedTime(dateObj, NORWEGIAN_TIMEZONE);
  return format(zonedDate, formatStr, { 
    locale: nb,
    timeZone: NORWEGIAN_TIMEZONE 
  });
}

/**
 * Format Norwegian date only
 */
export function formatNorwegianDate(
  date: string | Date,
  formatStr: string = 'dd.MM.yyyy'
): string {
  return formatNorwegianDateTime(date, formatStr);
}

/**
 * Format Norwegian time only
 */
export function formatNorwegianTime(
  date: string | Date,
  formatStr: string = 'HH:mm'
): string {
  return formatNorwegianDateTime(date, formatStr);
}

/**
 * Get relative time in Norwegian
 */
export function getNorwegianRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? parseISO(date) : date;
  const diff = targetDate.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (Math.abs(days) >= 1) {
    if (days === 1) return 'i morgen';
    if (days === -1) return 'i går';
    if (days > 1) return `om ${days} dager`;
    return `for ${Math.abs(days)} dager siden`;
  }

  if (Math.abs(hours) >= 1) {
    if (hours > 0) return `om ${hours} time${hours === 1 ? '' : 'r'}`;
    return `for ${Math.abs(hours)} time${Math.abs(hours) === 1 ? '' : 'r'} siden`;
  }

  if (Math.abs(minutes) >= 1) {
    if (minutes > 0) return `om ${minutes} minutt${minutes === 1 ? '' : 'er'}`;
    return `for ${Math.abs(minutes)} minutt${Math.abs(minutes) === 1 ? '' : 'er'} siden`;
  }

  return 'nå';
}

/**
 * Convert local time to Norwegian timezone
 */
export function toNorwegianTime(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(dateObj, NORWEGIAN_TIMEZONE);
}

/**
 * Convert Norwegian timezone to UTC
 */
export function fromNorwegianTime(date: Date): Date {
  return fromZonedTime(date, NORWEGIAN_TIMEZONE);
}

/**
 * Get current Norwegian time
 */
export function getNorwegianNow(): Date {
  return toNorwegianTime(new Date());
}

/**
 * Check if a time is within Norwegian business hours
 * Different rules for different days of the week
 */
export function isNorwegianBusinessHours(
  date: string | Date,
  options: {
    strictWeekdays?: boolean; // Exclude weekends
    allowSundays?: boolean;   // Allow Sunday bookings
    region?: 'urban' | 'rural' | 'northern'; // Regional variations
  } = {}
): boolean {
  const {
    strictWeekdays = false,
    allowSundays = false,
    region = 'urban'
  } = options;

  const norwegianDate = toNorwegianTime(date);
  const dayOfWeek = norwegianDate.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = norwegianDate.getHours();
  const minute = norwegianDate.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  // Weekend handling
  if (dayOfWeek === 0 && !allowSundays) return false; // Sunday
  if (dayOfWeek === 6 && strictWeekdays) return false; // Saturday

  // Different business hours by region and day
  let startTime: number, endTime: number;

  switch (dayOfWeek) {
    case 0: // Sunday
      if (!allowSundays) return false;
      startTime = region === 'northern' ? 11 * 60 : 10 * 60; // 10:00 or 11:00
      endTime = 18 * 60; // 18:00
      break;
    case 6: // Saturday
      startTime = region === 'northern' ? 10 * 60 : 9 * 60; // 09:00 or 10:00
      endTime = region === 'urban' ? 17 * 60 : 16 * 60; // 16:00 or 17:00
      break;
    default: // Monday to Friday
      startTime = 8 * 60; // 08:00
      endTime = region === 'northern' ? 19 * 60 : 20 * 60; // 19:00 or 20:00
  }

  return timeInMinutes >= startTime && timeInMinutes <= endTime;
}

/**
 * Get Norwegian business hours for a specific day
 */
export function getNorwegianBusinessHours(
  date: string | Date,
  region: 'urban' | 'rural' | 'northern' = 'urban'
): { start: string; end: string; isBusinessDay: boolean } {
  const norwegianDate = toNorwegianTime(date);
  const dayOfWeek = norwegianDate.getDay();

  let start: string, end: string, isBusinessDay: boolean = true;

  switch (dayOfWeek) {
    case 0: // Sunday
      start = region === 'northern' ? '11:00' : '10:00';
      end = '18:00';
      isBusinessDay = false; // Generally not a business day
      break;
    case 6: // Saturday
      start = region === 'northern' ? '10:00' : '09:00';
      end = region === 'urban' ? '17:00' : '16:00';
      isBusinessDay = true;
      break;
    default: // Monday to Friday
      start = '08:00';
      end = region === 'northern' ? '19:00' : '20:00';
      isBusinessDay = true;
  }

  return { start, end, isBusinessDay };
}

/**
 * Check if date is during Norwegian summer time (daylight saving)
 */
export function isNorwegianSummerTime(date: string | Date): boolean {
  const year = new Date(date).getFullYear();
  
  // DST in Norway: Last Sunday in March to last Sunday in October
  const lastSundayMarch = new Date(year, 2, 31 - ((new Date(year, 2, 31).getDay() + 7) % 7));
  const lastSundayOctober = new Date(year, 9, 31 - ((new Date(year, 9, 31).getDay() + 7) % 7));
  
  const targetDate = typeof date === 'string' ? parseISO(date) : date;
  
  return isWithinInterval(targetDate, {
    start: lastSundayMarch,
    end: lastSundayOctober
  });
}

/**
 * Get timezone offset for Norwegian timezone
 */
export function getNorwegianTimezoneOffset(date: string | Date): number {
  const isSummer = isNorwegianSummerTime(date);
  return isSummer ? 2 : 1; // CEST (+2) or CET (+1)
}

/**
 * Format appointment time for Norwegian users
 * Shows both date and relative time when appropriate
 */
export function formatAppointmentTime(
  date: string | Date,
  options: {
    showRelative?: boolean;
    includeTimezone?: boolean;
    format?: 'short' | 'long';
  } = {}
): string {
  const {
    showRelative = true,
    includeTimezone = false,
    format = 'short'
  } = options;

  const norwegianDate = formatNorwegianDateTime(date);
  let result = norwegianDate;

  if (format === 'long') {
    result = formatNorwegianDateTime(date, 'EEEE d. MMMM yyyy, HH:mm');
  }

  if (showRelative) {
    const relative = getNorwegianRelativeTime(date);
    if (relative !== norwegianDate) {
      result = `${result} (${relative})`;
    }
  }

  if (includeTimezone) {
    const offset = getNorwegianTimezoneOffset(date);
    const tzName = isNorwegianSummerTime(date) ? 'CEST' : 'CET';
    result = `${result} ${tzName} (UTC+${offset})`;
  }

  return result;
}

/**
 * Norwegian time slots generator
 * Generates available time slots based on Norwegian business culture
 */
export function generateNorwegianTimeSlots(
  date: string | Date,
  options: {
    duration?: number; // in minutes
    startTime?: string; // HH:mm format
    endTime?: string; // HH:mm format
    interval?: number; // slot interval in minutes
    excludeLunch?: boolean; // Exclude 12:00-13:00
    region?: 'urban' | 'rural' | 'northern';
  } = {}
): Array<{ start: string; end: string; label: string }> {
  const {
    duration = 60,
    interval = 30,
    excludeLunch = true,
    region = 'urban'
  } = options;

  const businessHours = getNorwegianBusinessHours(date, region);
  const startTime = options.startTime || businessHours.start;
  const endTime = options.endTime || businessHours.end;

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  const slots: Array<{ start: string; end: string; label: string }> = [];

  for (let current = startMinutes; current + duration <= endMinutes; current += interval) {
    const slotStartHour = Math.floor(current / 60);
    const slotStartMin = current % 60;
    const slotEndMin = current + duration;
    const slotEndHour = Math.floor(slotEndMin / 60);
    const slotEndMinutes = slotEndMin % 60;

    // Skip lunch time if specified
    if (excludeLunch && slotStartHour === 12 && slotStartMin === 0) {
      continue;
    }

    const startStr = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMin.toString().padStart(2, '0')}`;
    const endStr = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinutes.toString().padStart(2, '0')}`;
    
    slots.push({
      start: startStr,
      end: endStr,
      label: `${startStr} - ${endStr}`
    });
  }

  return slots;
}

/**
 * Validate appointment time against Norwegian constraints
 */
export function validateNorwegianAppointmentTime(
  date: string | Date,
  options: {
    minAdvanceHours?: number;
    maxAdvanceDays?: number;
    allowWeekends?: boolean;
    allowHolidays?: boolean;
    region?: 'urban' | 'rural' | 'northern';
  } = {}
): {
  valid: boolean;
  reason?: string;
  suggestions?: string[];
} {
  const {
    minAdvanceHours = 2,
    maxAdvanceDays = 90,
    allowWeekends = true,
    allowHolidays = false,
    region = 'urban'
  } = options;

  const now = getNorwegianNow();
  const appointmentDate = toNorwegianTime(date);
  const diffMs = appointmentDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // Check advance notice
  if (diffHours < minAdvanceHours) {
    return {
      valid: false,
      reason: `Avtaler må bestilles minst ${minAdvanceHours} timer i forveien`,
      suggestions: ['Velg et senere tidspunkt']
    };
  }

  // Check maximum advance
  if (diffDays > maxAdvanceDays) {
    return {
      valid: false,
      reason: `Avtaler kan ikke bestilles mer enn ${maxAdvanceDays} dager i forveien`,
      suggestions: ['Velg en tidligere dato']
    };
  }

  // Check weekend restrictions
  const dayOfWeek = appointmentDate.getDay();
  if (!allowWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return {
      valid: false,
      reason: 'Avtaler kan ikke bestilles i helger',
      suggestions: ['Velg en ukedag', 'Kontakt for spesielle ønsker']
    };
  }

  // Check business hours
  if (!isNorwegianBusinessHours(appointmentDate, { region, allowSundays: allowWeekends })) {
    const businessHours = getNorwegianBusinessHours(appointmentDate, region);
    return {
      valid: false,
      reason: `Utenfor åpningstider (${businessHours.start} - ${businessHours.end})`,
      suggestions: [`Velg mellom ${businessHours.start} og ${businessHours.end}`]
    };
  }

  // All checks passed
  return { valid: true };
}