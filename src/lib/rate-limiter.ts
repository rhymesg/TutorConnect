/**
 * Advanced Rate Limiting System for TutorConnect
 * Implements multiple rate limiting strategies for post operations and user actions
 */

import { securityLogger } from '@/middleware/security';

export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  keyGenerator?: (identifier: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Advanced sliding window rate limiter with persistent storage simulation
 */
export class AdvancedRateLimiter {
  private storage: Map<string, RateLimitEntry[]> = new Map();
  private readonly config: RateLimitConfig;
  private readonly identifier: string;

  constructor(identifier: string, config: RateLimitConfig) {
    this.identifier = identifier;
    this.config = config;
  }

  /**
   * Check if a request is allowed and record it
   */
  async checkLimit(key: string): Promise<RateLimitResult> {
    const fullKey = this.config.keyGenerator ? this.config.keyGenerator(key) : key;
    const now = Date.now();
    
    // Clean expired entries
    this.cleanupExpiredEntries(fullKey, now);
    
    const entries = this.storage.get(fullKey) || [];
    const windowStart = now - this.config.windowMs;
    const validEntries = entries.filter(entry => entry.timestamp >= windowStart);
    
    // Check if limit is exceeded
    if (validEntries.length >= this.config.maxAttempts) {
      const oldestEntry = validEntries[0];
      const retryAfter = Math.ceil((oldestEntry.timestamp + this.config.windowMs - now) / 1000);
      
      // Log rate limit hit
      securityLogger.log({
        ip: key,
        userAgent: 'rate-limiter',
        method: 'RATE_LIMIT',
        path: this.identifier,
        eventType: 'RATE_LIMIT',
        details: {
          limiter: this.identifier,
          attempts: validEntries.length,
          maxAttempts: this.config.maxAttempts,
          windowMs: this.config.windowMs
        }
      });
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: oldestEntry.timestamp + this.config.windowMs,
        retryAfter
      };
    }
    
    // Record the new attempt
    const newEntry: RateLimitEntry = {
      timestamp: now,
      success: true // Will be updated based on actual result
    };
    
    validEntries.push(newEntry);
    this.storage.set(fullKey, validEntries);
    
    return {
      allowed: true,
      remaining: this.config.maxAttempts - validEntries.length,
      resetTime: validEntries[0]?.timestamp + this.config.windowMs || now + this.config.windowMs
    };
  }

  /**
   * Update the success status of the last entry
   */
  updateLastEntry(key: string, success: boolean): void {
    const fullKey = this.config.keyGenerator ? this.config.keyGenerator(key) : key;
    const entries = this.storage.get(fullKey);
    
    if (entries && entries.length > 0) {
      const lastEntry = entries[entries.length - 1];
      lastEntry.success = success;
      
      // Remove from count if configured to skip failed requests
      if (!success && this.config.skipFailedRequests) {
        entries.pop();
        this.storage.set(fullKey, entries);
      }
    }
  }

  /**
   * Get current status without incrementing
   */
  getStatus(key: string): RateLimitResult {
    const fullKey = this.config.keyGenerator ? this.config.keyGenerator(key) : key;
    const now = Date.now();
    
    this.cleanupExpiredEntries(fullKey, now);
    
    const entries = this.storage.get(fullKey) || [];
    const windowStart = now - this.config.windowMs;
    const validEntries = entries.filter(entry => entry.timestamp >= windowStart);
    
    const allowed = validEntries.length < this.config.maxAttempts;
    const remaining = Math.max(0, this.config.maxAttempts - validEntries.length);
    
    let retryAfter: number | undefined;
    if (!allowed && validEntries.length > 0) {
      const oldestEntry = validEntries[0];
      retryAfter = Math.ceil((oldestEntry.timestamp + this.config.windowMs - now) / 1000);
    }
    
    return {
      allowed,
      remaining,
      resetTime: validEntries[0]?.timestamp + this.config.windowMs || now + this.config.windowMs,
      retryAfter
    };
  }

  private cleanupExpiredEntries(key: string, now: number): void {
    const entries = this.storage.get(key);
    if (!entries) return;
    
    const windowStart = now - this.config.windowMs;
    const validEntries = entries.filter(entry => entry.timestamp >= windowStart);
    
    if (validEntries.length !== entries.length) {
      this.storage.set(key, validEntries);
    }
  }
}

