/**
 * Security Monitoring and Alert System for TutorConnect
 * Advanced threat detection and automated response system
 */

import { securityLogger } from '@/middleware/security';

export interface SecurityAlert {
  id: string;
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: SecurityThreatType;
  source: string; // IP or user ID
  description: string;
  details: Record<string, any>;
  automated_response?: string;
  requires_manual_review: boolean;
}

export type SecurityThreatType = 
  | 'CONTENT_INJECTION'
  | 'SPAM_FLOOD'
  | 'RATE_LIMIT_ABUSE'
  | 'SUSPICIOUS_PATTERNS'
  | 'ACCOUNT_COMPROMISE'
  | 'DATA_SCRAPING'
  | 'MALICIOUS_CONTENT'
  | 'PRICING_SCAM'
  | 'FAKE_PROFILES'
  | 'AUTOMATED_ATTACKS';

export interface ThreatPattern {
  name: string;
  pattern: RegExp | ((data: any) => boolean);
  severity: SecurityAlert['severity'];
  description: string;
  automated_response?: 'BLOCK_IP' | 'DISABLE_ACCOUNT' | 'INCREASE_RATE_LIMIT' | 'FLAG_FOR_REVIEW';
}

/**
 * Advanced Security Monitor
 */
export class SecurityMonitor {
  private static alerts: SecurityAlert[] = [];
  private static blockedIPs: Set<string> = new Set();
  private static suspiciousUsers: Map<string, SuspiciousUserProfile> = new Map();
  
