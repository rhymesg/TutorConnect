/**
 * Input Sanitization Utilities for TutorConnect
 * Comprehensive data cleaning and XSS prevention for Norwegian tutoring platform
 */

export interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  maxLength?: number;
  preserveLineBreaks?: boolean;
  allowEmojis?: boolean;
  stripPhoneNumbers?: boolean;
  stripEmailAddresses?: boolean;
  norwegianSpecific?: boolean;
}

export interface SanitizationResult {
  sanitized: string;
  wasModified: boolean;
  removedElements: string[];
  warnings: string[];
}

/**
 * Comprehensive input sanitizer with Norwegian-specific handling
 */
export class TutorConnectSanitizer {
  private static readonly DEFAULT_OPTIONS: SanitizationOptions = {
    allowedTags: [],
    allowedAttributes: [],
    maxLength: 10000,
    preserveLineBreaks: true,
    allowEmojis: true,
    stripPhoneNumbers: false,
    stripEmailAddresses: false,
    norwegianSpecific: true
  };

  /**
   * Main sanitization function
   */
  static sanitize(input: string, options: SanitizationOptions = {}): SanitizationResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const removedElements: string[] = [];
    const warnings: string[] = [];
    let current = input;
    const original = input;

    // Step 1: Basic HTML/Script removal
    const htmlResult = this.removeHtmlAndScripts(current);
    current = htmlResult.cleaned;
    removedElements.push(...htmlResult.removed);

    // Step 2: XSS prevention
    const xssResult = this.preventXSS(current);
    current = xssResult.cleaned;
    removedElements.push(...xssResult.removed);

    // Step 3: SQL injection prevention
    const sqlResult = this.preventSQLInjection(current);
    current = sqlResult.cleaned;
    removedElements.push(...sqlResult.removed);

    // Step 4: Command injection prevention
    const cmdResult = this.preventCommandInjection(current);
    current = cmdResult.cleaned;
    removedElements.push(...cmdResult.removed);

    // Step 5: URL and link sanitization
    const urlResult = this.sanitizeUrls(current);
    current = urlResult.cleaned;
    removedElements.push(...urlResult.removed);

    // Step 6: Contact information handling
    if (opts.stripPhoneNumbers) {
      const phoneResult = this.removePhoneNumbers(current, opts.norwegianSpecific);
      current = phoneResult.cleaned;
      removedElements.push(...phoneResult.removed);
    }

    if (opts.stripEmailAddresses) {
      const emailResult = this.removeEmailAddresses(current);
      current = emailResult.cleaned;
      removedElements.push(...emailResult.removed);
    }

    // Step 7: Norwegian-specific cleaning
    if (opts.norwegianSpecific) {
      const norwegianResult = this.norwegianSpecificCleaning(current);
      current = norwegianResult.cleaned;
      removedElements.push(...norwegianResult.removed);
      warnings.push(...norwegianResult.warnings);
    }

    // Step 8: Length and formatting
    current = this.normalizeWhitespace(current, opts.preserveLineBreaks);
    
    if (opts.maxLength && current.length > opts.maxLength) {
      current = current.substring(0, opts.maxLength);
      warnings.push(`Content truncated to ${opts.maxLength} characters`);
    }

    // Step 9: Emoji handling
    if (!opts.allowEmojis) {
      const emojiResult = this.removeEmojis(current);
      current = emojiResult.cleaned;
      removedElements.push(...emojiResult.removed);
    }

