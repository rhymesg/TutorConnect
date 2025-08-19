/**
 * Content Filtering and Moderation Utilities for TutorConnect
 * Norwegian tutoring platform security and content moderation
 */

export interface ContentModerationResult {
  allowed: boolean;
  confidence: number; // 0-1 scale
  flags: ContentFlag[];
  sanitizedContent?: string;
  reason?: string;
}

export interface ContentFlag {
  type: 'SPAM' | 'MALICIOUS' | 'INAPPROPRIATE' | 'SUSPICIOUS' | 'CONTACT_INFO' | 'PRICING_SCAM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  pattern?: string;
}

// Norwegian-specific spam patterns
const NORWEGIAN_SPAM_PATTERNS = [
  // Money-making schemes in Norwegian
  { pattern: /\b(tjene?\s*penger?\s*hjemme|lett\s*fortjent|garantert\s*inntekt)\b/gi, severity: 'HIGH' as const },
  { pattern: /\b(100%\s*sikker|risikofri|ingen\s*investering)\b/gi, severity: 'HIGH' as const },
  { pattern: /\b(rask\s*penger|øyeblikkelig\s*betaling)\b/gi, severity: 'MEDIUM' as const },
  
  // Multi-level marketing / pyramid schemes
  { pattern: /\b(pyramid|mlm|multi.?level|nettverksmarkedsføring)\b/gi, severity: 'HIGH' as const },
  { pattern: /\b(rekruttere?\s*venner|bygg\s*ditt\s*team)\b/gi, severity: 'MEDIUM' as const },
  
  // Urgency patterns
  { pattern: /\b(ring\s*nå|handle\s*i\s*dag|begrenset\s*tid)\b/gi, severity: 'MEDIUM' as const },
  { pattern: /\b(siste\s*sjanse|kun\s*i\s*dag|tilbud\s*utløper)\b/gi, severity: 'MEDIUM' as const },
  
  // Suspicious tutoring claims
  { pattern: /\b(garantert\s*karakterforbedring|100%\s*suksessrate)\b/gi, severity: 'HIGH' as const },
  { pattern: /\b(bestått\s*eksamen\s*garantert|sikker\s*bestått)\b/gi, severity: 'HIGH' as const },
];

