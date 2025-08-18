/**
 * Custom error classes for TutorConnect API
 */

export class APIError extends Error {
  statusCode: number;
  code: string;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}

export class ValidationError extends APIError {
  constructor(errors: Record<string, string[]>) {
    super('Validation failed', 422, 'VALIDATION_ERROR', errors);
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends APIError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends APIError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends APIError {
  retryAfter: number;

  constructor(retryAfter: number = 60) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

export class BadRequestError extends APIError {
  constructor(message: string = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class InternalServerError extends APIError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}

/**
 * Authentication specific errors
 */
export class AuthenticationError extends APIError {
  constructor(code: string, message: string) {
    super(message, 401, code);
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Invalid email or password');
  }
}

export class EmailNotVerifiedError extends AuthenticationError {
  constructor() {
    super('EMAIL_NOT_VERIFIED', 'Email verification required');
  }
}

export class AccountLockedError extends AuthenticationError {
  constructor() {
    super('ACCOUNT_LOCKED', 'Account has been temporarily locked due to too many failed login attempts');
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor() {
    super('TOKEN_EXPIRED', 'Token has expired');
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor() {
    super('INVALID_TOKEN', 'Invalid or malformed token');
  }
}

export class WeakPasswordError extends ValidationError {
  constructor() {
    super({
      password: ['Password must contain at least 8 characters including uppercase, lowercase, number, and special character']
    });
    this.code = 'WEAK_PASSWORD';
  }
}

export class EmailExistsError extends ConflictError {
  constructor() {
    super('Email address is already registered');
    this.code = 'EMAIL_ALREADY_EXISTS';
  }
}

/**
 * Handle Prisma errors and convert them to APIError instances
 */
export function handlePrismaError(error: any): APIError {
  // Prisma unique constraint violation
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field';
    if (field === 'email') {
      return new EmailExistsError();
    }
    return new ConflictError(`${field} already exists`);
  }

  // Prisma record not found
  if (error.code === 'P2025') {
    return new NotFoundError();
  }

  // Prisma foreign key constraint violation
  if (error.code === 'P2003') {
    return new BadRequestError('Referenced resource not found');
  }

  // Prisma connection error
  if (error.code === 'P1001' || error.code === 'P1008') {
    return new InternalServerError('Database connection error');
  }

  // Generic Prisma error
  if (error.name === 'PrismaClientKnownRequestError') {
    return new BadRequestError('Database operation failed');
  }

  // Generic database error
  return new InternalServerError('Database error occurred');
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: any): ValidationError {
  const errors: Record<string, string[]> = {};

  if (error.issues) {
    error.issues.forEach((issue: any) => {
      const path = issue.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    });
  }

  return new ValidationError(errors);
}

/**
 * Norwegian/English error message translations
 */
export const errorMessages = {
  no: {
    'VALIDATION_ERROR': 'Valideringsfeil',
    'EMAIL_INVALID': 'Ugyldig e-postadresse',
    'POSTAL_CODE_INVALID': 'Ugyldig postnummer',
    'REGION_REQUIRED': 'Fylke er påkrevd',
    'PASSWORD_WEAK': 'Passordet er for svakt',
    'WEAK_PASSWORD': 'Passordet må inneholde minst 8 tegn med stor bokstav, liten bokstav, tall og spesialtegn',
    'EMAIL_ALREADY_EXISTS': 'E-postadressen er allerede registrert',
    'INVALID_CREDENTIALS': 'Ugyldig e-post eller passord',
    'EMAIL_NOT_VERIFIED': 'Du må verifisere e-postadressen din',
    'ACCOUNT_LOCKED': 'Kontoen er midlertidig låst på grunn av for mange mislykkede innloggingsforsøk',
    'TOKEN_EXPIRED': 'Sesjonen har utløpt. Logg inn på nytt',
    'INVALID_TOKEN': 'Ugyldig sikkerhetstokken',
    'NOT_FOUND': 'Ressursen ble ikke funnet',
    'UNAUTHORIZED': 'Du må logge inn for å få tilgang',
    'FORBIDDEN': 'Du har ikke tilgang til denne ressursen',
    'CONFLICT': 'Ressursen eksisterer allerede',
    'RATE_LIMIT_EXCEEDED': 'For mange forespørsler. Prøv igjen senere',
    'BAD_REQUEST': 'Ugyldig forespørsel',
    'INTERNAL_ERROR': 'Intern serverfeil',
  },
  en: {
    'VALIDATION_ERROR': 'Validation error',
    'EMAIL_INVALID': 'Invalid email address',
    'POSTAL_CODE_INVALID': 'Invalid postal code',
    'REGION_REQUIRED': 'Region is required',
    'PASSWORD_WEAK': 'Password is too weak',
    'WEAK_PASSWORD': 'Password must contain at least 8 characters including uppercase, lowercase, number, and special character',
    'EMAIL_ALREADY_EXISTS': 'Email address is already registered',
    'INVALID_CREDENTIALS': 'Invalid email or password',
    'EMAIL_NOT_VERIFIED': 'Email verification required',
    'ACCOUNT_LOCKED': 'Account has been temporarily locked due to too many failed login attempts',
    'TOKEN_EXPIRED': 'Session has expired. Please log in again',
    'INVALID_TOKEN': 'Invalid security token',
    'NOT_FOUND': 'Resource not found',
    'UNAUTHORIZED': 'Authentication required',
    'FORBIDDEN': 'Access denied',
    'CONFLICT': 'Resource already exists',
    'RATE_LIMIT_EXCEEDED': 'Too many requests. Please try again later',
    'BAD_REQUEST': 'Bad request',
    'INTERNAL_ERROR': 'Internal server error',
  }
} as const;

/**
 * Get localized error message
 */
export function getLocalizedErrorMessage(
  code: string,
  language: 'no' | 'en' = 'no'
): string {
  return errorMessages[language][code as keyof typeof errorMessages['no']] || 
         errorMessages.en[code as keyof typeof errorMessages['en']] || 
         'Unknown error';
}

/**
 * Generate error response object
 */
export function createErrorResponse(
  error: APIError | Error,
  language: 'no' | 'en' = 'no',
  requestId?: string
) {
  if (error instanceof APIError) {
    return {
      success: false,
      message: getLocalizedErrorMessage(error.code, language),
      code: error.code,
      statusCode: error.statusCode,
      errors: error.errors,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestId || generateRequestId(),
      }
    };
  }

  // Generic error
  return {
    success: false,
    message: getLocalizedErrorMessage('INTERNAL_ERROR', language),
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId(),
    }
  };
}

/**
 * Generate unique request ID for error tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}