    return {
      sanitized: current,
      wasModified: current !== original,
      removedElements: removedElements.filter(Boolean),
      warnings
    };
  }

  /**
   * Remove HTML tags and script elements
   */
  private static removeHtmlAndScripts(input: string): { cleaned: string; removed: string[] } {
    const removed: string[] = [];
    let cleaned = input;

    // Remove script tags and content
    const scriptMatches = cleaned.match(/<script[^>]*>.*?<\/script>/gis);
    if (scriptMatches) {
      removed.push(...scriptMatches.map(match => `Script tag: ${match.substring(0, 50)}...`));
      cleaned = cleaned.replace(/<script[^>]*>.*?<\/script>/gis, '');
    }

    // Remove style tags and content
    const styleMatches = cleaned.match(/<style[^>]*>.*?<\/style>/gis);
    if (styleMatches) {
      removed.push(...styleMatches.map(match => `Style tag: ${match.substring(0, 50)}...`));
      cleaned = cleaned.replace(/<style[^>]*>.*?<\/style>/gis, '');
    }

    // Remove all other HTML tags but preserve content
    const tagMatches = cleaned.match(/<[^>]+>/g);
    if (tagMatches) {
      removed.push(...tagMatches.map(tag => `HTML tag: ${tag}`));
      cleaned = cleaned.replace(/<[^>]+>/g, '');
    }

    return { cleaned, removed };
  }

  /**
   * Prevent XSS attacks
   */
  private static preventXSS(input: string): { cleaned: string; removed: string[] } {
    const removed: string[] = [];
    let cleaned = input;

    const xssPatterns = [
      // JavaScript pseudo-protocols
      { pattern: /javascript\s*:/gi, description: 'JavaScript pseudo-protocol' },
      { pattern: /vbscript\s*:/gi, description: 'VBScript pseudo-protocol' },
      { pattern: /data\s*:/gi, description: 'Data URI' },
      
      // Event handlers
      { pattern: /on\w+\s*=/gi, description: 'Event handler attribute' },
      
      // Expression and eval patterns
      { pattern: /expression\s*\(/gi, description: 'CSS expression' },
      { pattern: /eval\s*\(/gi, description: 'JavaScript eval' },
      
      // Meta refresh redirects
      { pattern: /<meta[^>]*http-equiv\s*=\s*["']?refresh["']?/gi, description: 'Meta refresh' },
      
      // Base64 encoded scripts
      { pattern: /data:text\/html;base64,/gi, description: 'Base64 HTML data URI' },
    ];

    for (const { pattern, description } of xssPatterns) {
      const matches = cleaned.match(pattern);
      if (matches) {
        removed.push(...matches.map(match => `XSS pattern (${description}): ${match}`));
        cleaned = cleaned.replace(pattern, '');
      }
    }

    return { cleaned, removed };
  }

  /**
   * Prevent SQL injection patterns
   */
  private static preventSQLInjection(input: string): { cleaned: string; removed: string[] } {
    const removed: string[] = [];
    let cleaned = input;

    const sqlPatterns = [
      // Common SQL injection patterns
      { pattern: /(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b)\s+.*(from|into|where|table)/gi, description: 'SQL command pattern' },
      { pattern: /['"];\s*(drop|delete|insert|update|select)/gi, description: 'SQL injection with semicolon' },
      { pattern: /\b(exec|execute)\s*\(/gi, description: 'SQL execute command' },
      { pattern: /\bor\s+1\s*=\s*1/gi, description: 'SQL OR 1=1 pattern' },
      { pattern: /\band\s+1\s*=\s*1/gi, description: 'SQL AND 1=1 pattern' },
      { pattern: /\/\*.*?\*\//g, description: 'SQL comment block' },
      { pattern: /--[^\r\n]*/g, description: 'SQL line comment' },
    ];

    for (const { pattern, description } of sqlPatterns) {
      const matches = cleaned.match(pattern);
      if (matches) {
        removed.push(...matches.map(match => `SQL injection pattern (${description}): ${match}`));
        cleaned = cleaned.replace(pattern, '');
      }
    }

    return { cleaned, removed };
  }

  /**
   * Prevent command injection
   */
  private static preventCommandInjection(input: string): { cleaned: string; removed: string[] } {
    const removed: string[] = [];
    let cleaned = input;

    const cmdPatterns = [
      // Shell command patterns
      { pattern: /[\|&;`]\s*(rm|del|format|shutdown|reboot|kill|ps|ls|dir|cat|type|copy|move|mkdir|rmdir)/gi, description: 'Shell command injection' },
      { pattern: /\$\(.*?\)/g, description: 'Command substitution' },
      { pattern: /`.*?`/g, description: 'Backtick command execution' },
      { pattern: /\${.*?}/g, description: 'Variable expansion' },
      
      // System call patterns
      { pattern: /\b(system|exec|shell_exec|passthru|popen)\s*\(/gi, description: 'System call function' },
    ];

    for (const { pattern, description } of cmdPatterns) {
      const matches = cleaned.match(pattern);
      if (matches) {
        removed.push(...matches.map(match => `Command injection pattern (${description}): ${match}`));
        cleaned = cleaned.replace(pattern, '');
      }
    }

    return { cleaned, removed };
  }

  /**
   * Sanitize URLs and remove suspicious links
   */
  private static sanitizeUrls(input: string): { cleaned: string; removed: string[] } {
    const removed: string[] = [];
    let cleaned = input;

    // Suspicious TLDs and domains
    const suspiciousDomains = [
      /\b[a-z0-9\-\.]+\.(tk|ml|ga|cf|bit\.ly|tinyurl|t\.co)\b/gi,
      /\b[a-z0-9\-\.]+\.(exe|scr|bat|com|pif)\b/gi,
    ];

    for (const pattern of suspiciousDomains) {
      const matches = cleaned.match(pattern);
      if (matches) {
        removed.push(...matches.map(match => `Suspicious URL: ${match}`));
        cleaned = cleaned.replace(pattern, '[REMOVED_SUSPICIOUS_LINK]');
      }
    }

    // Remove data URIs that could contain malicious content
    const dataUriMatches = cleaned.match(/data:[^;]+;base64,[a-zA-Z0-9+\/]+=*/g);
    if (dataUriMatches) {
      removed.push(...dataUriMatches.map(match => `Data URI: ${match.substring(0, 50)}...`));
      cleaned = cleaned.replace(/data:[^;]+;base64,[a-zA-Z0-9+\/]+=*/g, '[REMOVED_DATA_URI]');
    }

    return { cleaned, removed };
  }

  /**
   * Remove phone numbers (Norwegian format)
   */
  private static removePhoneNumbers(input: string, norwegianSpecific: boolean = true): { cleaned: string; removed: string[] } {
    const removed: string[] = [];
    let cleaned = input;

    const phonePatterns = norwegianSpecific ? [
      // Norwegian phone number patterns
      /(\+47\s*)?[4-9]\d{7}/g,
      /\b\d{3}\s*\d{2}\s*\d{3}\b/g,
      /\b\d{8}\b/g,
    ] : [
      // International phone patterns
      /\+\d{1,4}\s*\d{6,14}/g,
      /\(\d{3}\)\s*\d{3}-\d{4}/g,
      /\d{3}-\d{3}-\d{4}/g,
    ];

    for (const pattern of phonePatterns) {
      const matches = cleaned.match(pattern);
      if (matches) {
        removed.push(...matches.map(match => `Phone number: ${match}`));
        cleaned = cleaned.replace(pattern, '[PHONE_REMOVED]');
      }
    }

    return { cleaned, removed };
  }

  /**
   * Remove email addresses
   */
  private static removeEmailAddresses(input: string): { cleaned: string; removed: string[] } {
    const removed: string[] = [];
    let cleaned = input;

    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = cleaned.match(emailPattern);
    
    if (matches) {
      removed.push(...matches.map(match => `Email address: ${match}`));
      cleaned = cleaned.replace(emailPattern, '[EMAIL_REMOVED]');
    }

    return { cleaned, removed };
  }

  /**
   * Norwegian-specific content cleaning
   */
  private static norwegianSpecificCleaning(input: string): { cleaned: string; removed: string[]; warnings: string[] } {
    const removed: string[] = [];
    const warnings: string[] = [];
    let cleaned = input;

    // Norwegian spam phrases
    const norwegianSpamPatterns = [
      { pattern: /\b(gratis\s*penger|lett\s*fortjent|garantert\s*inntekt)\b/gi, description: 'Norwegian money scam phrase' },
      { pattern: /\b(100%\s*sikker|risikofri|ingen\s*investering)\b/gi, description: 'Norwegian risk-free claim' },
      { pattern: /\b(ring\s*nå|handle\s*i\s*dag|begrenset\s*tid)\b/gi, description: 'Norwegian urgency phrase' },
    ];

    for (const { pattern, description } of norwegianSpamPatterns) {
      const matches = cleaned.match(pattern);
      if (matches) {
        removed.push(...matches.map(match => `${description}: ${match}`));
        warnings.push(`Removed suspicious Norwegian phrase: ${matches[0]}`);
        cleaned = cleaned.replace(pattern, '[REMOVED_SUSPICIOUS_CONTENT]');
      }
    }

    // Norwegian profanity (basic filter)
    const profanityPattern = /\b(faen|helvete|dritt)\b/gi;
    const profanityMatches = cleaned.match(profanityPattern);
    if (profanityMatches && profanityMatches.length > 2) {
      warnings.push('Excessive profanity detected');
      cleaned = cleaned.replace(profanityPattern, '[REDACTED]');
      removed.push(`Excessive Norwegian profanity: ${profanityMatches.length} instances`);
    }

    return { cleaned, removed, warnings };
  }

  /**
   * Normalize whitespace and line breaks
   */
  private static normalizeWhitespace(input: string, preserveLineBreaks: boolean = true): string {
    let cleaned = input;

    if (preserveLineBreaks) {
      // Preserve line breaks but clean up excessive whitespace
      cleaned = cleaned.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs to single space
      cleaned = cleaned.replace(/\n\s*\n/g, '\n\n'); // Multiple line breaks to double line break
      cleaned = cleaned.replace(/^\s+|\s+$/g, ''); // Trim start and end
    } else {
      // Replace all whitespace with single spaces
      cleaned = cleaned.replace(/\s+/g, ' ');
      cleaned = cleaned.trim();
    }

    return cleaned;
  }

  /**
   * Remove emojis and special Unicode characters
   */
  private static removeEmojis(input: string): { cleaned: string; removed: string[] } {
    const removed: string[] = [];
    let cleaned = input;

    // Emoji range patterns
    const emojiPattern = /[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu;
    
    const matches = cleaned.match(emojiPattern);
    if (matches) {
      removed.push(`Emojis: ${matches.join('')}`);
      cleaned = cleaned.replace(emojiPattern, '');
    }

    return { cleaned, removed };
  }
}

/**
 * Specialized sanitization functions for different post fields
 */
export class PostFieldSanitizer {
  /**
   * Sanitize post title
   */
  static sanitizeTitle(title: string): SanitizationResult {
    return TutorConnectSanitizer.sanitize(title, {
      maxLength: 100,
      preserveLineBreaks: false,
      allowEmojis: false,
      stripPhoneNumbers: true,
      stripEmailAddresses: true,
      norwegianSpecific: true
    });
  }

  /**
   * Sanitize post description
   */
  static sanitizeDescription(description: string): SanitizationResult {
    return TutorConnectSanitizer.sanitize(description, {
      maxLength: 2000,
      preserveLineBreaks: true,
      allowEmojis: true,
      stripPhoneNumbers: false, // Allow phone numbers in descriptions but warn
      stripEmailAddresses: false, // Allow emails but warn
      norwegianSpecific: true
    });
  }

  /**
   * Sanitize location information
   */
  static sanitizeLocation(location: string): SanitizationResult {
    return TutorConnectSanitizer.sanitize(location, {
      maxLength: 200,
      preserveLineBreaks: false,
      allowEmojis: false,
      stripPhoneNumbers: true,
      stripEmailAddresses: true,
      norwegianSpecific: true
    });
  }

  /**
   * Sanitize preferred schedule
   */
  static sanitizeSchedule(schedule: string): SanitizationResult {
    return TutorConnectSanitizer.sanitize(schedule, {
      maxLength: 500,
      preserveLineBreaks: true,
      allowEmojis: false,
      stripPhoneNumbers: true,
      stripEmailAddresses: true,
      norwegianSpecific: true
    });
  }
}

/**
 * Quick sanitization functions for common use cases
 */
export const quickSanitize = {
  /**
   * Basic XSS protection
   */
  xss: (input: string): string => {
    return TutorConnectSanitizer.sanitize(input, {
      maxLength: undefined,
      preserveLineBreaks: true,
      allowEmojis: true,
      stripPhoneNumbers: false,
      stripEmailAddresses: false,
      norwegianSpecific: false
    }).sanitized;
  },

  /**
   * Aggressive cleaning for high-risk content
   */
  aggressive: (input: string): string => {
    return TutorConnectSanitizer.sanitize(input, {
      maxLength: 1000,
      preserveLineBreaks: false,
      allowEmojis: false,
      stripPhoneNumbers: true,
      stripEmailAddresses: true,
      norwegianSpecific: true
    }).sanitized;
  },

  /**
   * Minimal cleaning for trusted content
   */
  minimal: (input: string): string => {
    return TutorConnectSanitizer.sanitize(input, {
      maxLength: undefined,
      preserveLineBreaks: true,
      allowEmojis: true,
      stripPhoneNumbers: false,
      stripEmailAddresses: false,
      norwegianSpecific: false
    }).sanitized;
  }
};

/**
 * Validate that sanitized content is safe
 */
export function validateSanitizedContent(result: SanitizationResult): { isSafe: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  // Check if content was heavily modified
  if (result.removedElements.length > 5) {
    reasons.push('Content required extensive sanitization');
  }

  // Check for critical security removals
  const criticalRemovals = result.removedElements.filter(item => 
    item.includes('Script tag') || 
    item.includes('XSS pattern') || 
    item.includes('SQL injection')
  );

  if (criticalRemovals.length > 0) {
    reasons.push('Critical security threats were removed');
  }

  // Check if content is too short after sanitization
  if (result.sanitized.trim().length < 10) {
    reasons.push('Content is too short after sanitization');
  }

  return {
    isSafe: reasons.length === 0,
    reasons
  };
}