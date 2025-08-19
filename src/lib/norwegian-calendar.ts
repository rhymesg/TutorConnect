/**
 * Norwegian Calendar and Holiday Management
 * Provides utilities for Norwegian school terms, public holidays, and regional considerations
 */

import { format, addDays, isWeekend, isSameDay, getDay, parseISO, isWithinInterval } from 'date-fns';
import { nb } from 'date-fns/locale';

/**
 * Norwegian public holidays with exact dates for each year
 */
export const NorwegianHolidays = {
  2024: {
    'New Year': '2024-01-01',
    'Maundy Thursday': '2024-03-28',
    'Good Friday': '2024-03-29',
    'Easter Sunday': '2024-03-31',
    'Easter Monday': '2024-04-01',
    'Labour Day': '2024-05-01',
    'Ascension Day': '2024-05-09',
    'Constitution Day': '2024-05-17',
    'Whit Sunday': '2024-05-19',
    'Whit Monday': '2024-05-20',
    'Christmas Day': '2024-12-25',
    'Boxing Day': '2024-12-26',
  },
  2025: {
    'New Year': '2025-01-01',
    'Maundy Thursday': '2025-04-17',
    'Good Friday': '2025-04-18',
    'Easter Sunday': '2025-04-20',
    'Easter Monday': '2025-04-21',
    'Labour Day': '2025-05-01',
    'Constitution Day': '2025-05-17',
    'Ascension Day': '2025-05-29',
    'Whit Sunday': '2025-06-08',
    'Whit Monday': '2025-06-09',
    'Christmas Day': '2025-12-25',
    'Boxing Day': '2025-12-26',
  },
  2026: {
    'New Year': '2026-01-01',
    'Maundy Thursday': '2026-04-02',
    'Good Friday': '2026-04-03',
    'Easter Sunday': '2026-04-05',
    'Easter Monday': '2026-04-06',
    'Labour Day': '2026-05-01',
    'Ascension Day': '2026-05-14',
    'Constitution Day': '2026-05-17',
    'Whit Sunday': '2026-05-24',
    'Whit Monday': '2026-05-25',
    'Christmas Day': '2026-12-25',
    'Boxing Day': '2026-12-26',
  },
} as const;

/**
 * Norwegian school term periods for different educational levels
 */
export const NorwegianSchoolTerms = {
  2024: {
    autumn: {
      start: '2024-08-19',
      end: '2024-12-20',
      breaks: [
        { name: 'Høstferie (Autumn break)', start: '2024-10-07', end: '2024-10-18' },
      ],
    },
    winter: {
      start: '2025-01-02',
      end: '2025-02-14',
      breaks: [
        { name: 'Vinterferie (Winter break)', start: '2025-02-17', end: '2025-02-28' },
      ],
    },
    spring: {
      start: '2025-03-03',
      end: '2025-06-20',
      breaks: [
        { name: 'Påskeferie (Easter break)', start: '2025-04-14', end: '2025-04-25' },
      ],
    },
    summer: {
      start: '2025-06-21',
      end: '2025-08-17',
      breaks: [], // Summer is the main break
    },
  },
  2025: {
    autumn: {
      start: '2025-08-18',
      end: '2025-12-19',
      breaks: [
        { name: 'Høstferie (Autumn break)', start: '2025-10-06', end: '2025-10-17' },
      ],
    },
    winter: {
      start: '2026-01-05',
      end: '2026-02-13',
      breaks: [
        { name: 'Vinterferie (Winter break)', start: '2026-02-16', end: '2026-02-27' },
      ],
    },
    spring: {
      start: '2026-03-02',
      end: '2026-06-19',
      breaks: [
        { name: 'Påskeferie (Easter break)', start: '2026-03-30', end: '2026-04-10' },
      ],
    },
    summer: {
      start: '2026-06-20',
      end: '2026-08-16',
      breaks: [], // Summer is the main break
    },
  },
} as const;

/**
 * Business hours for different regions in Norway
 */
export const NorwegianBusinessHours = {
  weekdays: { start: '08:00', end: '21:00' },
  saturday: { start: '09:00', end: '18:00' },
  sunday: { start: '10:00', end: '18:00' },
  // Regional variations (some areas have different customs)
  northern: {
    weekdays: { start: '09:00', end: '20:00' },
    saturday: { start: '10:00', end: '17:00' },
    sunday: { start: '11:00', end: '17:00' },
  },
} as const;

/**
 * Norwegian time zones (Norway uses CET/CEST)
 */
export const NORWEGIAN_TIMEZONE = 'Europe/Oslo';

