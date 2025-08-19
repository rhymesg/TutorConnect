/**
 * Encryption security middleware for TutorConnect
 * Monitors encryption operations and detects security threats
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityLogger, extractClientIP } from './security';
import { keyManager } from '@/lib/keyManagement';
import { isValidEncryptedData } from '@/lib/encryption';

/**
 * Encryption operation monitoring
 */
interface EncryptionAuditEntry {
  operation: 'encrypt' | 'decrypt' | 'key_access' | 'search_hash';
  fieldName?: string;
  userId?: string;
  success: boolean;
  timestamp: Date;
  ip: string;
  userAgent: string;
  keyVersion?: number;
  errorType?: string;
}

/**
 * Suspicious activity patterns for encryption operations
 */
const SUSPICIOUS_PATTERNS = {
  // Too many decryption failures
  maxDecryptionFailures: 10,
  decryptionFailureWindow: 5 * 60 * 1000, // 5 minutes

  // Bulk data access patterns
  maxRecordsPerRequest: 1000,
  
  // Unusual field access patterns
  sensitiveFieldsThreshold: 5,
  
  // Key operation monitoring
  maxKeyOperationsPerHour: 100
} as const;

/**
 * Encryption monitoring service
 */
class EncryptionSecurityMonitor {
  private auditLog: EncryptionAuditEntry[] = [];
  private readonly maxLogEntries = 50000;
  
  // Track failures per IP
  private failureTracking = new Map<string, Array<{ timestamp: Date; type: string }>>();

  /**
   * Log encryption operation
   */
  logOperation(entry: Omit<EncryptionAuditEntry, 'timestamp'>): void {
    const auditEntry: EncryptionAuditEntry = {
      ...entry,
      timestamp: new Date()
    };

    this.auditLog.push(auditEntry);

    // Maintain log size
    if (this.auditLog.length > this.maxLogEntries) {
      this.auditLog = this.auditLog.slice(-this.maxLogEntries);
    }

    // Check for suspicious patterns
    this.detectSuspiciousActivity(auditEntry);

    // Log to main security logger
    securityLogger.log({
      ip: entry.ip,
      userAgent: entry.userAgent,
      method: 'ENCRYPTION',
      path: `/encryption/${entry.operation}`,
      userId: entry.userId,
      eventType: entry.success ? 'ENCRYPTION_ACCESS' : 'DATA_BREACH_ATTEMPT',
      details: {
        operation: entry.operation,
        fieldName: entry.fieldName,
        errorType: entry.errorType
      },
      encryptionMetadata: {
        fieldsAccessed: entry.fieldName ? [entry.fieldName] : [],
        encryptionStatus: entry.success ? 'decrypted' : 'failed',
        keyVersion: entry.keyVersion
      }
    });
  }

