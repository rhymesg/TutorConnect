import {
  APIError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  BadRequestError,
  InternalServerError,
  AuthenticationError,
  InvalidCredentialsError,
  EmailNotVerifiedError,
  AccountLockedError,
  TokenExpiredError,
  InvalidTokenError,
  WeakPasswordError,
  EmailExistsError,
  handlePrismaError,
  handleZodError,
  errorMessages,
  getLocalizedErrorMessage,
  createErrorResponse,
} from './errors';

describe('Error Classes', () => {
  describe('APIError', () => {
    it('should create basic APIError with defaults', () => {
      const error = new APIError('Test message');
      
      expect(error.name).toBe('APIError');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.errors).toBeUndefined();
    });

    it('should create APIError with custom values', () => {
      const errors = { field: ['error message'] };
      const error = new APIError('Custom message', 400, 'CUSTOM_ERROR', errors);
      
      expect(error.message).toBe('Custom message');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.errors).toBe(errors);
    });

    it('should be instanceof Error', () => {
      const error = new APIError('Test');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(APIError);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with correct defaults', () => {
      const errors = { email: ['Invalid email'], password: ['Too weak'] };
      const error = new ValidationError(errors);
      
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.errors).toBe(errors);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with default message', () => {
      const error = new NotFoundError();
      
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should create not found error with custom resource', () => {
      const error = new NotFoundError('User');
      
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with default message', () => {
      const error = new UnauthorizedError();
      
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should create unauthorized error with custom message', () => {
      const error = new UnauthorizedError('Custom auth message');
      
      expect(error.message).toBe('Custom auth message');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('ForbiddenError', () => {
    it('should create forbidden error with default message', () => {
      const error = new ForbiddenError();
      
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should create forbidden error with custom message', () => {
      const error = new ForbiddenError('No permission');
      
      expect(error.message).toBe('No permission');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error with default message', () => {
      const error = new ConflictError();
      
      expect(error.message).toBe('Resource already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });

    it('should create conflict error with custom message', () => {
      const error = new ConflictError('User exists');
      
      expect(error.message).toBe('User exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with default retry after', () => {
      const error = new RateLimitError();
      
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.retryAfter).toBe(60);
    });

    it('should create rate limit error with custom retry after', () => {
      const error = new RateLimitError(120);
      
      expect(error.retryAfter).toBe(120);
    });
  });

  describe('BadRequestError', () => {
    it('should create bad request error', () => {
      const error = new BadRequestError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
    });
  });

  describe('InternalServerError', () => {
    it('should create internal server error', () => {
      const error = new InternalServerError('Server crashed');
      
      expect(error.message).toBe('Server crashed');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error with custom code and message', () => {
      const error = new AuthenticationError('CUSTOM_AUTH', 'Custom auth error');
      
      expect(error.message).toBe('Custom auth error');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('CUSTOM_AUTH');
    });
  });

  describe('InvalidCredentialsError', () => {
    it('should create invalid credentials error', () => {
      const error = new InvalidCredentialsError();
      
      expect(error.message).toBe('Invalid email or password');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('EmailNotVerifiedError', () => {
    it('should create email not verified error', () => {
      const error = new EmailNotVerifiedError();
      
      expect(error.message).toBe('Email verification required');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('EMAIL_NOT_VERIFIED');
    });
  });

  describe('AccountLockedError', () => {
    it('should create account locked error', () => {
      const error = new AccountLockedError();
      
      expect(error.message).toBe('Account has been temporarily locked due to too many failed login attempts');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('TokenExpiredError', () => {
    it('should create token expired error', () => {
      const error = new TokenExpiredError();
      
      expect(error.message).toBe('Token has expired');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('InvalidTokenError', () => {
    it('should create invalid token error', () => {
      const error = new InvalidTokenError();
      
      expect(error.message).toBe('Invalid or malformed token');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('WeakPasswordError', () => {
    it('should create weak password error', () => {
      const error = new WeakPasswordError();
      
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('WEAK_PASSWORD');
      expect(error.errors).toEqual({
        password: ['Password must contain at least 8 characters including uppercase, lowercase, number, and special character']
      });
    });
  });

  describe('EmailExistsError', () => {
    it('should create email exists error', () => {
      const error = new EmailExistsError();
      
      expect(error.message).toBe('Email address is already registered');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('EMAIL_ALREADY_EXISTS');
    });
  });
});

describe('Error Handlers', () => {
  describe('handlePrismaError', () => {
    it('should handle unique constraint violation for email', () => {
      const prismaError = {
        code: 'P2002',
        meta: { target: ['email'] }
      };
      
      const error = handlePrismaError(prismaError);
      expect(error).toBeInstanceOf(EmailExistsError);
    });

    it('should handle unique constraint violation for other fields', () => {
      const prismaError = {
        code: 'P2002',
        meta: { target: ['username'] }
      };
      
      const error = handlePrismaError(prismaError);
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe('username already exists');
    });

    it('should handle record not found error', () => {
      const prismaError = { code: 'P2025' };
      
      const error = handlePrismaError(prismaError);
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('should handle foreign key constraint violation', () => {
      const prismaError = { code: 'P2003' };
      
      const error = handlePrismaError(prismaError);
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Referenced resource not found');
    });

    it('should handle database connection errors', () => {
      const prismaError1 = { code: 'P1001' };
      const prismaError2 = { code: 'P1008' };
      
      const error1 = handlePrismaError(prismaError1);
      const error2 = handlePrismaError(prismaError2);
      
      expect(error1).toBeInstanceOf(InternalServerError);
      expect(error2).toBeInstanceOf(InternalServerError);
      expect(error1.message).toBe('Database connection error');
      expect(error2.message).toBe('Database connection error');
    });

    it('should handle known Prisma client errors', () => {
      const prismaError = { name: 'PrismaClientKnownRequestError' };
      
      const error = handlePrismaError(prismaError);
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Database operation failed');
    });

    it('should handle generic errors', () => {
      const genericError = { message: 'Unknown error' };
      
      const error = handlePrismaError(genericError);
      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.message).toBe('Database error occurred');
    });

    it('should handle missing meta target', () => {
      const prismaError = {
        code: 'P2002',
        meta: {}
      };
      
      const error = handlePrismaError(prismaError);
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe('field already exists');
    });
  });

  describe('handleZodError', () => {
    it('should convert Zod issues to ValidationError', () => {
      const zodError = {
        issues: [
          { path: ['email'], message: 'Invalid email format' },
          { path: ['password'], message: 'Password too short' },
          { path: ['nested', 'field'], message: 'Required field' }
        ]
      };
      
      const error = handleZodError(zodError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual({
        'email': ['Invalid email format'],
        'password': ['Password too short'],
        'nested.field': ['Required field']
      });
    });

    it('should handle multiple errors for same field', () => {
      const zodError = {
        issues: [
          { path: ['password'], message: 'Too short' },
          { path: ['password'], message: 'No uppercase' },
          { path: ['password'], message: 'No numbers' }
        ]
      };
      
      const error = handleZodError(zodError);
      expect(error.errors).toEqual({
        'password': ['Too short', 'No uppercase', 'No numbers']
      });
    });

    it('should handle empty issues array', () => {
      const zodError = { issues: [] };
      
      const error = handleZodError(zodError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual({});
    });

    it('should handle missing issues', () => {
      const zodError = {};
      
      const error = handleZodError(zodError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual({});
    });
  });
});

describe('Error Messages and Localization', () => {
  describe('errorMessages', () => {
    it('should have Norwegian messages', () => {
      expect(errorMessages.no.VALIDATION_ERROR).toBe('Valideringsfeil');
      expect(errorMessages.no.EMAIL_INVALID).toBe('Ugyldig e-postadresse');
      expect(errorMessages.no.UNAUTHORIZED).toBe('Du må logge inn for å få tilgang');
    });

    it('should have English messages', () => {
      expect(errorMessages.en.VALIDATION_ERROR).toBe('Validation error');
      expect(errorMessages.en.EMAIL_INVALID).toBe('Invalid email address');
      expect(errorMessages.en.UNAUTHORIZED).toBe('Authentication required');
    });
  });

  describe('getLocalizedErrorMessage', () => {
    it('should return Norwegian message by default', () => {
      const message = getLocalizedErrorMessage('VALIDATION_ERROR');
      expect(message).toBe('Valideringsfeil');
    });

    it('should return English message when specified', () => {
      const message = getLocalizedErrorMessage('VALIDATION_ERROR', 'en');
      expect(message).toBe('Validation error');
    });

    it('should fallback to English for unknown code in Norwegian', () => {
      const message = getLocalizedErrorMessage('UNKNOWN_CODE', 'no');
      expect(message).toBe('Unknown error');
    });

    it('should return "Unknown error" for completely unknown code', () => {
      const message = getLocalizedErrorMessage('COMPLETELY_UNKNOWN');
      expect(message).toBe('Unknown error');
    });
  });
});

describe('Error Response Creation', () => {
  describe('createErrorResponse', () => {
    it('should create response for APIError with Norwegian by default', () => {
      const error = new ValidationError({ email: ['Invalid'] });
      const response = createErrorResponse(error);
      
      expect(response.success).toBe(false);
      expect(response.message).toBe('Valideringsfeil');
      expect(response.code).toBe('VALIDATION_ERROR');
      expect(response.statusCode).toBe(422);
      expect(response.errors).toEqual({ email: ['Invalid'] });
      expect(response.meta.timestamp).toBeDefined();
      expect(response.meta.requestId).toBeDefined();
    });

    it('should create response for APIError with English', () => {
      const error = new UnauthorizedError();
      const response = createErrorResponse(error, 'en');
      
      expect(response.success).toBe(false);
      expect(response.message).toBe('Authentication required');
      expect(response.code).toBe('UNAUTHORIZED');
      expect(response.statusCode).toBe(401);
    });

    it('should create response for generic Error', () => {
      const error = new Error('Generic error');
      const response = createErrorResponse(error);
      
      expect(response.success).toBe(false);
      expect(response.message).toBe('Intern serverfeil');
      expect(response.code).toBe('INTERNAL_ERROR');
      expect(response.statusCode).toBe(500);
    });

    it('should use custom request ID when provided', () => {
      const error = new APIError('Test');
      const customRequestId = 'custom-req-123';
      const response = createErrorResponse(error, 'en', customRequestId);
      
      expect(response.meta.requestId).toBe(customRequestId);
    });

    it('should generate request ID when not provided', () => {
      const error = new APIError('Test');
      const response = createErrorResponse(error);
      
      expect(response.meta.requestId).toMatch(/^req_\d+_[a-z0-9]{9}$/);
    });

    it('should include timestamp in ISO format', () => {
      const beforeTime = Date.now();
      const error = new APIError('Test');
      const response = createErrorResponse(error);
      const afterTime = Date.now();
      
      expect(response.meta.timestamp).toBeDefined();
      const timestampDate = new Date(response.meta.timestamp);
      expect(timestampDate.getTime()).toBeGreaterThanOrEqual(beforeTime - 1000);
      expect(timestampDate.getTime()).toBeLessThanOrEqual(afterTime + 1000);
    });
  });
});