/**
 * Check if a date is a Norwegian public holiday
 */
export function isNorwegianHoliday(date: Date): {
  isHoliday: boolean;
  holidayName?: string;
  year?: number;
} {
  const year = date.getFullYear();
  const dateStr = format(date, 'yyyy-MM-dd');
  
  const holidays = NorwegianHolidays[year as keyof typeof NorwegianHolidays];
  if (!holidays) {
    return { isHoliday: false };
  }

  for (const [name, holidayDate] of Object.entries(holidays)) {
    if (holidayDate === dateStr) {
      return {
        isHoliday: true,
        holidayName: name,
        year,
      };
    }
  }

  return { isHoliday: false };
}

/**
 * Check if a date falls within a Norwegian school break
 */
export function isNorwegianSchoolBreak(date: Date): {
  isBreak: boolean;
  breakName?: string;
  term?: string;
  year?: number;
} {
  const year = date.getFullYear();
  const schoolYear = NorwegianSchoolTerms[year as keyof typeof NorwegianSchoolTerms];
  
  if (!schoolYear) {
    return { isBreak: false };
  }

  // Check if it's summer break
  const summerStart = parseISO(schoolYear.summer.start);
  const summerEnd = parseISO(schoolYear.summer.end);
  if (isWithinInterval(date, { start: summerStart, end: summerEnd })) {
    return {
      isBreak: true,
      breakName: 'Sommerferie (Summer break)',
      term: 'summer',
      year,
    };
  }

  // Check term breaks
  for (const [termName, termData] of Object.entries(schoolYear)) {
    if (termName === 'summer') continue;
    
    const term = termData as { breaks: Array<{ name: string; start: string; end: string }> };
    for (const breakPeriod of term.breaks) {
      const breakStart = parseISO(breakPeriod.start);
      const breakEnd = parseISO(breakPeriod.end);
      
      if (isWithinInterval(date, { start: breakStart, end: breakEnd })) {
        return {
          isBreak: true,
          breakName: breakPeriod.name,
          term: termName,
          year,
        };
      }
    }
  }

  return { isBreak: false };
}

/**
 * Check if a date is during active school term (not holidays or breaks)
 */
export function isNorwegianSchoolTerm(date: Date): {
  isActiveTerm: boolean;
  currentTerm?: string;
  year?: number;
} {
  const year = date.getFullYear();
  const schoolYear = NorwegianSchoolTerms[year as keyof typeof NorwegianSchoolTerms];
  
  if (!schoolYear) {
    return { isActiveTerm: false };
  }

  // Check each term (excluding summer which is always a break)
  for (const [termName, termData] of Object.entries(schoolYear)) {
    if (termName === 'summer') continue;
    
    const term = termData as { start: string; end: string; breaks: Array<{ name: string; start: string; end: string }> };
    const termStart = parseISO(term.start);
    const termEnd = parseISO(term.end);
    
    // Check if date is within term period
    if (isWithinInterval(date, { start: termStart, end: termEnd })) {
      // Check if it's during a break within the term
      for (const breakPeriod of term.breaks) {
        const breakStart = parseISO(breakPeriod.start);
        const breakEnd = parseISO(breakPeriod.end);
        
        if (isWithinInterval(date, { start: breakStart, end: breakEnd })) {
          return { isActiveTerm: false };
        }
      }
      
      // It's within term and not during a break
      return {
        isActiveTerm: true,
        currentTerm: termName,
        year,
      };
    }
  }

  return { isActiveTerm: false };
}

/**
 * Get the current Norwegian school term information
 */
export function getCurrentNorwegianSchoolTerm(date: Date = new Date()): {
  currentTerm?: string;
  termStart?: Date;
  termEnd?: Date;
  nextBreak?: {
    name: string;
    start: Date;
    end: Date;
  };
  isActiveTerm: boolean;
  year?: number;
} {
  const termInfo = isNorwegianSchoolTerm(date);
  
  if (!termInfo.isActiveTerm || !termInfo.currentTerm || !termInfo.year) {
    return { isActiveTerm: false };
  }

  const schoolYear = NorwegianSchoolTerms[termInfo.year as keyof typeof NorwegianSchoolTerms];
  const term = schoolYear[termInfo.currentTerm as keyof typeof schoolYear] as {
    start: string;
    end: string;
    breaks: Array<{ name: string; start: string; end: string }>;
  };

  // Find next break
  let nextBreak;
  for (const breakPeriod of term.breaks) {
    const breakStart = parseISO(breakPeriod.start);
    if (breakStart > date) {
      nextBreak = {
        name: breakPeriod.name,
        start: breakStart,
        end: parseISO(breakPeriod.end),
      };
      break;
    }
  }

  return {
    currentTerm: termInfo.currentTerm,
    termStart: parseISO(term.start),
    termEnd: parseISO(term.end),
    nextBreak,
    isActiveTerm: true,
    year: termInfo.year,
  };
}