  /**
   * Detect suspicious encryption activity
   */
  private detectSuspiciousActivity(entry: EncryptionAuditEntry): void {
    const ip = entry.ip;
    
    // Initialize failure tracking for IP if needed
    if (!this.failureTracking.has(ip)) {
      this.failureTracking.set(ip, []);
    }

    const ipFailures = this.failureTracking.get(ip)!;

    // Track failures
    if (!entry.success) {
      ipFailures.push({
        timestamp: entry.timestamp,
        type: entry.errorType || 'unknown'
      });

      // Clean old failures (outside window)
      const windowStart = new Date(entry.timestamp.getTime() - SUSPICIOUS_PATTERNS.decryptionFailureWindow);
      this.failureTracking.set(ip, ipFailures.filter(f => f.timestamp > windowStart));
    }

    // Check for excessive failures
    const recentFailures = ipFailures.filter(
      f => entry.timestamp.getTime() - f.timestamp.getTime() < SUSPICIOUS_PATTERNS.decryptionFailureWindow
    );

    if (recentFailures.length >= SUSPICIOUS_PATTERNS.maxDecryptionFailures) {
      this.alertSuspiciousActivity({
        type: 'EXCESSIVE_DECRYPTION_FAILURES',
        ip,
        userId: entry.userId,
        details: {
          failures: recentFailures.length,
          timeWindow: SUSPICIOUS_PATTERNS.decryptionFailureWindow / 1000,
          failureTypes: [...new Set(recentFailures.map(f => f.type))]
        }
      });
    }

    // Check for bulk access patterns
    if (entry.operation === 'decrypt') {
      const recentDecryptions = this.auditLog.filter(
        log => log.ip === ip &&
               log.operation === 'decrypt' &&
               log.timestamp.getTime() > entry.timestamp.getTime() - (60 * 1000) // Last minute
      );

      if (recentDecryptions.length > SUSPICIOUS_PATTERNS.maxRecordsPerRequest / 10) {
        this.alertSuspiciousActivity({
          type: 'BULK_DATA_ACCESS',
          ip,
          userId: entry.userId,
          details: {
            decryptionsPerMinute: recentDecryptions.length,
            fieldsAccessed: [...new Set(recentDecryptions.map(d => d.fieldName).filter(Boolean))]
          }
        });
      }
    }

    // Check for sensitive field enumeration
    if (entry.fieldName && ['phoneNumber', 'nationalIdNumber', 'content'].includes(entry.fieldName)) {
      const sensitiveAccess = this.auditLog.filter(
        log => log.ip === ip &&
               log.fieldName &&
               ['phoneNumber', 'nationalIdNumber', 'content'].includes(log.fieldName) &&
               log.timestamp.getTime() > entry.timestamp.getTime() - (10 * 60 * 1000) // Last 10 minutes
      );

      const uniqueFields = new Set(sensitiveAccess.map(s => s.fieldName));
      if (uniqueFields.size >= SUSPICIOUS_PATTERNS.sensitiveFieldsThreshold) {
        this.alertSuspiciousActivity({
          type: 'SENSITIVE_FIELD_ENUMERATION',
          ip,
          userId: entry.userId,
          details: {
            fieldsAccessed: Array.from(uniqueFields),
            accessCount: sensitiveAccess.length
          }
        });
      }
    }
  }

  /**
   * Alert suspicious activity
   */
  private alertSuspiciousActivity(alert: {
    type: string;
    ip: string;
    userId?: string;
    details: any;
  }): void {
    console.error('ENCRYPTION SECURITY ALERT:', alert);

    // Log to main security system
    securityLogger.log({
      ip: alert.ip,
      userAgent: 'SYSTEM',
      method: 'SECURITY_ALERT',
      path: '/security/encryption',
      userId: alert.userId,
      eventType: 'DATA_BREACH_ATTEMPT',
      details: {
        alertType: alert.type,
        ...alert.details
      }
    });

    // In production, this would:
    // 1. Send alerts to security team
    // 2. Potentially block IP address
    // 3. Trigger incident response procedures
    // 4. Log to SIEM system
  }

