/**
 * Post-Specific Security Error Handling for TutorConnect
 * Norwegian-localized error messages and security response handling
 */

import { APIError } from '@/lib/errors';
import { reportSecurityEvent, SecurityEvent } from '@/lib/security-monitor';

export interface PostSecurityError extends APIError {
  securityCode: string;
  norwegianMessage: string;
  englishMessage: string;
  userFriendlyMessage: string;
  technicalDetails?: Record<string, any>;
  suggestedAction?: string;
}

/**
 * Post security error codes and messages
 */
export const POST_SECURITY_ERRORS = {
  CONTENT_INJECTION: {
    code: 'PSE_001',
    status: 403,
    norwegian: 'Innholdet inneholder potensielt skadelige elementer',
    english: 'Content contains potentially harmful elements',
    userFriendly: 'Vi oppdaget sikkerhetsproblemer i innholdet ditt. Vennligst sjekk og prøv igjen.',
    suggestedAction: 'Fjern script-koder, HTML-tagger eller andre tekniske elementer fra innholdet'
  },
  SPAM_CONTENT: {
    code: 'PSE_002',
    status: 400,
    norwegian: 'Innholdet ser ut som spam eller reklame',
    english: 'Content appears to be spam or promotional',
    userFriendly: 'Innholdet ditt virker som reklame. Fokuser på undervisningsrelatert informasjon.',
    suggestedAction: 'Skriv om innholdet med fokus på undervisning og læring'
  },
  INAPPROPRIATE_CONTENT: {
    code: 'PSE_003',
    status: 400,
    norwegian: 'Innholdet inneholder upassende materiale',
    english: 'Content contains inappropriate material',
    userFriendly: 'Innholdet ditt inneholder upassende materiale for en undervisningsplattform.',
    suggestedAction: 'Fjern støtende språk og hold innholdet profesjonelt og undervisningsfokusert'
  },
  SUSPICIOUS_PRICING: {
    code: 'PSE_004',
    status: 400,
    norwegian: 'Prisingen virker mistenkelig',
    english: 'Pricing appears suspicious',
    userFriendly: 'Prisen du har oppgitt virker urealistisk. Vennligst sjekk at den er korrekt.',
    suggestedAction: 'Bruk normale timepriser for undervisning (typisk 200-800 NOK)'
  },
  RATE_LIMIT_POSTS: {
    code: 'PSE_005',
    status: 429,
    norwegian: 'Du har opprettet for mange innlegg nylig',
    english: 'Too many posts created recently',
    userFriendly: 'Du har opprettet mange innlegg nylig. Vent litt før du oppretter flere.',
    suggestedAction: 'Vent 15 minutter før du oppretter nye innlegg'
  },
  MALICIOUS_PATTERNS: {
    code: 'PSE_006',
    status: 403,
    norwegian: 'Innholdet inneholder mistenkelige mønstre',
    english: 'Content contains suspicious patterns',
    userFriendly: 'Vi oppdaget mistenkelige mønstre i innholdet ditt.',
    suggestedAction: 'Skriv naturlig og unngå gjentakelser eller unormale mønstre'
  },
  ACCOUNT_FLAGGED: {
    code: 'PSE_007',
    status: 403,
    norwegian: 'Kontoen din er flagget for gjennomgang',
    english: 'Account flagged for review',
    userFriendly: 'Kontoen din er under gjennomgang på grunn av mistenkelig aktivitet.',
    suggestedAction: 'Kontakt kundeservice hvis du mener dette er en feil'
  },
  IP_BLOCKED: {
    code: 'PSE_008',
    status: 403,
    norwegian: 'IP-adressen din er blokkert',
    english: 'IP address is blocked',
    userFriendly: 'Tilgangen din er midlertidig begrenset på grunn av sikkerhetshensyn.',
    suggestedAction: 'Kontakt kundeservice eller prøv igjen senere'
  },
  INVALID_LOCATION: {
    code: 'PSE_009',
    status: 400,
    norwegian: 'Mistenkelig stedsinformasjon',
    english: 'Suspicious location information',
    userFriendly: 'Stedsinformasjonen din inneholder mistenkelige elementer.',
    suggestedAction: 'Oppgi kun offentlige steder eller generelle områder'
  },
  BOT_DETECTED: {
    code: 'PSE_010',
    status: 403,
    norwegian: 'Automatisert aktivitet oppdaget',
    english: 'Automated activity detected',
    userFriendly: 'Vi oppdaget automatisert aktivitet fra din tilkobling.',
    suggestedAction: 'Bruk en vanlig nettleser og ikke automatiserte verktøy'
  }
} as const;

/**
 * Create a post security error
 */