  // Threat detection patterns
  private static readonly threatPatterns: ThreatPattern[] = [
    {
      name: 'SQL Injection Attempt',
      pattern: /(\bunion\b|\bselect\b.*\bfrom\b|';\s*drop\s+table)/gi,
      severity: 'CRITICAL',
      description: 'SQL injection patterns detected in user input',
      automated_response: 'BLOCK_IP'
    },
    {
      name: 'XSS Attack Vector',
      pattern: /<script[^>]*>|javascript:|vbscript:|onload=|onerror=/gi,
      severity: 'CRITICAL',
      description: 'Cross-site scripting attack attempt detected',
      automated_response: 'BLOCK_IP'
    },
    {
      name: 'Command Injection',
      pattern: /[\|&;`]\s*(rm|del|format|shutdown|cat|ls|dir)/gi,
      severity: 'CRITICAL',
      description: 'Command injection attempt detected',
      automated_response: 'BLOCK_IP'
    },
    {
      name: 'Spam Content Pattern',
      pattern: (data: any) => {
        if (typeof data !== 'string') return false;
        const spamKeywords = ['gratis penger', 'lett fortjent', '100% sikker', 'garantert inntekt'];
        return spamKeywords.filter(keyword => data.toLowerCase().includes(keyword)).length >= 2;
      },
      severity: 'HIGH',
      description: 'Multiple spam keywords detected',
      automated_response: 'FLAG_FOR_REVIEW'
    },
    {
      name: 'Rapid Post Creation',
      pattern: (data: any) => {
        if (!data.userId) return false;
        const profile = this.suspiciousUsers.get(data.userId);
        return profile && profile.postCreationCount > 10;
      },
      severity: 'HIGH',
      description: 'Unusually high post creation rate',
      automated_response: 'INCREASE_RATE_LIMIT'
    },
    {
      name: 'Suspicious Pricing',
      pattern: (data: any) => {
        if (!data.pricing) return false;
        const rates = [data.pricing.hourlyRate, data.pricing.hourlyRateMin, data.pricing.hourlyRateMax].filter(Boolean);
        return rates.some(rate => rate < 10 || rate > 5000); // Extremely low or high rates
      },
      severity: 'MEDIUM',
      description: 'Suspicious pricing detected',
      automated_response: 'FLAG_FOR_REVIEW'
    },
    {
      name: 'Bot-like Behavior',
      pattern: (data: any) => {
        if (!data.userAgent) return false;
        const botPatterns = /bot|crawler|spider|scraper|automated|headless/gi;
        return botPatterns.test(data.userAgent) && !data.isAuthenticated;
      },
      severity: 'MEDIUM',
      description: 'Bot-like user agent detected',
      automated_response: 'INCREASE_RATE_LIMIT'
    }
  ];

  /**
   * Analyze security event and generate alerts
   */
  static async analyzeSecurityEvent(event: SecurityEvent): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    
    try {
      // Check against all threat patterns
      for (const pattern of this.threatPatterns) {
        let matches = false;
        
        if (pattern.pattern instanceof RegExp) {
          // Check all string values in the event
          const eventString = JSON.stringify(event);
          matches = pattern.pattern.test(eventString);
        } else if (typeof pattern.pattern === 'function') {
          matches = pattern.pattern(event);
        }
        
        if (matches) {
          const alert = await this.createAlert(pattern, event);
          alerts.push(alert);
          
          // Execute automated response if defined
          if (pattern.automated_response) {
            await this.executeAutomatedResponse(pattern.automated_response, event, alert);
          }
        }
      }
      
      // Additional analysis based on event type
      const contextualAlerts = await this.contextualAnalysis(event);
      alerts.push(...contextualAlerts);
      
      // Store alerts
      this.alerts.push(...alerts);
      
      // Cleanup old alerts (keep last 1000)
      if (this.alerts.length > 1000) {
        this.alerts = this.alerts.slice(-1000);
      }
      
      return alerts;
      
    } catch (error) {
      console.error('Error analyzing security event:', error);
      return [];
    }
  }

  /**
   * Create security alert
   */
  private static async createAlert(pattern: ThreatPattern, event: SecurityEvent): Promise<SecurityAlert> {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      severity: pattern.severity,
      type: this.mapPatternToThreatType(pattern.name),
      source: event.userId || event.ip || 'unknown',
      description: pattern.description,
      details: {
        pattern: pattern.name,
        event,
        automated_response: pattern.automated_response
      },
      automated_response: pattern.automated_response,
      requires_manual_review: pattern.severity === 'CRITICAL' || pattern.severity === 'HIGH'
    };
    
    // Log to security logger
    securityLogger.log({
      ip: event.ip || 'unknown',
      userAgent: event.userAgent || 'unknown',
      method: 'SECURITY_ALERT',
      path: event.endpoint || '/unknown',
      userId: event.userId,
      eventType: 'SUSPICIOUS_ACTIVITY',
      details: {
        alertId: alert.id,
        threatType: alert.type,
        severity: alert.severity,
        patternName: pattern.name
      }
    });
    
    return alert;
  }

  /**
   * Execute automated response to threats
   */
  private static async executeAutomatedResponse(
    response: string,
    event: SecurityEvent,
    alert: SecurityAlert
  ): Promise<void> {
    try {
      switch (response) {
        case 'BLOCK_IP':
          if (event.ip) {
            this.blockedIPs.add(event.ip);
            console.log(`[SECURITY] Blocked IP: ${event.ip} - Alert: ${alert.id}`);
          }
          break;
          
        case 'DISABLE_ACCOUNT':
          if (event.userId) {
            // In a real implementation, this would disable the user account
            console.log(`[SECURITY] Account flagged for review: ${event.userId} - Alert: ${alert.id}`);
          }
          break;
          
        case 'INCREASE_RATE_LIMIT':
          if (event.userId) {
            this.addSuspiciousUser(event.userId, 'RATE_LIMIT_INCREASE');
          }
          break;
          
        case 'FLAG_FOR_REVIEW':
          console.log(`[SECURITY] Flagged for manual review - Alert: ${alert.id}`);
          break;
      }
      
      // Log automated response
      securityLogger.log({
        ip: event.ip || 'unknown',
        userAgent: event.userAgent || 'unknown',
        method: 'AUTOMATED_RESPONSE',
        path: event.endpoint || '/unknown',
        userId: event.userId,
        eventType: 'SUSPICIOUS_ACTIVITY',
        details: {
          alertId: alert.id,
          response,
          executedAt: new Date()
        }
      });
      
    } catch (error) {
      console.error('Error executing automated response:', error);
    }
  }

  /**
   * Contextual analysis based on event type and history
   */
  private static async contextualAnalysis(event: SecurityEvent): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    
    // Analyze user behavior patterns
    if (event.userId) {
      const userProfile = this.suspiciousUsers.get(event.userId);
      if (userProfile) {
        // Check for escalating suspicious behavior
        if (userProfile.suspiciousActivityCount > 5) {
          alerts.push(await this.createAlert({
            name: 'Escalating Suspicious Activity',
            pattern: () => true,
            severity: 'HIGH',
            description: `User has ${userProfile.suspiciousActivityCount} suspicious activities`,
            automated_response: 'FLAG_FOR_REVIEW'
          }, event));
        }
      }
    }
    
    // Analyze IP patterns
    if (event.ip) {
      const recentEventsFromIP = this.alerts.filter(alert => 
        alert.source === event.ip && 
        Date.now() - alert.timestamp.getTime() < 60 * 60 * 1000 // Last hour
      );
      
      if (recentEventsFromIP.length > 3) {
        alerts.push(await this.createAlert({
          name: 'Multiple Threats from IP',
          pattern: () => true,
          severity: 'HIGH',
          description: `IP has generated ${recentEventsFromIP.length} alerts in the last hour`,
          automated_response: 'BLOCK_IP'
        }, event));
      }
    }
    
    return alerts;
  }

  /**
   * Check if IP is blocked
   */
  static isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * Check if user is suspicious
   */
  static isUserSuspicious(userId: string): boolean {
    const profile = this.suspiciousUsers.get(userId);
    return profile ? profile.suspiciousActivityCount > 3 : false;
  }

  /**
   * Add suspicious user
   */
  static addSuspiciousUser(userId: string, reason: string): void {
    const existing = this.suspiciousUsers.get(userId) || {
      userId,
      suspiciousActivityCount: 0,
      lastActivity: new Date(),
      reasons: [],
      postCreationCount: 0
    };
    
    existing.suspiciousActivityCount++;
    existing.lastActivity = new Date();
    existing.reasons.push(reason);
    
    this.suspiciousUsers.set(userId, existing);
  }

  /**
   * Get security dashboard data
   */
  static getSecurityDashboard(): SecurityDashboard {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    
    const recentAlerts = this.alerts.filter(alert => now - alert.timestamp.getTime() < oneHour);
    const dailyAlerts = this.alerts.filter(alert => now - alert.timestamp.getTime() < oneDay);
    
    const criticalAlerts = dailyAlerts.filter(alert => alert.severity === 'CRITICAL');
    const highAlerts = dailyAlerts.filter(alert => alert.severity === 'HIGH');
    
    return {
      totalAlerts: this.alerts.length,
      recentAlerts: recentAlerts.length,
      dailyAlerts: dailyAlerts.length,
      criticalAlerts: criticalAlerts.length,
      highAlerts: highAlerts.length,
      blockedIPs: this.blockedIPs.size,
      suspiciousUsers: this.suspiciousUsers.size,
      topThreats: this.getTopThreats(dailyAlerts),
      alertsByHour: this.getAlertsByHour(dailyAlerts)
    };
  }

  /**
   * Get alerts requiring manual review
   */
  static getAlertsForReview(): SecurityAlert[] {
    return this.alerts
      .filter(alert => alert.requires_manual_review)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50); // Last 50 alerts requiring review
  }

  /**
   * Resolve security alert (mark as reviewed)
   */
  static resolveAlert(alertId: string, resolution: string): boolean {
    const alertIndex = this.alerts.findIndex(alert => alert.id === alertId);
    if (alertIndex !== -1) {
      this.alerts[alertIndex].details.resolution = resolution;
      this.alerts[alertIndex].details.resolvedAt = new Date();
      this.alerts[alertIndex].requires_manual_review = false;
      return true;
    }
    return false;
  }

  // Helper methods
  private static generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static mapPatternToThreatType(patternName: string): SecurityThreatType {
    const mapping: Record<string, SecurityThreatType> = {
      'SQL Injection Attempt': 'CONTENT_INJECTION',
      'XSS Attack Vector': 'CONTENT_INJECTION',
      'Command Injection': 'CONTENT_INJECTION',
      'Spam Content Pattern': 'SPAM_FLOOD',
      'Rapid Post Creation': 'RATE_LIMIT_ABUSE',
      'Suspicious Pricing': 'PRICING_SCAM',
      'Bot-like Behavior': 'AUTOMATED_ATTACKS',
      'Escalating Suspicious Activity': 'SUSPICIOUS_PATTERNS',
      'Multiple Threats from IP': 'SUSPICIOUS_PATTERNS'
    };
    
    return mapping[patternName] || 'SUSPICIOUS_PATTERNS';
  }

  private static getTopThreats(alerts: SecurityAlert[]): Array<{ type: SecurityThreatType; count: number }> {
    const threatCounts = alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<SecurityThreatType, number>);
    
    return Object.entries(threatCounts)
      .map(([type, count]) => ({ type: type as SecurityThreatType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private static getAlertsByHour(alerts: SecurityAlert[]): number[] {
    const hourCounts = new Array(24).fill(0);
    
    alerts.forEach(alert => {
      const hour = alert.timestamp.getHours();
      hourCounts[hour]++;
    });
    
    return hourCounts;
  }
}

// Type definitions
export interface SecurityEvent {
  userId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  operation?: string;
  content?: string;
  isAuthenticated?: boolean;
  pricing?: {
    hourlyRate?: number;
    hourlyRateMin?: number;
    hourlyRateMax?: number;
  };
  metadata?: Record<string, any>;
}

interface SuspiciousUserProfile {
  userId: string;
  suspiciousActivityCount: number;
  lastActivity: Date;
  reasons: string[];
  postCreationCount: number;
}

interface SecurityDashboard {
  totalAlerts: number;
  recentAlerts: number;
  dailyAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  blockedIPs: number;
  suspiciousUsers: number;
  topThreats: Array<{ type: SecurityThreatType; count: number }>;
  alertsByHour: number[];
}

/**
 * Security event reporter
 */
export function reportSecurityEvent(event: SecurityEvent): Promise<SecurityAlert[]> {
  return SecurityMonitor.analyzeSecurityEvent(event);
}

/**
 * Check security status for requests
 */
export function checkSecurityStatus(ip: string, userId?: string): {
  blocked: boolean;
  suspicious: boolean;
  reason?: string;
} {
  const ipBlocked = SecurityMonitor.isIPBlocked(ip);
  const userSuspicious = userId ? SecurityMonitor.isUserSuspicious(userId) : false;
  
  if (ipBlocked) {
    return { blocked: true, suspicious: true, reason: 'IP address blocked due to security threats' };
  }
  
  if (userSuspicious) {
    return { blocked: false, suspicious: true, reason: 'User account flagged for suspicious activity' };
  }
  
  return { blocked: false, suspicious: false };
}

/**
 * Emergency security response
 */
export async function emergencySecurityResponse(threat: 'DDOS' | 'MASS_SPAM' | 'DATA_BREACH'): Promise<void> {
  console.log(`[EMERGENCY] Security response activated for threat: ${threat}`);
  
  switch (threat) {
    case 'DDOS':
      // Implement emergency rate limiting
      console.log('[EMERGENCY] Activating emergency rate limiting');
      break;
      
    case 'MASS_SPAM':
      // Temporarily increase content filtering sensitivity
      console.log('[EMERGENCY] Increasing content filtering sensitivity');
      break;
      
    case 'DATA_BREACH':
      // Log security incident and prepare for investigation
      console.log('[EMERGENCY] Data breach response activated');
      break;
  }
  
  // Log emergency response
  securityLogger.log({
    ip: 'system',
    userAgent: 'security-monitor',
    method: 'EMERGENCY_RESPONSE',
    path: '/security/emergency',
    eventType: 'SUSPICIOUS_ACTIVITY',
    details: {
      threat,
      timestamp: new Date(),
      automated: true
    }
  });
}