  /**
   * Get encryption statistics
   */
  getStatistics(timeWindow: number = 24 * 60 * 60 * 1000): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    operationsByType: Record<string, number>;
    topFailureReasons: Array<{ reason: string; count: number }>;
    suspiciousIPs: string[];
  } {
    const cutoff = new Date(Date.now() - timeWindow);
    const recentLogs = this.auditLog.filter(log => log.timestamp > cutoff);

    const operationsByType: Record<string, number> = {};
    const failureReasons: Record<string, number> = {};
    const suspiciousIPs = new Set<string>();

    for (const log of recentLogs) {
      operationsByType[log.operation] = (operationsByType[log.operation] || 0) + 1;
      
      if (!log.success && log.errorType) {
        failureReasons[log.errorType] = (failureReasons[log.errorType] || 0) + 1;
      }

      // Check if IP has suspicious activity
      const ipFailures = this.failureTracking.get(log.ip) || [];
      const recentFailures = ipFailures.filter(
        f => log.timestamp.getTime() - f.timestamp.getTime() < SUSPICIOUS_PATTERNS.decryptionFailureWindow
      );
      
      if (recentFailures.length >= SUSPICIOUS_PATTERNS.maxDecryptionFailures / 2) {
        suspiciousIPs.add(log.ip);
      }
    }

    return {
      totalOperations: recentLogs.length,
      successfulOperations: recentLogs.filter(log => log.success).length,
      failedOperations: recentLogs.filter(log => !log.success).length,
      operationsByType,
      topFailureReasons: Object.entries(failureReasons)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      suspiciousIPs: Array.from(suspiciousIPs)
    };
  }

  /**
   * Check if IP should be blocked
   */
  shouldBlockIP(ip: string): boolean {
    const failures = this.failureTracking.get(ip) || [];
    const recentFailures = failures.filter(
      f => Date.now() - f.timestamp.getTime() < SUSPICIOUS_PATTERNS.decryptionFailureWindow
    );
    
    return recentFailures.length >= SUSPICIOUS_PATTERNS.maxDecryptionFailures;
  }

  /**
   * Clear old logs and tracking data
   */
  cleanup(): void {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Clean audit log
    this.auditLog = this.auditLog.filter(log => log.timestamp > cutoff);
    
    // Clean failure tracking
    for (const [ip, failures] of this.failureTracking.entries()) {
      const recentFailures = failures.filter(f => f.timestamp > cutoff);
      if (recentFailures.length === 0) {
        this.failureTracking.delete(ip);
      } else {
        this.failureTracking.set(ip, recentFailures);
      }
    }
  }
}

// Singleton monitor instance
export const encryptionMonitor = new EncryptionSecurityMonitor();

/**
 * Middleware to monitor encryption operations
 */
export function encryptionSecurityMiddleware(request: NextRequest): NextResponse | null {
  const ip = extractClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Check if IP should be blocked due to suspicious encryption activity
  if (encryptionMonitor.shouldBlockIP(ip)) {
    securityLogger.log({
      ip,
      userAgent,
      method: request.method,
      path: request.nextUrl.pathname,
      statusCode: 403,
      eventType: 'DATA_BREACH_ATTEMPT',
      details: {
        reason: 'Blocked due to excessive encryption failures',
        blockType: 'encryption_security'
      }
    });

    return NextResponse.json(
      { 
        error: 'Access denied',
        code: 'ENCRYPTION_SECURITY_BLOCK'
      },
      { status: 403 }
    );
  }

  // Add encryption security headers
  const response = NextResponse.next();
  response.headers.set('X-Encryption-Policy', 'aes-256-gcm');
  response.headers.set('X-Key-Rotation-Status', keyManager.shouldRotateKey() ? 'due' : 'current');

  return response;
}

/**
 * Validate encrypted data in request payloads
 */
export function validateEncryptedPayload(request: NextRequest): NextResponse | null {
  if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
    return null;
  }

  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return null;
  }

  // This would be extended to validate encrypted fields in the request body
  // For now, we just add the header for validation
  const response = NextResponse.next();
  response.headers.set('X-Payload-Validation', 'encryption-aware');

  return response;
}

/**
 * Key rotation monitoring middleware
 */
export function keyRotationMiddleware(request: NextRequest): NextResponse | null {
  const ip = extractClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Check if key rotation is overdue (security risk)
  if (keyManager.shouldRotateKey()) {
    const rotationStatus = keyManager.getRotationStatus();
    
    if (!rotationStatus.inProgress) {
      // Log overdue key rotation as security risk
      securityLogger.log({
        ip,
        userAgent,
        method: 'SYSTEM',
        path: '/security/key-rotation',
        eventType: 'SUSPICIOUS_ACTIVITY',
        details: {
          issue: 'Key rotation overdue',
          keyAge: 'unknown', // Would calculate from key metadata
          severity: 'medium'
        }
      });
    }
  }

  return null; // Continue processing
}

/**
 * Data access pattern analysis
 */
