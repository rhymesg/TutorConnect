import { NorwegianRegion } from '@prisma/client';

/**
 * Norwegian postal code validation and lookup utilities
 */

// Sample Norwegian postal codes with their corresponding cities and regions
// In a production environment, this would be loaded from a comprehensive database
export const NORWEGIAN_POSTAL_CODES: Record<string, { city: string; region: NorwegianRegion }> = {
  // Oslo region
  '0001': { city: 'Oslo', region: NorwegianRegion.OSLO },
  '0010': { city: 'Oslo', region: NorwegianRegion.OSLO },
  '0050': { city: 'Oslo', region: NorwegianRegion.OSLO },
  '0150': { city: 'Oslo', region: NorwegianRegion.OSLO },
  '0160': { city: 'Oslo', region: NorwegianRegion.OSLO },
  '0170': { city: 'Oslo', region: NorwegianRegion.OSLO },
  '0180': { city: 'Oslo', region: NorwegianRegion.OSLO },
  '0190': { city: 'Oslo', region: NorwegianRegion.OSLO },
  '0250': { city: 'Oslo', region: NorwegianRegion.OSLO },
  '0260': { city: 'Oslo', region: NorwegianRegion.OSLO },
  
  // Bergen region
  '5003': { city: 'Bergen', region: NorwegianRegion.BERGEN },
  '5006': { city: 'Bergen', region: NorwegianRegion.BERGEN },
  '5007': { city: 'Bergen', region: NorwegianRegion.BERGEN },
  '5020': { city: 'Bergen', region: NorwegianRegion.BERGEN },
  '5050': { city: 'Bergen', region: NorwegianRegion.BERGEN },
  '5067': { city: 'Bergen', region: NorwegianRegion.BERGEN },
  '5100': { city: 'Isdalstø', region: NorwegianRegion.HORDALAND },
  '5110': { city: 'Strusshamn', region: NorwegianRegion.HORDALAND },
  
  // Trondheim region
  '7001': { city: 'Trondheim', region: NorwegianRegion.TRONDHEIM },
  '7020': { city: 'Trondheim', region: NorwegianRegion.TRONDHEIM },
  '7030': { city: 'Trondheim', region: NorwegianRegion.TRONDHEIM },
  '7040': { city: 'Trondheim', region: NorwegianRegion.TRONDHEIM },
  '7050': { city: 'Trondheim', region: NorwegianRegion.TRONDHEIM },
  '7080': { city: 'Heimdal', region: NorwegianRegion.SOER_TROENDELAG },
  
  // Stavanger region
  '4001': { city: 'Stavanger', region: NorwegianRegion.STAVANGER },
  '4020': { city: 'Stavanger', region: NorwegianRegion.STAVANGER },
  '4050': { city: 'Sola', region: NorwegianRegion.ROGALAND },
  '4067': { city: 'Stavanger', region: NorwegianRegion.STAVANGER },
  '4070': { city: 'Randaberg', region: NorwegianRegion.ROGALAND },
  
  // Kristiansand region
  '4601': { city: 'Kristiansand', region: NorwegianRegion.KRISTIANSAND },
  '4610': { city: 'Kristiansand', region: NorwegianRegion.KRISTIANSAND },
  '4630': { city: 'Kristiansand', region: NorwegianRegion.KRISTIANSAND },
  '4640': { city: 'Søgne', region: NorwegianRegion.VEST_AGDER },
  
  // More regions - sample entries
  '1600': { city: 'Fredrikstad', region: NorwegianRegion.FREDRIKSTAD },
  '1601': { city: 'Fredrikstad', region: NorwegianRegion.FREDRIKSTAD },
  '4300': { city: 'Sandnes', region: NorwegianRegion.SANDNES },
  '4301': { city: 'Sandnes', region: NorwegianRegion.SANDNES },
  '9001': { city: 'Tromsø', region: NorwegianRegion.TROMSOE },
  '9020': { city: 'Tromsdalen', region: NorwegianRegion.TROMS },
  '3000': { city: 'Drammen', region: NorwegianRegion.DRAMMEN },
  '3001': { city: 'Drammen', region: NorwegianRegion.DRAMMEN },
  '1300': { city: 'Sandvika', region: NorwegianRegion.BAERUM },
  '1301': { city: 'Sandvika', region: NorwegianRegion.BAERUM },
  '1400': { city: 'Ski', region: NorwegianRegion.AKERSHUS },
  '1401': { city: 'Ski', region: NorwegianRegion.AKERSHUS },
};

/**
 * Validate Norwegian postal code format (4 digits)
 */
export function validateNorwegianPostalCode(postalCode: string): boolean {
  const regex = /^\d{4}$/;
  if (!regex.test(postalCode)) return false;
  
  const num = parseInt(postalCode);
  return num >= 1 && num <= 9999;
}

/**
 * Get city and region information from postal code
 */
export function getLocationFromPostalCode(postalCode: string): { 
  city: string; 
  region: NorwegianRegion; 
  valid: boolean 
} | null {
  if (!validateNorwegianPostalCode(postalCode)) {
    return null;
  }
  
  const locationInfo = NORWEGIAN_POSTAL_CODES[postalCode];
  if (locationInfo) {
    return {
      ...locationInfo,
      valid: true
    };
  }
  
  // If exact postal code not found, try to infer region from postal code ranges
  const inferredRegion = inferRegionFromPostalCode(postalCode);
  if (inferredRegion) {
    return {
      city: 'Unknown', // City name not available
      region: inferredRegion,
      valid: true
    };
  }
  
  return null;
}