interface RateLimitEntry {
  timestamp: number;
  success: boolean;
}

/**
 * Post-specific rate limiters
 */
export class PostRateLimiters {
  // Post creation rate limiter
  static readonly postCreation = new AdvancedRateLimiter('post-creation', {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 3, // Max 3 posts per 15 minutes
    keyGenerator: (userId: string) => `post-create:${userId}`
  });

  // Post update rate limiter
  static readonly postUpdate = new AdvancedRateLimiter('post-update', {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxAttempts: 10, // Max 10 updates per 5 minutes
    keyGenerator: (userId: string) => `post-update:${userId}`
  });

  // Post search rate limiter (more lenient)
  static readonly postSearch = new AdvancedRateLimiter('post-search', {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 30, // Max 30 searches per minute
    keyGenerator: (ip: string) => `post-search:${ip}`
  });

  // Post view rate limiter (to prevent scraping)
  static readonly postView = new AdvancedRateLimiter('post-view', {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 60, // Max 60 views per minute
    keyGenerator: (ip: string) => `post-view:${ip}`
  });

  // Suspicious activity rate limiter (very strict)
  static readonly suspiciousActivity = new AdvancedRateLimiter('suspicious-activity', {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 5, // Max 5 suspicious attempts per hour
    keyGenerator: (identifier: string) => `suspicious:${identifier}`
  });
}

/**
 * User behavior analysis for adaptive rate limiting
 */
export class UserBehaviorAnalyzer {
  private static userActions: Map<string, UserAction[]> = new Map();

  static recordAction(userId: string, action: UserActionType, metadata?: any): void {
    const actions = this.userActions.get(userId) || [];
    
    actions.push({
      type: action,
      timestamp: Date.now(),
      metadata
    });

    // Keep only last 100 actions per user
    if (actions.length > 100) {
      actions.splice(0, actions.length - 100);
    }

    this.userActions.set(userId, actions);
  }

  static analyzeUser(userId: string): UserBehaviorProfile {
    const actions = this.userActions.get(userId) || [];
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const recentActions = actions.filter(action => now - action.timestamp < oneHour);

    // Calculate various metrics
    const postCreationCount = recentActions.filter(a => a.type === 'POST_CREATE').length;
    const postUpdateCount = recentActions.filter(a => a.type === 'POST_UPDATE').length;
    const searchCount = recentActions.filter(a => a.type === 'POST_SEARCH').length;
    const failedAttempts = recentActions.filter(a => a.metadata?.failed === true).length;

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    
    if (failedAttempts > 10) {
      riskLevel = 'CRITICAL';
    } else if (postCreationCount > 5 || searchCount > 100) {
      riskLevel = 'HIGH';
    } else if (postCreationCount > 3 || postUpdateCount > 20 || searchCount > 50) {
      riskLevel = 'MEDIUM';
    }

    // Check for bot-like behavior
    const isBotLike = this.detectBotBehavior(recentActions);

    return {
      userId,
      riskLevel,
      isBotLike,
      recentActionCount: recentActions.length,
      postCreationCount,
      postUpdateCount,
      searchCount,
      failedAttempts,
      recommendedLimits: this.calculateRecommendedLimits(riskLevel, isBotLike)
    };
  }

  private static detectBotBehavior(actions: UserAction[]): boolean {
    if (actions.length < 10) return false;

    // Check for perfectly regular intervals (bot-like)
    const intervals = [];
    for (let i = 1; i < actions.length; i++) {
      intervals.push(actions[i].timestamp - actions[i - 1].timestamp);
    }

    // If more than 70% of intervals are very similar, likely a bot
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const similarIntervals = intervals.filter(interval => 
      Math.abs(interval - avgInterval) < avgInterval * 0.1
    );

    return similarIntervals.length / intervals.length > 0.7;
  }