/**
 * Validate if a tutoring appointment time is appropriate for Norwegian context
 */
export function validateNorwegianTutoringTime(
  dateTime: Date,
  studentAge?: 'child' | 'teenager' | 'adult'
): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
  context: {
    isHoliday: boolean;
    isSchoolBreak: boolean;
    isActiveTerm: boolean;
    isWeekend: boolean;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'late';
  };
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let isValid = true;

  // Check holidays
  const holidayInfo = isNorwegianHoliday(dateTime);
  const breakInfo = isNorwegianSchoolBreak(dateTime);
  const termInfo = isNorwegianSchoolTerm(dateTime);
  const isWeekendDay = isWeekend(dateTime);
  
  // Determine time of day
  const hour = dateTime.getHours();
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'late';
  if (hour >= 6 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
  else timeOfDay = 'late';

  // Validate based on context
  if (holidayInfo.isHoliday) {
    warnings.push(`${holidayInfo.holidayName} er en offentlig helligdag`);
    if (holidayInfo.holidayName?.includes('Christmas') || holidayInfo.holidayName?.includes('New Year')) {
      suggestions.push('Vurder å flytte undervisningstimen til en annen dag');
    }
  }

  if (breakInfo.isBreak && studentAge === 'child') {
    warnings.push(`${breakInfo.breakName} - mange familier reiser bort`);
    suggestions.push('Bekreft med eleven/foreldrene at de er tilgjengelige');
  }

  // Age-specific validations
  if (studentAge === 'child') {
    if (timeOfDay === 'late' || hour >= 20) {
      isValid = false;
      warnings.push('For sent på dagen for barn under 13 år');
      suggestions.push('Foreslå en time mellom 15:00-18:00 på hverdager');
    }
    
    if (timeOfDay === 'morning' && hour < 10 && !isWeekendDay) {
      warnings.push('Kan være for tidlig hvis barnet har skole');
      suggestions.push('Vurder ettermiddagstimer på skoledager');
    }
  }

  if (studentAge === 'teenager') {
    if (timeOfDay === 'late' || hour >= 21) {
      warnings.push('Sent på dagen for ungdom');
      suggestions.push('Foreslå en time før klokka 20:00');
    }
  }

  // Weekend considerations
  if (isWeekendDay) {
    if (getDay(dateTime) === 0 && hour < 11) { // Sunday morning
      warnings.push('Søndag morgen kan være problematisk for mange familier');
      suggestions.push('Vurder søndag ettermiddag eller en ukedag');
    }
  }

  // School term considerations
  if (termInfo.isActiveTerm && !isWeekendDay && timeOfDay === 'morning') {
    warnings.push('Skoletid - sjekk elevens timeplaner');
    suggestions.push('Bekreft at eleven ikke har skole på dette tidspunktet');
  }

  const context = {
    isHoliday: holidayInfo.isHoliday,
    isSchoolBreak: breakInfo.isBreak,
    isActiveTerm: termInfo.isActiveTerm,
    isWeekend: isWeekendDay,
    timeOfDay,
  };

  return {
    isValid,
    warnings,
    suggestions,
    context,
  };
}

/**
 * Get next available tutoring slots based on Norwegian context
 */