/**
 * Infer Norwegian region from postal code using standard ranges
 */
export function inferRegionFromPostalCode(postalCode: string): NorwegianRegion | null {
  const code = parseInt(postalCode);
  
  // Norwegian postal code ranges (approximate) - excluding invalid ranges
  if (code >= 1 && code <= 1299) return NorwegianRegion.OSLO;
  if (code >= 1300 && code <= 1399) return NorwegianRegion.BAERUM;
  if (code >= 1400 && code <= 1499) return NorwegianRegion.AKERSHUS;
  if (code >= 1500 && code <= 1799) return NorwegianRegion.OESTFOLD;
  if (code >= 1800 && code <= 1999) return NorwegianRegion.AKERSHUS;
  if (code >= 2000 && code <= 2999) return NorwegianRegion.OESTFOLD;
  if (code >= 3000 && code <= 3999) return NorwegianRegion.BUSKERUD;
  if (code >= 4000 && code <= 4999) return NorwegianRegion.ROGALAND;
  if (code >= 5000 && code <= 5999) return NorwegianRegion.HORDALAND;
  if (code >= 6000 && code <= 6999) return NorwegianRegion.SOGN_OG_FJORDANE;
  if (code >= 7000 && code <= 7999) return NorwegianRegion.SOER_TROENDELAG;
  if (code >= 8000 && code <= 8999) return NorwegianRegion.NORDLAND;
  if (code >= 9000 && code <= 9999) return NorwegianRegion.TROMS;
  
  return null;
}

/**
 * Validate that postal code matches the given region
 */
export function validatePostalCodeRegionMatch(postalCode: string, region: NorwegianRegion): boolean {
  const locationInfo = getLocationFromPostalCode(postalCode);
  if (!locationInfo) return false;
  
  return locationInfo.region === region;
}

/**
 * Get all postal codes for a specific region
 */
export function getPostalCodesForRegion(region: NorwegianRegion): string[] {
  return Object.keys(NORWEGIAN_POSTAL_CODES).filter(
    code => NORWEGIAN_POSTAL_CODES[code].region === region
  );
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
 * Format Norwegian date
 */
export function formatNorwegianDate(date: Date): {
  long: string;  // "15. mars 2024"
  short: string; // "15.03.24"
  iso: string;   // "2024-03-15"
} {
  const longFormatter = new Intl.DateTimeFormat('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const shortFormatter = new Intl.DateTimeFormat('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
  
  return {
    long: longFormatter.format(date),
    short: shortFormatter.format(date),
    iso: date.toISOString().split('T')[0]
  };
}

/**
 * Get Norwegian holidays for a given year
 * Returns major holidays that might affect tutoring schedules
 */
export function getNorwegianHolidays(year: number): Array<{
  name: string;
  date: Date;
  type: 'public' | 'flag' | 'religious';
}> {
  const holidays = [
    { name: 'Nyttårsdag', date: new Date(year, 0, 1), type: 'public' as const },
    { name: 'Arbeidernes dag', date: new Date(year, 4, 1), type: 'public' as const },
    { name: 'Grunnlovsdagen', date: new Date(year, 4, 17), type: 'flag' as const },
    { name: 'Julaften', date: new Date(year, 11, 24), type: 'public' as const },
    { name: 'Første juledag', date: new Date(year, 11, 25), type: 'public' as const },
    { name: 'Andre juledag', date: new Date(year, 11, 26), type: 'public' as const },
  ];
  
  // Add Easter-related holidays (these require calculation)
  const easterDate = calculateEaster(year);
  const easterHolidays = [
    { name: 'Skjærtorsdag', date: new Date(easterDate.getTime() - 3 * 24 * 60 * 60 * 1000), type: 'public' as const },
    { name: 'Langfredag', date: new Date(easterDate.getTime() - 2 * 24 * 60 * 60 * 1000), type: 'public' as const },
    { name: 'Første påskedag', date: easterDate, type: 'public' as const },
    { name: 'Andre påskedag', date: new Date(easterDate.getTime() + 24 * 60 * 60 * 1000), type: 'public' as const },
    { name: 'Kristi himmelfartsdag', date: new Date(easterDate.getTime() + 39 * 24 * 60 * 60 * 1000), type: 'religious' as const },
    { name: 'Første pinsedag', date: new Date(easterDate.getTime() + 49 * 24 * 60 * 60 * 1000), type: 'religious' as const },
    { name: 'Andre pinsedag', date: new Date(easterDate.getTime() + 50 * 24 * 60 * 60 * 1000), type: 'religious' as const },
  ];
  
  return [...holidays, ...easterHolidays].sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculate Easter date for a given year (using the Western church calculation)
 */
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

/**
 * Check if a date is a Norwegian holiday
 */
export function isNorwegianHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const holidays = getNorwegianHolidays(year);
  
  return holidays.some(holiday => 
    holiday.date.toDateString() === date.toDateString()
  );
}