export function analyzeDataAccessPatterns(userId?: string, timeWindow: number = 60 * 60 * 1000) {
  const cutoff = new Date(Date.now() - timeWindow);
  
  const userLogs = encryptionMonitor['auditLog'].filter(log => 
    log.userId === userId && log.timestamp > cutoff
  );

  return {
    totalAccess: userLogs.length,
    decryptionOperations: userLogs.filter(log => log.operation === 'decrypt').length,
    failedOperations: userLogs.filter(log => !log.success).length,
    fieldsAccessed: [...new Set(userLogs.map(log => log.fieldName).filter(Boolean))],
    accessPattern: {
      avgOperationsPerMinute: userLogs.length / (timeWindow / 60000),
      burstActivities: this.detectBurstActivity(userLogs),
      unusualTiming: this.detectUnusualTiming(userLogs)
    }
  };
}

/**
 * Helper function to detect burst activity
 */
function detectBurstActivity(logs: EncryptionAuditEntry[]): Array<{
  start: Date;
  end: Date;
  operationCount: number;
}> {
  const bursts: Array<{ start: Date; end: Date; operationCount: number }> = [];
  const burstThreshold = 10; // operations per minute
  const windowSize = 60 * 1000; // 1 minute

  for (let i = 0; i < logs.length; i++) {
    const windowStart = logs[i].timestamp;
    const windowEnd = new Date(windowStart.getTime() + windowSize);
    
    const windowLogs = logs.filter(log => 
      log.timestamp >= windowStart && log.timestamp <= windowEnd
    );

    if (windowLogs.length >= burstThreshold) {
      bursts.push({
        start: windowStart,
        end: windowEnd,
        operationCount: windowLogs.length
      });
    }
  }

  return bursts;
}

/**
 * Helper function to detect unusual timing patterns
 */
function detectUnusualTiming(logs: EncryptionAuditEntry[]): {
  offHoursAccess: number;
  weekendAccess: number;
  nighttimeAccess: number;
} {
  let offHoursAccess = 0;
  let weekendAccess = 0;
  let nighttimeAccess = 0;

  for (const log of logs) {
    const hour = log.timestamp.getHours();
    const day = log.timestamp.getDay();

    // Off hours (before 8 AM or after 6 PM)
    if (hour < 8 || hour > 18) {
      offHoursAccess++;
    }

    // Weekend access
    if (day === 0 || day === 6) {
      weekendAccess++;
    }

    // Nighttime access (11 PM to 6 AM)
    if (hour >= 23 || hour <= 6) {
      nighttimeAccess++;
    }
  }

  return {
    offHoursAccess,
    weekendAccess,
    nighttimeAccess
  };
}

/**
 * Export monitoring utilities
 */
export const encryptionSecurityUtils = {
  monitor: encryptionMonitor,
  analyzeUserAccess: analyzeDataAccessPatterns,
  
  /**
   * Generate security report
   */
  generateSecurityReport(timeWindow: number = 24 * 60 * 60 * 1000) {
    const stats = encryptionMonitor.getStatistics(timeWindow);
    const keyRotationNeeded = keyManager.shouldRotateKey();
    
    return {
      timestamp: new Date(),
      timeWindow,
      encryption: stats,
      keyManagement: {
        rotationNeeded: keyRotationNeeded,
        rotationStatus: keyManager.getRotationStatus()
      },
      recommendations: this.generateRecommendations(stats, keyRotationNeeded)
    };
  },

  /**
   * Generate security recommendations
   */
  generateRecommendations(stats: any, keyRotationNeeded: boolean): string[] {
    const recommendations: string[] = [];

    if (keyRotationNeeded) {
      recommendations.push('Immediate key rotation required for security compliance');
    }

    if (stats.failedOperations > stats.totalOperations * 0.1) {
      recommendations.push('High failure rate detected - investigate encryption issues');
    }

    if (stats.suspiciousIPs.length > 0) {
      recommendations.push(`Monitor suspicious IPs: ${stats.suspiciousIPs.join(', ')}`);
    }

    if (stats.totalOperations > 10000) {
      recommendations.push('Consider implementing additional rate limiting for encryption operations');
    }

    return recommendations;
  }
};