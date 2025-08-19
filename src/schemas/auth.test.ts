import {
  registerUserSchema,
  loginUserSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  changePasswordSchema,
  emailVerificationSchema,
  resendVerificationSchema,
  refreshTokenSchema,
  updateProfileSchema,
  deleteAccountSchema,
  validateNorwegianPostalCode,
  checkPasswordStrength,
  isNorwegianEducationalEmail,
} from './auth';
import { NorwegianRegion } from '@prisma/client';

describe('Auth Schemas', () => {
  describe('registerUserSchema', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'StrongP@ssw0rd',
      confirmPassword: 'StrongP@ssw0rd',
      name: 'Test User',
      region: NorwegianRegion.OSLO,
      postalCode: '0123',
      acceptTerms: true,
      acceptPrivacy: true,
    };

    it('should validate correct registration data', () => {
      const result = registerUserSchema.safeParse(validRegistrationData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.name).toBe('Test User');
      }
    });

    it('should normalize email to lowercase', () => {
      const data = { ...validRegistrationData, email: 'TEST@EXAMPLE.COM' };
      const result = registerUserSchema.safeParse(data);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should trim whitespace from name', () => {
      const data = { ...validRegistrationData, name: '  Test User  ' };
      const result = registerUserSchema.safeParse(data);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test User');
      }
    });

    it('should reject invalid email formats', () => {
      const data = { ...validRegistrationData, email: 'invalid-email' };
      const result = registerUserSchema.safeParse(data);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email format');
      }
    });

    it('should reject weak passwords', () => {
      const data = { ...validRegistrationData, password: 'weak', confirmPassword: 'weak' };
      const result = registerUserSchema.safeParse(data);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(issue => issue.path[0] === 'password');
        expect(passwordError?.message).toContain('Password must be at least 8 characters');
      }
    });

    it('should reject mismatched passwords', () => {
      const data = { 
        ...validRegistrationData, 
        password: 'StrongP@ssw0rd1',
        confirmPassword: 'StrongP@ssw0rd2'
      };
      const result = registerUserSchema.safeParse(data);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.issues.find(issue => issue.path[0] === 'confirmPassword');
        expect(confirmError?.message).toBe('Passwords do not match');
      }
    });

    it('should reject invalid Norwegian names', () => {
      const data = { ...validRegistrationData, name: 'Test123' };
      const result = registerUserSchema.safeParse(data);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('can only contain letters');
      }
    });

    it('should accept Norwegian characters in names', () => {
      const data = { ...validRegistrationData, name: 'Bjørn Åse' };
      const result = registerUserSchema.safeParse(data);
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid postal codes', () => {
      const data = { ...validRegistrationData, postalCode: '123' };
      const result = registerUserSchema.safeParse(data);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Norwegian postal code must be 4 digits');
      }
    });

    it('should require terms acceptance', () => {
      const data = { ...validRegistrationData, acceptTerms: false };
      const result = registerUserSchema.safeParse(data);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('You must accept the terms and conditions');
      }
    });

    it('should require privacy policy acceptance', () => {
      const data = { ...validRegistrationData, acceptPrivacy: false };
      const result = registerUserSchema.safeParse(data);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('You must accept the privacy policy');
      }
    });

    it('should allow optional postal code', () => {
      const { postalCode, ...dataWithoutPostalCode } = validRegistrationData;
      const result = registerUserSchema.safeParse(dataWithoutPostalCode);
      
      expect(result.success).toBe(true);
    });
  });

  describe('loginUserSchema', () => {
    it('should validate correct login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        remember: true,
      };
      
      const result = loginUserSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.remember).toBe(true);
      }
    });

    it('should default remember to false', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      const result = loginUserSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.remember).toBe(false);
      }
    });

    it('should require password', () => {
      const data = { email: 'test@example.com' };
      const result = loginUserSchema.safeParse(data);
      
      expect(result.success).toBe(false);
    });

    it('should normalize email to lowercase', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      };
      
      const result = loginUserSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });
  });

  describe('passwordResetRequestSchema', () => {
    it('should validate email for password reset', () => {
      const result = passwordResetRequestSchema.safeParse({
        email: 'test@example.com'
      });
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = passwordResetRequestSchema.safeParse({
        email: 'invalid-email'
      });
      
      expect(result.success).toBe(false);
    });
  });

  describe('passwordResetConfirmSchema', () => {
    it('should validate password reset confirmation', () => {
      const data = {
        token: 'valid-reset-token',
        password: 'NewStr0ng@Password',
        confirmPassword: 'NewStr0ng@Password',
      };
      
      const result = passwordResetConfirmSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const data = {
        token: 'valid-reset-token',
        password: 'NewStr0ng@Password1',
        confirmPassword: 'NewStr0ng@Password2',
      };
      
      const result = passwordResetConfirmSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Passwords do not match');
      }
    });

    it('should require reset token', () => {
      const data = {
        password: 'NewStr0ng@Password',
        confirmPassword: 'NewStr0ng@Password',
      };
      
      const result = passwordResetConfirmSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('should validate password change', () => {
      const data = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewStr0ng@Password',
        confirmNewPassword: 'NewStr0ng@Password',
      };
      
      const result = changePasswordSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject same current and new password', () => {
      const data = {
        currentPassword: 'SamePassword123@',
        newPassword: 'SamePassword123@',
        confirmNewPassword: 'SamePassword123@',
      };
      
      const result = changePasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find(issue => issue.path[0] === 'newPassword');
        expect(error?.message).toBe('New password must be different from current password');
      }
    });
  });

  describe('emailVerificationSchema', () => {
    it('should validate email verification token', () => {
      const result = emailVerificationSchema.safeParse({
        token: 'verification-token'
      });
      
      expect(result.success).toBe(true);
    });

    it('should require token', () => {
      const result = emailVerificationSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('deleteAccountSchema', () => {
    it('should validate account deletion', () => {
      const data = {
        password: 'current-password',
        confirmation: 'DELETE_MY_ACCOUNT',
      };
      
      const result = deleteAccountSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject incorrect confirmation text', () => {
      const data = {
        password: 'current-password',
        confirmation: 'delete my account',
      };
      
      const result = deleteAccountSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('DELETE_MY_ACCOUNT');
      }
    });
  });
});

describe('Validation Helpers', () => {
  describe('validateNorwegianPostalCode', () => {
    it('should validate Oslo postal codes', () => {
      const result = validateNorwegianPostalCode('0123');
      expect(result.isValid).toBe(true);
      expect(result.region).toBe(NorwegianRegion.OSLO);
      expect(result.city).toBe('Oslo');
    });

    it('should validate Bergen postal codes', () => {
      const result = validateNorwegianPostalCode('5020');
      expect(result.isValid).toBe(true);
      expect(result.region).toBe(NorwegianRegion.BERGEN);
      expect(result.city).toBe('Bergen/Hordaland');
    });

    it('should validate Troms postal codes', () => {
      const result = validateNorwegianPostalCode('9000');
      expect(result.isValid).toBe(true);
      expect(result.region).toBe(NorwegianRegion.TROMS);
      expect(result.city).toBe('Troms/Finnmark');
    });

    it('should reject invalid postal code format', () => {
      const result = validateNorwegianPostalCode('123');
      expect(result.isValid).toBe(false);
      expect(result.region).toBeUndefined();
    });

    it('should reject non-numeric postal codes', () => {
      const result = validateNorwegianPostalCode('ABCD');
      expect(result.isValid).toBe(false);
    });

    it('should handle edge cases', () => {
      // Test boundaries
      expect(validateNorwegianPostalCode('1299').region).toBe(NorwegianRegion.OSLO);
      expect(validateNorwegianPostalCode('1300').region).toBe(NorwegianRegion.AKERSHUS);
    });
  });

  describe('checkPasswordStrength', () => {
    it('should identify strong passwords', () => {
      const result = checkPasswordStrength('StrongP@ssw0rd');
      expect(result.isStrong).toBe(true);
      expect(result.score).toBe(5);
      expect(result.feedback).toHaveLength(0);
    });

    it('should identify weak passwords and provide feedback', () => {
      const result = checkPasswordStrength('weak');
      expect(result.isStrong).toBe(false);
      expect(result.score).toBe(1); // Only lowercase
      expect(result.feedback).toContain('Password should be at least 8 characters long');
      expect(result.feedback).toContain('Password should contain uppercase letters');
      expect(result.feedback).toContain('Password should contain numbers');
      expect(result.feedback).toContain('Password should contain special characters (@$!%*?&)');
    });

    it('should handle passwords with some criteria met', () => {
      const result = checkPasswordStrength('Password123');
      expect(result.isStrong).toBe(true); // Score 4 is considered strong 
      expect(result.score).toBe(4); // Missing special character
      expect(result.feedback).toContain('Password should contain special characters (@$!%*?&)');
    });

    it('should handle empty password', () => {
      const result = checkPasswordStrength('');
      expect(result.isStrong).toBe(false);
      expect(result.score).toBe(0);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should handle password with Norwegian characters', () => {
      const result = checkPasswordStrength('Pæssw0rd@');
      expect(result.isStrong).toBe(true);
      expect(result.score).toBe(5);
    });
  });

  describe('isNorwegianEducationalEmail', () => {
    it('should identify Norwegian educational emails', () => {
      expect(isNorwegianEducationalEmail('student@uio.no')).toBe(true);
      expect(isNorwegianEducationalEmail('teacher@ntnu.no')).toBe(true);
      expect(isNorwegianEducationalEmail('user@oslomet.no')).toBe(true);
    });

    it('should identify generic Norwegian domains', () => {
      expect(isNorwegianEducationalEmail('user@example.no')).toBe(true);
    });

    it('should reject non-Norwegian emails', () => {
      expect(isNorwegianEducationalEmail('user@gmail.com')).toBe(false);
      expect(isNorwegianEducationalEmail('student@harvard.edu')).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(isNorwegianEducationalEmail('USER@UIO.NO')).toBe(true);
      expect(isNorwegianEducationalEmail('Student@NTNU.NO')).toBe(true);
    });

    it('should handle empty or invalid emails', () => {
      expect(isNorwegianEducationalEmail('')).toBe(false);
      expect(isNorwegianEducationalEmail('invalid-email')).toBe(false);
    });
  });
});

describe('Schema Edge Cases', () => {
  describe('Email validation edge cases', () => {
    it('should handle very long emails', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = loginUserSchema.safeParse({
        email: longEmail,
        password: 'password123'
      });
      
      expect(result.success).toBe(false);
    });

    it('should handle very short emails', () => {
      const result = loginUserSchema.safeParse({
        email: 'a@b',
        password: 'password123'
      });
      
      expect(result.success).toBe(false);
    });

  });

  describe('Name validation edge cases', () => {
    it('should handle names with apostrophes', () => {
      const data = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd',
        confirmPassword: 'StrongP@ssw0rd',
        name: "O'Connor",
        region: NorwegianRegion.OSLO,
        acceptTerms: true,
        acceptPrivacy: true,
      };
      
      const result = registerUserSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle names with hyphens', () => {
      const data = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd',
        confirmPassword: 'StrongP@ssw0rd',
        name: "Anne-Marie",
        region: NorwegianRegion.OSLO,
        acceptTerms: true,
        acceptPrivacy: true,
      };
      
      const result = registerUserSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject names that are too short', () => {
      const data = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd',
        confirmPassword: 'StrongP@ssw0rd',
        name: "A",
        region: NorwegianRegion.OSLO,
        acceptTerms: true,
        acceptPrivacy: true,
      };
      
      const result = registerUserSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject names that are too long', () => {
      const data = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd',
        confirmPassword: 'StrongP@ssw0rd',
        name: 'A'.repeat(101),
        region: NorwegianRegion.OSLO,
        acceptTerms: true,
        acceptPrivacy: true,
      };
      
      const result = registerUserSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});