export function getNextAvailableNorwegianSlots(
  startDate: Date = new Date(),
  daysAhead: number = 14,
  studentAge?: 'child' | 'teenager' | 'adult'
): Array<{
  date: Date;
  timeSlots: Array<{
    time: string;
    isOptimal: boolean;
    warnings: string[];
  }>;
  dayContext: {
    dayName: string;
    isHoliday: boolean;
    holidayName?: string;
    isSchoolBreak: boolean;
    isActiveTerm: boolean;
  };
}> {
  const slots: Array<{
    date: Date;
    timeSlots: Array<{
      time: string;
      isOptimal: boolean;
      warnings: string[];
    }>;
    dayContext: {
      dayName: string;
      isHoliday: boolean;
      holidayName?: string;
      isSchoolBreak: boolean;
      isActiveTerm: boolean;
    };
  }> = [];

  for (let i = 1; i <= daysAhead; i++) {
    const date = addDays(startDate, i);
    const dayName = format(date, 'eeee', { locale: nb });
    
    const holidayInfo = isNorwegianHoliday(date);
    const breakInfo = isNorwegianSchoolBreak(date);
    const termInfo = isNorwegianSchoolTerm(date);
    const isWeekendDay = isWeekend(date);

    const dayContext = {
      dayName,
      isHoliday: holidayInfo.isHoliday,
      holidayName: holidayInfo.holidayName,
      isSchoolBreak: breakInfo.isBreak,
      isActiveTerm: termInfo.isActiveTerm,
    };

    // Generate time slots based on age and day type
    const timeSlots: Array<{
      time: string;
      isOptimal: boolean;
      warnings: string[];
    }> = [];

    let startHour, endHour;
    
    if (studentAge === 'child') {
      startHour = isWeekendDay ? 10 : 15; // Weekend: 10am, Weekday: 3pm (after school)
      endHour = 18; // End by 6pm for children
    } else if (studentAge === 'teenager') {
      startHour = isWeekendDay ? 9 : 15;
      endHour = 20; // Can go until 8pm for teenagers
    } else {
      startHour = 8;
      endHour = 21; // Adults have more flexibility
    }

    for (let hour = startHour; hour <= endHour; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      const slotDateTime = new Date(date);
      slotDateTime.setHours(hour, 0, 0, 0);
      
      const validation = validateNorwegianTutoringTime(slotDateTime, studentAge);
      
      timeSlots.push({
        time: timeSlot,
        isOptimal: validation.isValid && validation.warnings.length === 0,
        warnings: validation.warnings,
      });
    }

    slots.push({
      date,
      timeSlots,
      dayContext,
    });
  }

  return slots;
}

/**
 * Format date/time for Norwegian users
 */
export function formatNorwegianDateTime(date: Date): {
  date: string;
  time: string;
  weekday: string;
  full: string;
  relative: string;
} {
  return {
    date: format(date, 'dd.MM.yyyy', { locale: nb }),
    time: format(date, 'HH:mm'),
    weekday: format(date, 'EEEE', { locale: nb }),
    full: format(date, 'EEEE dd. MMMM yyyy kl. HH:mm', { locale: nb }),
    relative: formatRelativeNorwegian(date),
  };
}

/**
 * Format relative time in Norwegian
 */
function formatRelativeNorwegian(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60 && diffMinutes > 0) {
    return `om ${diffMinutes} minutter`;
  } else if (diffHours < 24 && diffHours > 0) {
    return `om ${diffHours} timer`;
  } else if (diffDays === 0) {
    return 'i dag';
  } else if (diffDays === 1) {
    return 'i morgen';
  } else if (diffDays === -1) {
    return 'i går';
  } else if (diffDays > 1 && diffDays <= 7) {
    return `om ${diffDays} dager`;
  } else if (diffDays < -1 && diffDays >= -7) {
    return `for ${Math.abs(diffDays)} dager siden`;
  } else {
    return format(date, 'dd.MM.yyyy', { locale: nb });
  }
}

/**
 * Check for optimal tutoring times based on Norwegian educational patterns
 */
export function getOptimalNorwegianTutoringTimes(): {
  weekdays: { start: string; end: string; reason: string }[];
  weekends: { start: string; end: string; reason: string }[];
  recommendations: {
    children: string[];
    teenagers: string[];
    adults: string[];
  };
} {
  return {
    weekdays: [
      { start: '15:00', end: '18:00', reason: 'Etter skole, før middag' },
      { start: '18:30', end: '20:00', reason: 'Etter middag (eldre elever)' },
    ],
    weekends: [
      { start: '10:00', end: '12:00', reason: 'Lørdag/søndag formiddag' },
      { start: '13:00', end: '17:00', reason: 'Lørdag/søndag ettermiddag' },
    ],
    recommendations: {
      children: [
        'Unngå timer før kl. 15:00 på skoledager',
        'Slutt senest kl. 18:00 på hverdager',
        'Weekender: 10:00-16:00 er ideelt',
      ],
      teenagers: [
        'Kan ha timer til kl. 20:00 på hverdager',
        'Morgen-timer fungerer bedre i helger',
        'Vurder eksamensforberedelse på kvelder',
      ],
      adults: [
        'Fleksible med tidspunkter',
        'Kveldstimer (18:00-21:00) populære',
        'Weekender kan starte tidligere',
      ],
    },
  };
}

/**
 * Export constants for external use
 */
export const NorwegianCalendarConstants = {
  TIMEZONE: NORWEGIAN_TIMEZONE,
  Holidays: NorwegianHolidays,
  SchoolTerms: NorwegianSchoolTerms,
  BusinessHours: NorwegianBusinessHours,
} as const;