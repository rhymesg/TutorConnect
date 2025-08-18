import { NorwegianRegion } from '@prisma/client';
import {
  validateNorwegianPostalCode,
  getLocationFromPostalCode,
  inferRegionFromPostalCode,
  validatePostalCodeRegionMatch,
  getPostalCodesForRegion,
  validateNorwegianPhoneNumber,
  validateNorwegianPersonalId,
  formatNorwegianCurrency,
  formatNorwegianDate,
  getNorwegianHolidays,
  isNorwegianHoliday,
  NORWEGIAN_POSTAL_CODES,
} from './norwegian-validation';

describe('Norwegian Validation Utils', () => {
  describe('validateNorwegianPostalCode', () => {
    it('should validate correct postal codes', () => {
      expect(validateNorwegianPostalCode('0123')).toBe(true);
      expect(validateNorwegianPostalCode('5020')).toBe(true);
      expect(validateNorwegianPostalCode('9999')).toBe(true);
      expect(validateNorwegianPostalCode('0001')).toBe(true);
    });

    it('should reject invalid postal codes', () => {
      expect(validateNorwegianPostalCode('123')).toBe(false); // Too short
      expect(validateNorwegianPostalCode('12345')).toBe(false); // Too long
      expect(validateNorwegianPostalCode('abcd')).toBe(false); // Non-numeric
      expect(validateNorwegianPostalCode('0000')).toBe(false); // Zero not valid
      expect(validateNorwegianPostalCode('')).toBe(false); // Empty
    });

    it('should handle edge cases', () => {
      expect(validateNorwegianPostalCode('0001')).toBe(true); // Minimum valid
      expect(validateNorwegianPostalCode('9999')).toBe(true); // Maximum valid
      expect(validateNorwegianPostalCode('-123')).toBe(false); // Negative
      expect(validateNorwegianPostalCode('12.3')).toBe(false); // With decimal
    });
  });

  describe('getLocationFromPostalCode', () => {
    it('should return location info for known postal codes', () => {
      const osloResult = getLocationFromPostalCode('0001');
      expect(osloResult).toEqual({
        city: 'Oslo',
        region: NorwegianRegion.OSLO,
        valid: true,
      });

      const bergenResult = getLocationFromPostalCode('5003');
      expect(bergenResult).toEqual({
        city: 'Bergen',
        region: NorwegianRegion.BERGEN,
        valid: true,
      });
    });

    it('should infer region for unknown postal codes', () => {
      // Test a postal code not in our database but within Oslo range
      const result = getLocationFromPostalCode('0500');
      expect(result?.region).toBe(NorwegianRegion.OSLO);
      expect(result?.city).toBe('Unknown');
      expect(result?.valid).toBe(true);
    });

    it('should return null for invalid postal codes', () => {
      expect(getLocationFromPostalCode('abc')).toBeNull();
      expect(getLocationFromPostalCode('123')).toBeNull();
      expect(getLocationFromPostalCode('')).toBeNull();
    });

    it('should handle all regions in database', () => {
      // Test that all regions in NORWEGIAN_POSTAL_CODES are properly handled
      Object.entries(NORWEGIAN_POSTAL_CODES).forEach(([code, expected]) => {
        const result = getLocationFromPostalCode(code);
        expect(result?.city).toBe(expected.city);
        expect(result?.region).toBe(expected.region);
        expect(result?.valid).toBe(true);
      });
    });
  });

  describe('inferRegionFromPostalCode', () => {
    it('should correctly infer regions from postal code ranges', () => {
      expect(inferRegionFromPostalCode('0500')).toBe(NorwegianRegion.OSLO);
      expect(inferRegionFromPostalCode('1350')).toBe(NorwegianRegion.BAERUM);
      expect(inferRegionFromPostalCode('1450')).toBe(NorwegianRegion.AKERSHUS);
      expect(inferRegionFromPostalCode('3500')).toBe(NorwegianRegion.BUSKERUD);
      expect(inferRegionFromPostalCode('4500')).toBe(NorwegianRegion.ROGALAND);
      expect(inferRegionFromPostalCode('5500')).toBe(NorwegianRegion.HORDALAND);
      expect(inferRegionFromPostalCode('6500')).toBe(NorwegianRegion.SOGN_OG_FJORDANE);
      expect(inferRegionFromPostalCode('7500')).toBe(NorwegianRegion.SOER_TROENDELAG);
      expect(inferRegionFromPostalCode('8500')).toBe(NorwegianRegion.NORDLAND);
      expect(inferRegionFromPostalCode('9500')).toBe(NorwegianRegion.TROMS);
    });

    it('should handle boundary cases', () => {
      expect(inferRegionFromPostalCode('1299')).toBe(NorwegianRegion.OSLO);
      expect(inferRegionFromPostalCode('1300')).toBe(NorwegianRegion.BAERUM);
      expect(inferRegionFromPostalCode('1399')).toBe(NorwegianRegion.BAERUM);
      expect(inferRegionFromPostalCode('1400')).toBe(NorwegianRegion.AKERSHUS);
    });

    it('should return null for out-of-range codes', () => {
      expect(inferRegionFromPostalCode('0000')).toBeNull();
      expect(inferRegionFromPostalCode('2500')).toBeNull(); // Gap in ranges
    });
  });

  describe('validatePostalCodeRegionMatch', () => {
    it('should validate matching postal code and region', () => {
      expect(validatePostalCodeRegionMatch('0001', NorwegianRegion.OSLO)).toBe(true);
      expect(validatePostalCodeRegionMatch('5003', NorwegianRegion.BERGEN)).toBe(true);
    });

    it('should reject mismatching postal code and region', () => {
      expect(validatePostalCodeRegionMatch('0001', NorwegianRegion.BERGEN)).toBe(false);
      expect(validatePostalCodeRegionMatch('5003', NorwegianRegion.OSLO)).toBe(false);
    });

    it('should handle invalid postal codes', () => {
      expect(validatePostalCodeRegionMatch('invalid', NorwegianRegion.OSLO)).toBe(false);
    });
  });

  describe('getPostalCodesForRegion', () => {
    it('should return postal codes for specific regions', () => {
      const osloCodes = getPostalCodesForRegion(NorwegianRegion.OSLO);
      expect(osloCodes).toContain('0001');
      expect(osloCodes).toContain('0010');
      expect(osloCodes.every(code => 
        NORWEGIAN_POSTAL_CODES[code].region === NorwegianRegion.OSLO
      )).toBe(true);
    });

    it('should return empty array for regions without postal codes', () => {
      // Using a region that might not have entries in our test data
      const codes = getPostalCodesForRegion(NorwegianRegion.FINNMARK);
      expect(Array.isArray(codes)).toBe(true);
    });
  });

  describe('validateNorwegianPhoneNumber', () => {
    it('should validate correct Norwegian phone numbers', () => {
      const testCases = [
        '+47 123 45 678',
        '47 123 45 678',
        '12345678',
        '0047 123 45 678',
        '004712345678',
        '+4712345678',
      ];

      testCases.forEach(phoneNumber => {
        const result = validateNorwegianPhoneNumber(phoneNumber);
        expect(result.valid).toBe(true);
        expect(result.formatted).toMatch(/^\+47 \d{3} \d{2} \d{3}$/);
      });
    });

    it('should format phone numbers correctly', () => {
      const result = validateNorwegianPhoneNumber('12345678');
      expect(result.formatted).toBe('+47 123 45 678');

      const resultWithCountryCode = validateNorwegianPhoneNumber('4787654321');
      expect(resultWithCountryCode.formatted).toBe('+47 876 54 321');
    });

    it('should reject invalid Norwegian phone numbers', () => {
      const invalidNumbers = [
        '1234567', // Too short
        '123456789', // Too long
        '01234567', // Invalid prefix
        '12345abc', // Non-numeric characters
        '', // Empty
      ];

      invalidNumbers.forEach(phoneNumber => {
        const result = validateNorwegianPhoneNumber(phoneNumber);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should handle different input formats', () => {
      const formats = [
        '123-45-678',
        '123 45 678',
        '(123) 45 678',
        '123.45.678',
      ];

      formats.forEach(phoneNumber => {
        const result = validateNorwegianPhoneNumber(phoneNumber);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('validateNorwegianPersonalId', () => {
    it('should validate basic personal ID format', () => {
      const result = validateNorwegianPersonalId('01010112345');
      expect(result.valid).toBe(true);
      expect(result.birthDate).toBeInstanceOf(Date);
      expect(result.gender).toMatch(/^(MALE|FEMALE)$/);
    });

    it('should extract birth date correctly', () => {
      const result = validateNorwegianPersonalId('01010190123');
      expect(result.valid).toBe(true);
      expect(result.birthDate?.getDate()).toBe(1);
      expect(result.birthDate?.getMonth()).toBe(0); // January is 0
      expect(result.birthDate?.getFullYear()).toBe(2001); // Born in 2001
    });

    it('should determine gender correctly', () => {
      const maleResult = validateNorwegianPersonalId('01010112345'); // 5 is odd = male
      expect(maleResult.gender).toBe('MALE');

      const femaleResult = validateNorwegianPersonalId('01010112346'); // 6 is even = female
      expect(femaleResult.gender).toBe('FEMALE');
    });

    it('should reject invalid personal IDs', () => {
      const invalidIds = [
        '123456789', // Too short
        '1234567890123', // Too long
        '99010112345', // Invalid day
        '01131112345', // Invalid month
        '01010', // Much too short
      ];

      invalidIds.forEach(id => {
        const result = validateNorwegianPersonalId(id);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should handle different century rules', () => {
      // Test different individual number ranges
      const id1900s = validateNorwegianPersonalId('01019012345'); // 1990
      expect(id1900s.birthDate?.getFullYear()).toBe(1990);

      const id2000s = validateNorwegianPersonalId('01013012345'); // 2030 -> 2030
      expect(id2000s.birthDate?.getFullYear()).toBe(2030);
    });

    it('should validate date validity', () => {
      const result = validateNorwegianPersonalId('29021112345'); // Feb 29 in non-leap year
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid birth date');
    });
  });

  describe('formatNorwegianCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatNorwegianCurrency(1000)).toBe('kr 1 000');
      expect(formatNorwegianCurrency(50)).toBe('kr 50');
      expect(formatNorwegianCurrency(1234567)).toBe('kr 1 234 567');
    });

    it('should handle zero and negative amounts', () => {
      expect(formatNorwegianCurrency(0)).toBe('kr 0');
      expect(formatNorwegianCurrency(-100)).toContain('-');
    });

    it('should not show decimal places', () => {
      expect(formatNorwegianCurrency(123.45)).toBe('kr 123');
      expect(formatNorwegianCurrency(999.99)).toBe('kr 1 000');
    });
  });

  describe('formatNorwegianDate', () => {
    it('should format dates in multiple formats', () => {
      const date = new Date('2024-03-15');
      const formatted = formatNorwegianDate(date);

      expect(formatted.long).toMatch(/15\.? mars 2024/);
      expect(formatted.short).toBe('15.03.24');
      expect(formatted.iso).toBe('2024-03-15');
    });

    it('should handle different dates correctly', () => {
      const newYear = new Date('2024-01-01');
      const formatted = formatNorwegianDate(newYear);

      expect(formatted.short).toBe('01.01.24');
      expect(formatted.iso).toBe('2024-01-01');
    });
  });

  describe('getNorwegianHolidays', () => {
    it('should return holidays for a given year', () => {
      const holidays2024 = getNorwegianHolidays(2024);
      
      expect(holidays2024).toHaveLength(13); // Should include all major holidays
      expect(holidays2024.some(h => h.name === 'Nyttårsdag')).toBe(true);
      expect(holidays2024.some(h => h.name === 'Grunnlovsdagen')).toBe(true);
      expect(holidays2024.some(h => h.name === 'Første juledag')).toBe(true);
    });

    it('should include Easter-related holidays', () => {
      const holidays2024 = getNorwegianHolidays(2024);
      
      expect(holidays2024.some(h => h.name === 'Langfredag')).toBe(true);
      expect(holidays2024.some(h => h.name === 'Første påskedag')).toBe(true);
      expect(holidays2024.some(h => h.name === 'Andre påskedag')).toBe(true);
    });

    it('should sort holidays by date', () => {
      const holidays = getNorwegianHolidays(2024);
      
      for (let i = 1; i < holidays.length; i++) {
        expect(holidays[i].date.getTime()).toBeGreaterThanOrEqual(
          holidays[i - 1].date.getTime()
        );
      }
    });

    it('should have different holiday types', () => {
      const holidays = getNorwegianHolidays(2024);
      
      expect(holidays.some(h => h.type === 'public')).toBe(true);
      expect(holidays.some(h => h.type === 'flag')).toBe(true);
      expect(holidays.some(h => h.type === 'religious')).toBe(true);
    });

    it('should calculate Easter correctly for different years', () => {
      // Easter 2024 is March 31
      const holidays2024 = getNorwegianHolidays(2024);
      const easter2024 = holidays2024.find(h => h.name === 'Første påskedag');
      expect(easter2024?.date.getMonth()).toBe(2); // March is 2
      expect(easter2024?.date.getDate()).toBe(31);
    });
  });

  describe('isNorwegianHoliday', () => {
    it('should identify Norwegian holidays', () => {
      // New Year's Day
      expect(isNorwegianHoliday(new Date('2024-01-01'))).toBe(true);
      
      // Constitution Day
      expect(isNorwegianHoliday(new Date('2024-05-17'))).toBe(true);
      
      // Christmas Day
      expect(isNorwegianHoliday(new Date('2024-12-25'))).toBe(true);
    });

    it('should identify non-holidays', () => {
      expect(isNorwegianHoliday(new Date('2024-03-14'))).toBe(false); // Random date
      expect(isNorwegianHoliday(new Date('2024-07-04'))).toBe(false); // US Independence Day
    });

    it('should work across different years', () => {
      expect(isNorwegianHoliday(new Date('2023-01-01'))).toBe(true);
      expect(isNorwegianHoliday(new Date('2025-01-01'))).toBe(true);
    });

    it('should handle Easter holidays', () => {
      const holidays2024 = getNorwegianHolidays(2024);
      const easter2024 = holidays2024.find(h => h.name === 'Første påskedag');
      
      if (easter2024) {
        expect(isNorwegianHoliday(easter2024.date)).toBe(true);
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      expect(validateNorwegianPostalCode(null as any)).toBe(false);
      expect(validateNorwegianPostalCode(undefined as any)).toBe(false);
      
      expect(validateNorwegianPhoneNumber('').valid).toBe(false);
      expect(validateNorwegianPersonalId('').valid).toBe(false);
    });

    it('should handle extreme date values', () => {
      const veryOldDate = new Date('1900-01-01');
      const veryFutureDate = new Date('2100-12-31');
      
      expect(() => formatNorwegianDate(veryOldDate)).not.toThrow();
      expect(() => formatNorwegianDate(veryFutureDate)).not.toThrow();
    });

    it('should handle large currency amounts', () => {
      expect(() => formatNorwegianCurrency(Number.MAX_SAFE_INTEGER)).not.toThrow();
      expect(() => formatNorwegianCurrency(Number.MIN_SAFE_INTEGER)).not.toThrow();
    });
  });
});