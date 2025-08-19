/**
 * Post-Specific Security Middleware for TutorConnect
 * Advanced security validation and protection for post operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { filterContent, isSpamContent, generateContentSafetyReport } from '@/lib/content-filter';
import { PostFieldSanitizer, validateSanitizedContent } from '@/lib/sanitizer';
import { checkPostRateLimit, recordFailedAttempt, UserBehaviorAnalyzer, IPRateLimiter } from '@/lib/rate-limiter';
import { securityLogger } from '@/middleware/security';
import { APIError, ValidationError } from '@/lib/errors';

export interface PostSecurityContext {
  userId?: string;
  ip: string;
  userAgent: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'SEARCH' | 'VIEW';
  postData?: any;
  postId?: string;
  isAuthenticated: boolean;
}

export interface SecurityValidationResult {
  allowed: boolean;
  sanitizedData?: any;
  warnings: string[];
  securityScore: number;
  reason?: string;
}

/**
 * Main post security middleware class
 */
export class PostSecurityMiddleware {
  /**
   * Comprehensive security validation for post operations
   */
  static async validatePostOperation(context: PostSecurityContext): Promise<SecurityValidationResult> {
    const warnings: string[] = [];
    let securityScore = 100;
    
    try {
      // Step 1: Rate limiting check
      const rateLimitResult = await this.checkRateLimit(context);
      if (!rateLimitResult.allowed) {
        return {
          allowed: false,
          warnings: ['Rate limit exceeded'],
          securityScore: 0,
          reason: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`
        };
      }

      // Step 2: Content validation (for CREATE and UPDATE operations)
      let sanitizedData = context.postData;
      if (context.postData && (context.operation === 'CREATE' || context.operation === 'UPDATE')) {
        const contentValidation = await this.validatePostContent(context.postData, context);
        
        if (!contentValidation.allowed) {
          await this.recordSecurityEvent(context, 'CONTENT_REJECTED', contentValidation.reason);
          return contentValidation;
        }
        
        sanitizedData = contentValidation.sanitizedData;
        warnings.push(...contentValidation.warnings);
        securityScore -= (100 - contentValidation.securityScore);
      }

      // Step 3: User behavior analysis
      if (context.isAuthenticated && context.userId) {
        const behaviorAnalysis = await this.analyzeBehavior(context);
        if (!behaviorAnalysis.allowed) {
          return behaviorAnalysis;
        }
        warnings.push(...behaviorAnalysis.warnings);
        securityScore -= (100 - behaviorAnalysis.securityScore);
      }

      // Step 4: IP reputation check for anonymous users
      if (!context.isAuthenticated) {
        const ipAnalysis = await this.analyzeIPReputation(context);
        if (!ipAnalysis.allowed) {
          return ipAnalysis;
        }
        warnings.push(...ipAnalysis.warnings);
        securityScore -= (100 - ipAnalysis.securityScore);
      }

      // Step 5: Final security score assessment
      const finalScore = Math.max(0, securityScore);
      
      if (finalScore < 30) {
        await this.recordSecurityEvent(context, 'LOW_SECURITY_SCORE', `Security score: ${finalScore}`);
        return {
          allowed: false,
          warnings,
          securityScore: finalScore,
          reason: 'Content or behavior raises security concerns'
        };
      }

      // Log successful validation
      await this.recordSecurityEvent(context, 'VALIDATION_SUCCESS', `Security score: ${finalScore}`);
      
      return {
        allowed: true,
        sanitizedData,
        warnings,
        securityScore: finalScore
      };

    } catch (error) {
      await this.recordSecurityEvent(context, 'VALIDATION_ERROR', `Error: ${error.message}`);
      
      return {
        allowed: false,
        warnings: ['Security validation failed'],
        securityScore: 0,
        reason: 'Internal security validation error'
      };
    }
  }

  /**
   * Check rate limits for the operation
   */
  private static async checkRateLimit(context: PostSecurityContext): Promise<SecurityValidationResult> {
    const identifier = context.isAuthenticated ? context.userId! : context.ip;
    
    try {
      const rateLimitResult = await checkPostRateLimit(
        context.operation,
        identifier,
        context.isAuthenticated
      );

      if (!rateLimitResult.allowed) {
        recordFailedAttempt(context.operation, identifier, context.isAuthenticated, 'rate_limit_exceeded');
        
        return {
          allowed: false,
          warnings: [`Rate limit exceeded for ${context.operation} operation`],
          securityScore: 0,
          reason: `Rate limit exceeded. ${rateLimitResult.remaining} attempts remaining. Try again in ${rateLimitResult.retryAfter} seconds.`
        };
      }

      return {
        allowed: true,
        warnings: rateLimitResult.remaining < 3 ? [`Only ${rateLimitResult.remaining} attempts remaining`] : [],
        securityScore: 100
      };

    } catch (error) {
      return {
        allowed: false,
        warnings: ['Rate limit check failed'],
        securityScore: 0,
        reason: 'Rate limiting system error'
      };
    }
  }

  /**
   * Validate post content for security and quality
   */
  private static async validatePostContent(postData: any, context: PostSecurityContext): Promise<SecurityValidationResult> {
    const warnings: string[] = [];
    let securityScore = 100;
    const sanitizedData = { ...postData };

    try {
      // Validate and sanitize title
      if (postData.title) {
        const titleFilter = filterContent(postData.title, 'title');
        if (!titleFilter.allowed) {
          return {
            allowed: false,
            warnings: [`Title rejected: ${titleFilter.reason}`],
            securityScore: 0,
            reason: `Title contains inappropriate content: ${titleFilter.reason}`
          };
        }

        const titleSanitization = PostFieldSanitizer.sanitizeTitle(postData.title);
        const titleValidation = validateSanitizedContent(titleSanitization);
        
        if (!titleValidation.isSafe) {
          return {
            allowed: false,
            warnings: [`Title safety check failed: ${titleValidation.reasons.join(', ')}`],
            securityScore: 0,
            reason: 'Title contains security threats'
          };
        }

        sanitizedData.title = titleSanitization.sanitized;
        if (titleSanitization.wasModified) {
          warnings.push('Title was sanitized');
          securityScore -= 5;
        }
      }

      // Validate and sanitize description
      if (postData.description) {
        const descriptionFilter = filterContent(postData.description, 'description');
        if (!descriptionFilter.allowed) {
          return {
            allowed: false,
            warnings: [`Description rejected: ${descriptionFilter.reason}`],
            securityScore: 0,
            reason: `Description contains inappropriate content: ${descriptionFilter.reason}`
          };
        }

        const descriptionSanitization = PostFieldSanitizer.sanitizeDescription(postData.description);
        const descriptionValidation = validateSanitizedContent(descriptionSanitization);
        
        if (!descriptionValidation.isSafe) {
          return {
            allowed: false,
            warnings: [`Description safety check failed: ${descriptionValidation.reasons.join(', ')}`],
            securityScore: 0,
            reason: 'Description contains security threats'
          };
        }

        // Check for spam
        const spamCheck = isSpamContent(postData.description);
        if (spamCheck.isSpam) {
          return {
            allowed: false,
            warnings: [`Description identified as spam: ${spamCheck.factors.join(', ')}`],
            securityScore: 0,
            reason: 'Description appears to be spam'
          };
        }

        // Generate comprehensive safety report
        const safetyReport = generateContentSafetyReport(postData.description, 'description');
        if (!safetyReport.safe) {
          securityScore -= 20;
          warnings.push(...safetyReport.warnings);
        }

        sanitizedData.description = descriptionSanitization.sanitized;
        if (descriptionSanitization.wasModified) {
          warnings.push('Description was sanitized');
          securityScore -= 10;
        }
      }

      // Validate location information
      if (postData.specificLocation) {
        const locationFilter = filterContent(postData.specificLocation, 'location');
        if (!locationFilter.allowed) {
          return {
            allowed: false,
            warnings: [`Location rejected: ${locationFilter.reason}`],
            securityScore: 0,
            reason: `Location contains inappropriate content: ${locationFilter.reason}`
          };
        }

        const locationSanitization = PostFieldSanitizer.sanitizeLocation(postData.specificLocation);
        sanitizedData.specificLocation = locationSanitization.sanitized;
        
        if (locationSanitization.wasModified) {
          warnings.push('Location was sanitized');
          securityScore -= 5;
        }
      }

      // Validate preferred schedule
      if (postData.preferredSchedule) {
        const scheduleFilter = filterContent(postData.preferredSchedule);
        if (!scheduleFilter.allowed) {
          return {
            allowed: false,
            warnings: [`Schedule rejected: ${scheduleFilter.reason}`],
            securityScore: 0,
            reason: `Schedule contains inappropriate content: ${scheduleFilter.reason}`
          };
        }

        const scheduleSanitization = PostFieldSanitizer.sanitizeSchedule(postData.preferredSchedule);
        sanitizedData.preferredSchedule = scheduleSanitization.sanitized;
        
        if (scheduleSanitization.wasModified) {
          warnings.push('Schedule was sanitized');
          securityScore -= 5;
        }
      }

      // Validate pricing (anti-scam measures)
      if (postData.hourlyRate || postData.hourlyRateMin || postData.hourlyRateMax) {
        const pricingValidation = this.validatePricing(postData);
        if (!pricingValidation.allowed) {
          return pricingValidation;
        }
        warnings.push(...pricingValidation.warnings);
        securityScore -= (100 - pricingValidation.securityScore);
      }

      return {
        allowed: true,
        sanitizedData,
        warnings,
        securityScore: Math.max(0, securityScore)
      };

    } catch (error) {
      return {
        allowed: false,
        warnings: ['Content validation failed'],
        securityScore: 0,
        reason: 'Content validation error'
      };
    }
  }

  /**
   * Validate pricing to prevent scams
   */
  private static validatePricing(postData: any): SecurityValidationResult {
    const warnings: string[] = [];
    let securityScore = 100;

    // Check for unrealistic pricing
    const rates = [postData.hourlyRate, postData.hourlyRateMin, postData.hourlyRateMax].filter(Boolean);
    
    // Check for extremely low rates (potential scam)
    const lowRates = rates.filter(rate => rate < 100);
    if (lowRates.length > 0) {
      warnings.push('Unusually low pricing detected');
      securityScore -= 20;
    }

    // Check for extremely high rates (potential scam)
    const highRates = rates.filter(rate => rate > 1500);
    if (highRates.length > 0) {
      warnings.push('Unusually high pricing detected');
      securityScore -= 15;
    }

    // Check for suspicious pricing patterns
    if (postData.hourlyRate) {
      const rateStr = postData.hourlyRate.toString();
      if (rateStr.includes('999') || rateStr.includes('777') || rateStr.includes('000')) {
        warnings.push('Suspicious pricing pattern detected');
        securityScore -= 10;
      }
    }

    return {
      allowed: securityScore >= 50,
      warnings,
      securityScore,
      reason: securityScore < 50 ? 'Pricing appears suspicious' : undefined
    };
  }

  /**
   * Analyze user behavior patterns
   */
  private static async analyzeBehavior(context: PostSecurityContext): Promise<SecurityValidationResult> {
    if (!context.userId) {
      return { allowed: true, warnings: [], securityScore: 100 };
    }

    const warnings: string[] = [];
    let securityScore = 100;

    try {
      const profile = UserBehaviorAnalyzer.analyzeUser(context.userId);
      
      // Check risk level
      switch (profile.riskLevel) {
        case 'CRITICAL':
          return {
            allowed: false,
            warnings: ['User behavior indicates critical security risk'],
            securityScore: 0,
            reason: 'User account flagged for suspicious activity'
          };
        case 'HIGH':
          warnings.push('User has high-risk behavior pattern');
          securityScore -= 30;
          break;
        case 'MEDIUM':
          warnings.push('User has elevated risk behavior');
          securityScore -= 15;
          break;
        case 'LOW':
          // No penalty for low-risk users
          break;
      }

      // Check for bot-like behavior
      if (profile.isBotLike) {
        warnings.push('Bot-like behavior detected');
        securityScore -= 25;
      }

      // Check recent activity levels
      if (profile.postCreationCount > 5) {
        warnings.push('High post creation activity');
        securityScore -= 10;
      }

      if (profile.failedAttempts > 3) {
        warnings.push('Multiple recent failed attempts');
        securityScore -= 15;
      }

      return {
        allowed: securityScore >= 30,
        warnings,
        securityScore,
        reason: securityScore < 30 ? 'User behavior raises security concerns' : undefined
      };

    } catch (error) {
      return {
        allowed: true,
        warnings: ['Behavior analysis failed'],
        securityScore: 80
      };
    }
  }

  /**
   * Analyze IP reputation for anonymous users
   */
  private static async analyzeIPReputation(context: PostSecurityContext): Promise<SecurityValidationResult> {
    const warnings: string[] = [];
    let securityScore = 100;

    try {
      const ipAssessment = await IPRateLimiter.checkIP(context.ip);
      
      switch (ipAssessment.riskLevel) {
        case 'CRITICAL':
          return {
            allowed: false,
            warnings: ['IP address flagged as critical security risk'],
            securityScore: 0,
            reason: 'IP address blocked due to suspicious activity'
          };
        case 'HIGH':
          warnings.push('IP address has high-risk activity');
          securityScore -= 30;
          break;
        case 'MEDIUM':
          warnings.push('IP address has elevated activity');
          securityScore -= 15;
          break;
        case 'LOW':
          // No penalty for low-risk IPs
          break;
      }

      // Check request frequency
      if (ipAssessment.requestsPerHour > 100) {
        warnings.push('High request frequency from IP');
        securityScore -= 20;
      }

      if (ipAssessment.suspiciousActivityCount > 0) {
        warnings.push(`${ipAssessment.suspiciousActivityCount} suspicious activities from IP`);
        securityScore -= (ipAssessment.suspiciousActivityCount * 10);
      }

      return {
        allowed: securityScore >= 30,
        warnings,
        securityScore,
        reason: securityScore < 30 ? 'IP address raises security concerns' : undefined
      };

    } catch (error) {
      return {
        allowed: true,
        warnings: ['IP analysis failed'],
        securityScore: 80
      };
    }
  }

  /**
   * Record security events for monitoring and analysis
   */
  private static async recordSecurityEvent(
    context: PostSecurityContext,
    eventType: string,
    details: string
  ): Promise<void> {
    securityLogger.log({
      ip: context.ip,
      userAgent: context.userAgent,
      method: context.operation,
      path: `/api/posts${context.postId ? `/${context.postId}` : ''}`,
      userId: context.userId,
      eventType: 'SUSPICIOUS_ACTIVITY',
      details: {
        securityEvent: eventType,
        operation: context.operation,
        details,
        postId: context.postId
      }
    });
  }
}

/**
 * Express-style middleware wrapper for Next.js API routes
 */
export function createPostSecurityMiddleware(operation: PostSecurityContext['operation']) {
  return async (request: NextRequest, context: any) => {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Extract post data for validation
    let postData;
    if (operation === 'CREATE' || operation === 'UPDATE') {
      try {
        postData = await request.json();
      } catch (error) {
        // Data will be validated by the main handler
      }
    }

    const securityContext: PostSecurityContext = {
      userId: context.user?.id,
      ip,
      userAgent,
      operation,
      postData,
      postId: context.params?.postId,
      isAuthenticated: !!context.user
    };

    const validationResult = await PostSecurityMiddleware.validatePostOperation(securityContext);

    if (!validationResult.allowed) {
      throw new APIError(
        validationResult.reason || 'Security validation failed',
        403,
        'SECURITY_VALIDATION_FAILED'
      );
    }

    // Add sanitized data and warnings to context
    if (validationResult.sanitizedData) {
      context.sanitizedData = validationResult.sanitizedData;
    }
    
    if (validationResult.warnings.length > 0) {
      context.securityWarnings = validationResult.warnings;
    }

    context.securityScore = validationResult.securityScore;

    return null; // Continue processing
  };
}

/**
 * Security check for specific post operations
 */
export const postSecurityChecks = {
  create: createPostSecurityMiddleware('CREATE'),
  update: createPostSecurityMiddleware('UPDATE'),
  delete: createPostSecurityMiddleware('DELETE'),
  search: createPostSecurityMiddleware('SEARCH'),
  view: createPostSecurityMiddleware('VIEW')
};

/**
 * Post-operation security logging
 */
export function logPostOperation(
  operation: string,
  success: boolean,
  userId?: string,
  ip?: string,
  postId?: string,
  details?: any
): void {
  securityLogger.log({
    ip: ip || 'unknown',
    userAgent: 'post-operation',
    method: operation,
    path: `/api/posts${postId ? `/${postId}` : ''}`,
    userId,
    eventType: success ? 'API_ACCESS' : 'SUSPICIOUS_ACTIVITY',
    details: {
      operation,
      success,
      postId,
      ...details
    }
  });
}