  private static calculateRecommendedLimits(riskLevel: UserBehaviorProfile['riskLevel'], isBotLike: boolean): RecommendedLimits {
    const baseLimits = {
      postCreation: { windowMs: 15 * 60 * 1000, maxAttempts: 3 },
      postUpdate: { windowMs: 5 * 60 * 1000, maxAttempts: 10 },
      postSearch: { windowMs: 60 * 1000, maxAttempts: 30 }
    };

    // Adjust based on risk level
    const multiplier = {
      'LOW': 1.0,
      'MEDIUM': 0.7,
      'HIGH': 0.5,
      'CRITICAL': 0.2
    }[riskLevel];

    // Further reduce for bot-like behavior
    const botMultiplier = isBotLike ? 0.3 : 1.0;
    const finalMultiplier = multiplier * botMultiplier;

    return {
      postCreation: {
        windowMs: baseLimits.postCreation.windowMs,
        maxAttempts: Math.max(1, Math.floor(baseLimits.postCreation.maxAttempts * finalMultiplier))
      },
      postUpdate: {
        windowMs: baseLimits.postUpdate.windowMs,
        maxAttempts: Math.max(1, Math.floor(baseLimits.postUpdate.maxAttempts * finalMultiplier))
      },
      postSearch: {
        windowMs: baseLimits.postSearch.windowMs,
        maxAttempts: Math.max(5, Math.floor(baseLimits.postSearch.maxAttempts * finalMultiplier))
      }
    };
  }
}

/**
 * IP-based rate limiting for anonymous users
 */
export class IPRateLimiter {
  private static ipData: Map<string, IPData> = new Map();

  static async checkIP(ip: string): Promise<IPRiskAssessment> {
    const data = this.ipData.get(ip) || { requests: [], suspiciousActivity: 0, firstSeen: Date.now() };
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Clean old requests
    data.requests = data.requests.filter(timestamp => now - timestamp < oneHour);

    // Update data
    data.requests.push(now);
    this.ipData.set(ip, data);

    // Assess risk
    const requestsPerHour = data.requests.length;
    const ageInHours = (now - data.firstSeen) / oneHour;
    
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    
    // Very new IP with high activity
    if (ageInHours < 0.1 && requestsPerHour > 20) {
      riskLevel = 'HIGH';
    }
    // High request rate
    else if (requestsPerHour > 200) {
      riskLevel = 'CRITICAL';
    }
    else if (requestsPerHour > 100) {
      riskLevel = 'HIGH';
    }
    else if (requestsPerHour > 50) {
      riskLevel = 'MEDIUM';
    }

    // Factor in suspicious activity history
    if (data.suspiciousActivity > 5) {
      riskLevel = 'CRITICAL';
    } else if (data.suspiciousActivity > 2) {
      riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : riskLevel;
    }

    return {
      ip,
      riskLevel,
      requestsPerHour,
      suspiciousActivityCount: data.suspiciousActivity,
      recommendedAction: this.getRecommendedAction(riskLevel, requestsPerHour)
    };
  }

  static recordSuspiciousActivity(ip: string): void {
    const data = this.ipData.get(ip) || { requests: [], suspiciousActivity: 0, firstSeen: Date.now() };
    data.suspiciousActivity++;
    this.ipData.set(ip, data);

    securityLogger.log({
      ip,
      userAgent: 'ip-rate-limiter',
      method: 'SUSPICIOUS_ACTIVITY',
      path: '/api/posts',
      eventType: 'SUSPICIOUS_ACTIVITY',
      details: {
        suspiciousActivityCount: data.suspiciousActivity,
        totalRequests: data.requests.length
      }
    });
  }

  private static getRecommendedAction(riskLevel: IPRiskAssessment['riskLevel'], requestsPerHour: number): 'ALLOW' | 'THROTTLE' | 'BLOCK_TEMP' | 'BLOCK_PERM' {
    switch (riskLevel) {
      case 'CRITICAL':
        return requestsPerHour > 500 ? 'BLOCK_PERM' : 'BLOCK_TEMP';
      case 'HIGH':
        return 'BLOCK_TEMP';
      case 'MEDIUM':
        return 'THROTTLE';
      default:
        return 'ALLOW';
    }
  }
}