// Malicious content patterns
const MALICIOUS_PATTERNS = [
  // Script injection
  { pattern: /<script[^>]*>.*?<\/script>/gi, severity: 'CRITICAL' as const },
  { pattern: /javascript\s*:/gi, severity: 'CRITICAL' as const },
  { pattern: /vbscript\s*:/gi, severity: 'CRITICAL' as const },
  { pattern: /on\w+\s*=/gi, severity: 'CRITICAL' as const },
  
  // SQL injection
  { pattern: /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b).*(\bfrom\b|\binto\b|\bwhere\b)/gi, severity: 'CRITICAL' as const },
  { pattern: /['"];\s*(drop|delete|insert|update)/gi, severity: 'CRITICAL' as const },
  
  // Command injection
  { pattern: /(\bexec\b|\beval\b|\bsystem\b|\bshell\b|\bcmd\b)\s*\(/gi, severity: 'CRITICAL' as const },
  { pattern: /[\|&;`]\s*(rm|del|format|shutdown)/gi, severity: 'CRITICAL' as const },
  
  // File inclusion attacks
  { pattern: /\.\.\//g, severity: 'HIGH' as const },
  { pattern: /\/etc\/passwd|\/proc\/|\/sys\//gi, severity: 'CRITICAL' as const },
  
  // Suspicious URLs
  { pattern: /(https?:\/\/)?[a-z0-9\-\.]+\.(tk|ml|ga|cf|bit\.ly|tinyurl)/gi, severity: 'HIGH' as const },
  { pattern: /\b(exe|scr|bat|com|pif|vbs|jar)\b/gi, severity: 'MEDIUM' as const },
];

// Inappropriate content patterns (Norwegian context)
const INAPPROPRIATE_PATTERNS = [
  // Sexual content
  { pattern: /\b(sex|porno|naken|blottlegging|onani)\b/gi, severity: 'HIGH' as const },
  { pattern: /\b(eskorte|prostitu|massasje.*spesiell)\b/gi, severity: 'HIGH' as const },
  
  // Violence and threats
  { pattern: /\b(drep|mord|vold|slå\s*i\s*hjel)\b/gi, severity: 'HIGH' as const },
  { pattern: /\b(bombing|angrep|terror)\b/gi, severity: 'CRITICAL' as const },
  
  // Drugs and illegal substances
  { pattern: /\b(hasj|kokain|heroin|ecstasy|mdma|amfetamin)\b/gi, severity: 'HIGH' as const },
  { pattern: /\b(selge?\s*stoff|kjøpe?\s*dop)\b/gi, severity: 'HIGH' as const },
  
  // Excessive profanity (Norwegian)
  { pattern: /\b(faen|helvete|dritt|satan)\b/gi, severity: 'LOW' as const },
];

// Contact information patterns that might be suspicious
const CONTACT_INFO_PATTERNS = [
  // Phone numbers in descriptions (should use platform messaging)
  { pattern: /(\+47\s*)?[4-9]\d{7}|\d{3}\s*\d{2}\s*\d{3}/g, severity: 'MEDIUM' as const },
  
  // Email addresses in posts
  { pattern: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, severity: 'MEDIUM' as const },
  
  // Social media handles
  { pattern: /@[a-z0-9_]+|instagram\.com|facebook\.com|snapchat/gi, severity: 'LOW' as const },
  
  // External messaging platforms
  { pattern: /\b(whatsapp|telegram|signal|discord|skype)\b/gi, severity: 'MEDIUM' as const },
];

// Pricing scam patterns
const PRICING_SCAM_PATTERNS = [
  // Unrealistic pricing
  { pattern: /\b(gratis|0\s*kr|ingen\s*kostnad)\b/gi, severity: 'HIGH' as const },
  { pattern: /\b(\d+)\s*kr.*time.*(\1).*garantert/gi, severity: 'MEDIUM' as const },
  
  // Pay-later schemes
  { pattern: /\b(betal\s*etter|penger\s*tilbake|ingen\s*risiko)\b/gi, severity: 'MEDIUM' as const },
  { pattern: /\b(først\s*gratis|prøv\s*gratis)\b/gi, severity: 'LOW' as const },
];

/**
 * Main content filtering function
 */
export function filterContent(content: string, contentType: 'title' | 'description' | 'location' = 'description'): ContentModerationResult {
  const flags: ContentFlag[] = [];
  let confidence = 1.0;
  
  // Check for malicious content (highest priority)
  const maliciousFlags = checkPatterns(content, MALICIOUS_PATTERNS, 'MALICIOUS');
  flags.push(...maliciousFlags);
  
  // Check for spam patterns
  const spamFlags = checkPatterns(content, NORWEGIAN_SPAM_PATTERNS, 'SPAM');
  flags.push(...spamFlags);
  
  // Check for inappropriate content
  const inappropriateFlags = checkPatterns(content, INAPPROPRIATE_PATTERNS, 'INAPPROPRIATE');
  flags.push(...inappropriateFlags);
  
  // Check for suspicious contact information
  const contactFlags = checkPatterns(content, CONTACT_INFO_PATTERNS, 'CONTACT_INFO');
  flags.push(...contactFlags);
  
  // Check for pricing scams
  const pricingFlags = checkPatterns(content, PRICING_SCAM_PATTERNS, 'PRICING_SCAM');
  flags.push(...pricingFlags);
  
  // Additional checks based on content type
  if (contentType === 'description') {
    const suspiciousFlags = checkSuspiciousPatterns(content);
    flags.push(...suspiciousFlags);
  }
  
  // Calculate overall confidence and decision
  const criticalFlags = flags.filter(f => f.severity === 'CRITICAL');
  const highFlags = flags.filter(f => f.severity === 'HIGH');
  const mediumFlags = flags.filter(f => f.severity === 'MEDIUM');
  
  // Determine if content should be allowed
  let allowed = true;
  let reason = '';
  
  if (criticalFlags.length > 0) {
    allowed = false;
    confidence = 0.1;
    reason = 'Critical security threat detected';
  } else if (highFlags.length >= 2) {
    allowed = false;
    confidence = 0.2;
    reason = 'Multiple high-severity issues detected';
  } else if (highFlags.length >= 1 && mediumFlags.length >= 2) {
    allowed = false;
    confidence = 0.3;
    reason = 'High-severity issue with additional concerns';
  } else if (mediumFlags.length >= 3) {
    allowed = false;
    confidence = 0.4;
    reason = 'Multiple moderate concerns';
  } else {
    confidence = Math.max(0.5, 1.0 - (highFlags.length * 0.3 + mediumFlags.length * 0.1));
  }
  
  const sanitizedContent = allowed ? sanitizeContent(content) : undefined;
  
  return {
    allowed,
    confidence,
    flags,
    sanitizedContent,
    reason: allowed ? undefined : reason
  };
}

/**
 * Check content against pattern arrays
 */
function checkPatterns(content: string, patterns: Array<{ pattern: RegExp; severity: ContentFlag['severity'] }>, type: ContentFlag['type']): ContentFlag[] {
  const flags: ContentFlag[] = [];
  
  for (const { pattern, severity } of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      flags.push({
        type,
        severity,
        description: `Detected ${type.toLowerCase()} pattern: ${matches[0]}`,
        pattern: pattern.source
      });
    }
  }
  
  return flags;
}

/**
 * Check for suspicious patterns specific to tutoring context
 */
function checkSuspiciousPatterns(content: string): ContentFlag[] {
  const flags: ContentFlag[] = [];
  
  // Check for excessive capitalization
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.3 && content.length > 50) {
    flags.push({
      type: 'SUSPICIOUS',
      severity: 'MEDIUM',
      description: 'Excessive capitalization detected'
    });
  }
  
  // Check for excessive punctuation
  const exclamationCount = (content.match(/!/g) || []).length;
  if (exclamationCount > 5) {
    flags.push({
      type: 'SUSPICIOUS',
      severity: 'LOW',
      description: 'Excessive punctuation detected'
    });
  }
  
  // Check for repetitive words
  const words = content.toLowerCase().split(/\s+/);
  const wordCounts = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const maxRepeats = Math.max(...Object.values(wordCounts));
  if (maxRepeats > 5 && words.length > 20) {
    flags.push({
      type: 'SUSPICIOUS',
      severity: 'MEDIUM',
      description: 'Repetitive content detected'
    });
  }
  
  // Check for lack of educational content in long descriptions
  if (content.length > 200) {
    const educationalKeywords = [
      'læring', 'undervisning', 'hjelp', 'utdanning', 'skole', 'kurs', 'erfaring',
      'learning', 'teaching', 'help', 'education', 'school', 'course', 'experience',
      'matematikk', 'norsk', 'engelsk', 'fysikk', 'kjemi', 'biologi'
    ];
    
    const hasEducationalContent = educationalKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
    
    if (!hasEducationalContent) {
      flags.push({
        type: 'SUSPICIOUS',
        severity: 'MEDIUM',
        description: 'Long description lacks educational content'
      });
    }
  }
  
  return flags;
}

/**
 * Sanitize content by removing or replacing problematic elements
 */
function sanitizeContent(content: string): string {
  let sanitized = content;
  
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove potential script injections
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  sanitized = sanitized.replace(/vbscript\s*:/gi, '');
  
  // Clean up excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // Remove excessive punctuation
  sanitized = sanitized.replace(/[!]{3,}/g, '!!');
  sanitized = sanitized.replace(/[?]{3,}/g, '??');
  sanitized = sanitized.replace(/[.]{4,}/g, '...');
  
  return sanitized;
}

/**
 * Check if content is likely spam based on multiple factors
 */
export function isSpamContent(content: string): { isSpam: boolean; score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 0;
  
  // Check spam patterns
  const spamMatches = NORWEGIAN_SPAM_PATTERNS.filter(p => p.pattern.test(content));
  if (spamMatches.length > 0) {
    score += spamMatches.length * 20;
    factors.push(`${spamMatches.length} spam patterns detected`);
  }
  
  // Check for excessive punctuation
  const exclamationCount = (content.match(/!/g) || []).length;
  if (exclamationCount > 3) {
    score += (exclamationCount - 3) * 5;
    factors.push('Excessive exclamation marks');
  }
  
  // Check for all caps
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.4) {
    score += 15;
    factors.push('Excessive capitalization');
  }
  
  // Check for urgency words
  const urgencyWords = ['nå', 'i dag', 'øyeblikkelig', 'umiddelbart', 'handle nå'];
  const urgencyCount = urgencyWords.filter(word => content.toLowerCase().includes(word)).length;
  if (urgencyCount > 1) {
    score += urgencyCount * 10;
    factors.push('Multiple urgency words');
  }
  
  // Check for contact information in content
  const hasPhone = /(\+47\s*)?[4-9]\d{7}/.test(content);
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(content);
  if (hasPhone && hasEmail) {
    score += 20;
    factors.push('Contains both phone and email');
  }
  
  return {
    isSpam: score >= 40,
    score,
    factors
  };
}

/**
 * Advanced content analysis for Norwegian tutoring context
 */
export function analyzeNorwegianTutoringContent(content: string): {
  isLegitimate: boolean;
  educationalValue: number;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let educationalValue = 0;
  
  // Check for educational keywords
  const educationalKeywords = [
    'matematikk', 'fysikk', 'kjemi', 'biologi', 'norsk', 'engelsk', 'historie',
    'geografi', 'samfunnsfag', 'religion', 'kunst', 'musikk', 'kroppsøving',
    'læring', 'undervisning', 'hjelp', 'veiledning', 'kurs', 'eksamen', 'prøve'
  ];
  
  const presentKeywords = educationalKeywords.filter(keyword => 
    content.toLowerCase().includes(keyword)
  );
  educationalValue = (presentKeywords.length / educationalKeywords.length) * 100;
  
  // Check content structure
  if (content.length < 50) {
    issues.push('Description is too short to be informative');
    suggestions.push('Add more details about your teaching approach and experience');
  }
  
  if (!content.includes('.') && !content.includes('!') && !content.includes('?')) {
    issues.push('Content lacks proper punctuation and structure');
    suggestions.push('Use proper punctuation to make your content more readable');
  }
  
  // Check for teaching methodology mentions
  const methodologies = ['praktisk', 'teoretisk', 'visuell', 'auditiv', 'gruppearbeid', 'individuell'];
  const mentionedMethodologies = methodologies.filter(method => 
    content.toLowerCase().includes(method)
  );
  
  if (mentionedMethodologies.length === 0) {
    suggestions.push('Consider mentioning your teaching methodology or approach');
  }
  
  // Check for experience mentions
  const experienceKeywords = ['erfaring', 'år', 'undervist', 'utdanning', 'kvalifikasjon'];
  const hasExperience = experienceKeywords.some(keyword => 
    content.toLowerCase().includes(keyword)
  );
  
  if (!hasExperience) {
    suggestions.push('Consider mentioning your relevant experience or qualifications');
  }
  
  const isLegitimate = issues.length === 0 && educationalValue > 20;
  
  return {
    isLegitimate,
    educationalValue,
    issues,
    suggestions
  };
}

/**
 * Generate content safety report
 */
export function generateContentSafetyReport(content: string, contentType: 'title' | 'description' | 'location' = 'description'): {
  safe: boolean;
  score: number;
  recommendations: string[];
  warnings: string[];
} {
  const moderationResult = filterContent(content, contentType);
  const spamResult = isSpamContent(content);
  const norwegianAnalysis = analyzeNorwegianTutoringContent(content);
  
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Collect warnings from moderation flags
  moderationResult.flags.forEach(flag => {
    if (flag.severity === 'CRITICAL' || flag.severity === 'HIGH') {
      warnings.push(flag.description);
    }
  });
  
  // Add spam warnings
  if (spamResult.isSpam) {
    warnings.push(`Content appears to be spam (score: ${spamResult.score})`);
  }
  
  // Add educational recommendations
  recommendations.push(...norwegianAnalysis.suggestions);
  
  // Calculate overall safety score
  let score = 100;
  score -= moderationResult.flags.length * 10;
  score -= spamResult.isSpam ? 30 : 0;
  score -= norwegianAnalysis.issues.length * 5;
  score = Math.max(0, score);
  
  return {
    safe: moderationResult.allowed && !spamResult.isSpam && norwegianAnalysis.isLegitimate,
    score,
    recommendations,
    warnings
  };
}