export function createPostSecurityError(
  errorType: keyof typeof POST_SECURITY_ERRORS,
  details?: Record<string, any>,
  event?: SecurityEvent
): PostSecurityError {
  const errorConfig = POST_SECURITY_ERRORS[errorType];
  
  const error = new APIError(
    errorConfig.english,
    errorConfig.status,
    errorConfig.code
  ) as PostSecurityError;
  
  error.securityCode = errorConfig.code;
  error.norwegianMessage = errorConfig.norwegian;
  error.englishMessage = errorConfig.english;
  error.userFriendlyMessage = errorConfig.userFriendly;
  error.technicalDetails = details;
  error.suggestedAction = errorConfig.suggestedAction;
  
  // Report security event if provided
  if (event) {
    reportSecurityEvent({
      ...event,
      metadata: {
        errorType,
        errorCode: errorConfig.code,
        details
      }
    }).catch(console.error);
  }
  
  return error;
}

/**
 * Enhanced error response formatter for Norwegian users
 */
export function formatPostSecurityErrorResponse(
  error: PostSecurityError | APIError,
  language: 'no' | 'en' = 'no',
  includeDetails: boolean = false
): {
  success: false;
  error: {
    code: string;
    message: string;
    userMessage: string;
    suggestedAction?: string;
    details?: Record<string, any>;
  };
  timestamp: string;
} {
  if (error instanceof APIError && 'securityCode' in error) {
    const secError = error as PostSecurityError;
    
    return {
      success: false,
      error: {
        code: secError.securityCode,
        message: language === 'no' ? secError.norwegianMessage : secError.englishMessage,
        userMessage: secError.userFriendlyMessage,
        suggestedAction: secError.suggestedAction,
        ...(includeDetails && secError.technicalDetails && {
          details: secError.technicalDetails
        })
      },
      timestamp: new Date().toISOString()
    };
  }
  
  // Fallback for regular API errors
  return {
    success: false,
    error: {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message,
      userMessage: language === 'no' 
        ? 'En feil oppstod. Vennligst prøv igjen.' 
        : 'An error occurred. Please try again.',
      ...(includeDetails && {
        details: { originalError: error.message }
      })
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Security error handler middleware for post operations
 */
export async function handlePostSecurityError(
  error: Error,
  context: {
    userId?: string;
    ip: string;
    userAgent: string;
    operation: string;
    endpoint: string;
  }
): Promise<PostSecurityError> {
  // Map common errors to security errors
  let securityError: PostSecurityError;
  
  if (error.message.includes('rate limit')) {
    securityError = createPostSecurityError('RATE_LIMIT_POSTS', {
      originalError: error.message
    }, {
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      operation: context.operation,
      endpoint: context.endpoint
    });
  } else if (error.message.includes('spam') || error.message.includes('promotional')) {
    securityError = createPostSecurityError('SPAM_CONTENT', {
      originalError: error.message
    }, {
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      operation: context.operation,
      endpoint: context.endpoint
    });
  } else if (error.message.includes('injection') || error.message.includes('script')) {
    securityError = createPostSecurityError('CONTENT_INJECTION', {
      originalError: error.message
    }, {
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      operation: context.operation,
      endpoint: context.endpoint
    });
  } else if (error.message.includes('inappropriate') || error.message.includes('profanity')) {
    securityError = createPostSecurityError('INAPPROPRIATE_CONTENT', {
      originalError: error.message
    }, {
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      operation: context.operation,
      endpoint: context.endpoint
    });
  } else if (error.message.includes('pricing') || error.message.includes('price')) {
    securityError = createPostSecurityError('SUSPICIOUS_PRICING', {
      originalError: error.message
    }, {
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      operation: context.operation,
      endpoint: context.endpoint
    });
  } else if (error.message.includes('bot') || error.message.includes('automated')) {
    securityError = createPostSecurityError('BOT_DETECTED', {
      originalError: error.message
    }, {
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      operation: context.operation,
      endpoint: context.endpoint
    });
  } else {
    // Generic suspicious patterns error
    securityError = createPostSecurityError('MALICIOUS_PATTERNS', {
      originalError: error.message
    }, {
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      operation: context.operation,
      endpoint: context.endpoint
    });
  }
  
  return securityError;
}

/**
 * Post operation security validator
 */
export class PostSecurityValidator {
  /**
   * Validate post creation security
   */
  static async validatePostCreation(
    postData: any,
    context: { userId: string; ip: string; userAgent: string }
  ): Promise<void> {
    // Check for content injection
    const contentFields = [postData.title, postData.description, postData.specificLocation, postData.preferredSchedule];
    for (const field of contentFields) {
      if (field && this.hasContentInjection(field)) {
        throw createPostSecurityError('CONTENT_INJECTION', {
          field,
          detectedPatterns: this.getInjectionPatterns(field)
        }, {
          userId: context.userId,
          ip: context.ip,
          userAgent: context.userAgent,
          operation: 'POST_CREATE',
          endpoint: '/api/posts'
        });
      }
    }
    
    // Check for spam content
    if (postData.description && this.isSpamContent(postData.description)) {
      throw createPostSecurityError('SPAM_CONTENT', {
        description: postData.description.substring(0, 100)
      }, {
        userId: context.userId,
        ip: context.ip,
        userAgent: context.userAgent,
        operation: 'POST_CREATE',
        endpoint: '/api/posts'
      });
    }
    
    // Check pricing
    if (this.hasSuspiciousPricing(postData)) {
      throw createPostSecurityError('SUSPICIOUS_PRICING', {
        pricing: {
          hourlyRate: postData.hourlyRate,
          hourlyRateMin: postData.hourlyRateMin,
          hourlyRateMax: postData.hourlyRateMax
        }
      }, {
        userId: context.userId,
        ip: context.ip,
        userAgent: context.userAgent,
        operation: 'POST_CREATE',
        endpoint: '/api/posts'
      });
    }
  }
  
  private static hasContentInjection(content: string): boolean {
    const injectionPatterns = [
      /<script[^>]*>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /(\bunion\b|\bselect\b.*\bfrom\b)/gi,
      /[\|&;`]\s*(rm|del|format)/gi
    ];
    
    return injectionPatterns.some(pattern => pattern.test(content));
  }
  
  private static getInjectionPatterns(content: string): string[] {
    const patterns = [];
    if (/<script[^>]*>/gi.test(content)) patterns.push('script_tag');
    if (/javascript:/gi.test(content)) patterns.push('javascript_protocol');
    if (/on\w+\s*=/gi.test(content)) patterns.push('event_handler');
    if (/(\bunion\b|\bselect\b.*\bfrom\b)/gi.test(content)) patterns.push('sql_injection');
    return patterns;
  }
  
  private static isSpamContent(content: string): boolean {
    const spamKeywords = [
      'gratis penger', 'lett fortjent', '100% sikker', 'garantert inntekt',
      'ring nå', 'handle i dag', 'begrenset tid', 'siste sjanse'
    ];
    
    const lowerContent = content.toLowerCase();
    const matchCount = spamKeywords.filter(keyword => lowerContent.includes(keyword)).length;
    
    return matchCount >= 2;
  }
  
  private static hasSuspiciousPricing(postData: any): boolean {
    const rates = [postData.hourlyRate, postData.hourlyRateMin, postData.hourlyRateMax].filter(Boolean);
    
    // Check for extremely low or high rates
    return rates.some(rate => rate < 50 || rate > 2000);
  }
}

/**
 * Norwegian-specific error messages for common security issues
 */
export const NORWEGIAN_SECURITY_MESSAGES = {
  GENERAL_SECURITY: 'Av sikkerhetshensyn kan vi ikke behandle forespørselen din.',
  CONTENT_BLOCKED: 'Innholdet ditt inneholder elementer som ikke er tillatt på plattformen.',
  RATE_LIMITED: 'Du har gjort for mange forespørsler. Vennligst vent litt før du prøver igjen.',
  ACCOUNT_REVIEW: 'Kontoen din er under gjennomgang. Kontakt kundeservice for mer informasjon.',
  TECHNICAL_ERROR: 'En teknisk feil oppstod. Vårt team er varslet og arbeider med å løse problemet.',
  INVALID_DATA: 'Dataene du sendte inn inneholder feil eller mangler. Vennligst sjekk og prøv igjen.',
  PERMISSION_DENIED: 'Du har ikke tillatelse til å utføre denne handlingen.',
  SESSION_EXPIRED: 'Økten din har utløpt. Vennligst logg inn på nytt.'
} as const;

/**
 * Get user-friendly Norwegian error message
 */
export function getNorwegianErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    'PSE_001': 'Innholdet inneholder elementer som kan være skadelige. Vennligst fjern HTML-koder eller script-elementer.',
    'PSE_002': 'Innholdet virker som reklame. Fokuser på undervisningsrelatert informasjon.',
    'PSE_003': 'Innholdet inneholder upassende materiale for en undervisningsplattform.',
    'PSE_004': 'Prisen virker urealistisk. Bruk normale timepriser for undervisning.',
    'PSE_005': 'Du har opprettet for mange innlegg nylig. Vent 15 minutter før du prøver igjen.',
    'PSE_006': 'Innholdet inneholder mistenkelige mønstre. Skriv naturlig tekst.',
    'PSE_007': 'Kontoen din er under gjennomgang på grunn av mistenkelig aktivitet.',
    'PSE_008': 'Tilgangen din er midlertidig begrenset på grunn av sikkerhetshensyn.',
    'PSE_009': 'Stedsinformasjonen inneholder mistenkelige elementer.',
    'PSE_010': 'Vi oppdaget automatisert aktivitet. Bruk en vanlig nettleser.'
  };
  
  return messages[errorCode] || NORWEGIAN_SECURITY_MESSAGES.GENERAL_SECURITY;
}