// Type definitions
type UserActionType = 'POST_CREATE' | 'POST_UPDATE' | 'POST_DELETE' | 'POST_SEARCH' | 'POST_VIEW';

interface UserAction {
  type: UserActionType;
  timestamp: number;
  metadata?: any;
}

interface UserBehaviorProfile {
  userId: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isBotLike: boolean;
  recentActionCount: number;
  postCreationCount: number;
  postUpdateCount: number;
  searchCount: number;
  failedAttempts: number;
  recommendedLimits: RecommendedLimits;
}

interface RecommendedLimits {
  postCreation: { windowMs: number; maxAttempts: number };
  postUpdate: { windowMs: number; maxAttempts: number };
  postSearch: { windowMs: number; maxAttempts: number };
}

interface IPData {
  requests: number[];
  suspiciousActivity: number;
  firstSeen: number;
}

interface IPRiskAssessment {
  ip: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requestsPerHour: number;
  suspiciousActivityCount: number;
  recommendedAction: 'ALLOW' | 'THROTTLE' | 'BLOCK_TEMP' | 'BLOCK_PERM';
}

/**
 * Comprehensive rate limiting middleware for posts
 */
export async function checkPostRateLimit(
  operation: 'CREATE' | 'UPDATE' | 'SEARCH' | 'VIEW',
  identifier: string, // userId for authenticated, IP for anonymous
  isAuthenticated: boolean = false
): Promise<RateLimitResult> {
  let limiter: AdvancedRateLimiter;
  
  switch (operation) {
    case 'CREATE':
      limiter = PostRateLimiters.postCreation;
      if (isAuthenticated) {
        UserBehaviorAnalyzer.recordAction(identifier, 'POST_CREATE');
      }
      break;
    case 'UPDATE':
      limiter = PostRateLimiters.postUpdate;
      if (isAuthenticated) {
        UserBehaviorAnalyzer.recordAction(identifier, 'POST_UPDATE');
      }
      break;
    case 'SEARCH':
      limiter = PostRateLimiters.postSearch;
      if (isAuthenticated) {
        UserBehaviorAnalyzer.recordAction(identifier, 'POST_SEARCH');
      }
      break;
    case 'VIEW':
      limiter = PostRateLimiters.postView;
      if (isAuthenticated) {
        UserBehaviorAnalyzer.recordAction(identifier, 'POST_VIEW');
      }
      break;
    default:
      throw new Error('Invalid operation type');
  }

  // For authenticated users, check behavior patterns
  if (isAuthenticated) {
    const profile = UserBehaviorAnalyzer.analyzeUser(identifier);
    
    // If user is high risk, apply stricter limits
    if (profile.riskLevel === 'CRITICAL' || profile.isBotLike) {
      const restrictedResult = await PostRateLimiters.suspiciousActivity.checkLimit(identifier);
      if (!restrictedResult.allowed) {
        return restrictedResult;
      }
    }
  } else {
    // For anonymous users, check IP reputation
    const ipAssessment = await IPRateLimiter.checkIP(identifier);
    
    if (ipAssessment.recommendedAction === 'BLOCK_TEMP' || ipAssessment.recommendedAction === 'BLOCK_PERM') {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + (60 * 60 * 1000), // 1 hour
        retryAfter: 3600
      };
    }
  }

  return await limiter.checkLimit(identifier);
}

/**
 * Record failed attempt for rate limiting
 */
export function recordFailedAttempt(
  operation: 'CREATE' | 'UPDATE' | 'SEARCH' | 'VIEW',
  identifier: string,
  isAuthenticated: boolean = false,
  reason: string = 'unknown'
): void {
  if (isAuthenticated) {
    UserBehaviorAnalyzer.recordAction(identifier, `POST_${operation}` as UserActionType, { failed: true, reason });
  } else {
    IPRateLimiter.recordSuspiciousActivity(identifier);
  }
}