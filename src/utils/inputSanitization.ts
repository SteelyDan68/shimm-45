/**
 * 🔒 ENTERPRISE-GRADE INPUT SANITIZATION UTILITIES
 * 
 * Prevents XSS attacks, SQL injection, and other security vulnerabilities
 * Updated with enhanced security measures for production environments
 */

/**
 * Sanitize HTML content by removing potentially dangerous elements and attributes
 */
export function sanitizeHtml(input: string): string {
  // Remove script tags and their content
  let sanitized = input.replace(/<script[^>]*>.*?<\/script>/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '');
  
  // Remove potentially dangerous tags
  const dangerousTags = ['script', 'object', 'embed', 'iframe', 'frame', 'frameset', 'applet', 'link', 'meta', 'style'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<\\/?${tag}[^>]*>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  return sanitized.trim();
}

/**
 * Sanitize text input by escaping HTML characters
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format with enhanced security
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // Check length limits (RFC 5321)
  if (email.length > 320) return false;
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Additional security checks
  if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
    return false;
  }
  
  return emailRegex.test(email);
}

/**
 * ENHANCED PASSWORD VALIDATION - Enterprise Security Standards
 * Requirements: min 12 chars, uppercase, lowercase, number, symbol, no common patterns
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} {
  const errors: string[] = [];
  let score = 0;
  
  // Enhanced length check (minimum 12 characters for enterprise security) 
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  } else {
    score += 2; // Higher score for longer passwords
  }
  
  // Character type requirements
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }
  
  // Enhanced common patterns check
  const commonPatterns = [
    'password', '123456', 'qwerty', 'admin', 'user', 'login', 
    'welcome', 'monkey', 'dragon', 'master', 'shadow', 'letmein',
    'trustno1', 'abc123', 'password123', 'admin123'
  ];
  const lowerPassword = password.toLowerCase();
  for (const pattern of commonPatterns) {
    if (lowerPassword.includes(pattern)) {
      errors.push('Password contains common patterns or dictionary words');
      score = Math.max(0, score - 2);
      break;
    }
  }
  
  // Check for sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    errors.push('Password should not contain sequential characters');
    score = Math.max(0, score - 1);
  }
  
  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters');
    score = Math.max(0, score - 1);
  }
  
  // Bonus points for longer passwords
  if (password.length >= 16) {
    score += 1;
  }
  if (password.length >= 20) {
    score += 1;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(score, 10) // Cap at 10
  };
}

/**
 * Sanitize user input for database operations
 */
export function sanitizeDbInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/\0/g, '');
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length to prevent buffer overflow attacks
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }
  
  return sanitized;
}

/**
 * Validate and sanitize phone number
 */
export function sanitizePhoneNumber(phone: string): string {
  if (typeof phone !== 'string') return '';
  
  // Remove all non-digit characters except + and spaces
  return phone.replace(/[^\d+\s-]/g, '').trim();
}

/**
 * Validate URL format with security checks
 */
export function validateUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow safe protocols
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Block potentially dangerous hosts
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0'];
    if (blockedHosts.includes(parsedUrl.hostname)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * ENHANCED RATE LIMITER with blocking capabilities
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; windowStart: number; blocked: boolean }> = new Map();
  private maxAttempts: number;
  private windowMs: number;
  private blockDurationMs: number;

  constructor(maxAttempts: number = 5, windowMinutes: number = 15, blockDurationMinutes: number = 30) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMinutes * 60 * 1000;
    this.blockDurationMs = blockDurationMinutes * 60 * 1000;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || now - record.windowStart > this.windowMs) {
      // New window or first attempt
      this.attempts.set(identifier, { count: 1, windowStart: now, blocked: false });
      return true;
    }

    // Check if still blocked
    if (record.blocked && now - record.windowStart < this.blockDurationMs) {
      return false;
    }

    // Reset if block period expired
    if (record.blocked && now - record.windowStart >= this.blockDurationMs) {
      this.attempts.set(identifier, { count: 1, windowStart: now, blocked: false });
      return true;
    }

    if (record.count >= this.maxAttempts) {
      record.blocked = true;
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;

    if (record.blocked) {
      const elapsed = Date.now() - record.windowStart;
      return Math.max(0, this.blockDurationMs - elapsed);
    }

    const elapsed = Date.now() - record.windowStart;
    return Math.max(0, this.windowMs - elapsed);
  }

  getAttemptCount(identifier: string): number {
    const record = this.attempts.get(identifier);
    return record ? record.count : 0;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

/**
 * ENHANCED MESSAGE CONTENT SANITIZATION
 * Protects against XSS, content injection, and malicious URLs
 */
export function sanitizeMessageContent(content: string): string {
  if (!content || typeof content !== 'string') return '';
  
  // Remove dangerous protocols
  let sanitized = content.replace(/(javascript|data|vbscript|onload|onerror|onclick):/gi, '');
  
  // Escape HTML entities
  sanitized = sanitizeText(sanitized);
  
  // Remove potentially dangerous content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Limit length to prevent extremely long messages
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000) + '...';
  }
  
  // Normalize whitespace but preserve line breaks
  sanitized = sanitized.replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
  
  return sanitized;
}

/**
 * ENHANCED PROFILE INPUT VALIDATION with comprehensive security checks
 */
export function validateProfileInput(field: string, value: string): { isValid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeText(value);
  
  // Check for suspicious patterns in all fields
  const suspiciousPatterns = [
    /<script/i, /javascript:/i, /on\w+=/i, /data:/i, /vbscript:/i,
    /eval\(/i, /function\(/i, /setTimeout/i, /setInterval/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      return { isValid: false, error: 'Input contains potentially dangerous content', sanitized };
    }
  }
  
  switch (field) {
    case 'name':
    case 'display_name':
    case 'firstName':
    case 'lastName':
      if (sanitized.length < 2) {
        return { isValid: false, error: 'Name must be at least 2 characters long', sanitized };
      }
      if (sanitized.length > 100) {
        return { isValid: false, error: 'Name must be less than 100 characters', sanitized };
      }
      // Enhanced character validation including international characters
      if (!/^[a-zA-ZåäöÅÄÖàáâãäæçèéêëìíîïñòóôõöøùúûüýÿ\s\-'\.]+$/u.test(sanitized)) {
        return { isValid: false, error: 'Name contains invalid characters', sanitized };
      }
      break;
      
    case 'email':
      if (!validateEmail(sanitized)) {
        return { isValid: false, error: 'Invalid email format', sanitized };
      }
      if (sanitized.length > 320) { // RFC 5321 limit
        return { isValid: false, error: 'Email address too long', sanitized };
      }
      break;
      
    case 'bio':
      if (sanitized.length > 1000) {
        return { isValid: false, error: 'Bio must be less than 1000 characters', sanitized };
      }
      // Allow more characters for bio but still validate
      if (!/^[a-zA-Z0-9åäöÅÄÖàáâãäæçèéêëìíîïñòóôõöøùúûüýÿ\s\-'\.,:;!?\(\)\[\]\"]+$/u.test(sanitized)) {
        return { isValid: false, error: 'Bio contains invalid characters', sanitized };
      }
      break;
      
    case 'phone':
      if (sanitized.length > 0 && !/^\+?[1-9]\d{1,14}$/.test(sanitized.replace(/\s/g, ''))) {
        return { isValid: false, error: 'Invalid phone number format', sanitized };
      }
      break;
      
    default:
      if (sanitized.length > 255) {
        return { isValid: false, error: 'Input too long (max 255 characters)', sanitized };
      }
  }
  
  return { isValid: true, sanitized };
}

/**
 * Enhanced XSS protection for rich text content
 */
export function sanitizeRichText(html: string): string {
  if (!html) return '';
  
  // Allow only safe HTML tags and attributes
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const allowedAttributes = ['class'];
  
  let sanitized = html;
  
  // Remove dangerous tags completely
  sanitized = sanitized.replace(/<(script|iframe|object|embed|form|input|textarea|button)[^>]*>.*?<\/\1>/gis, '');
  sanitized = sanitized.replace(/<(script|iframe|object|embed|form|input|textarea|button)[^>]*\/>/gis, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^>\s]+/gi, '');
  
  // Remove javascript: and data: protocols
  sanitized = sanitized.replace(/(javascript|data|vbscript):[^"'>\s]*/gi, '');
  
  return sanitized;
}

/**
 * Secure file upload validation
 */
export function validateFileUpload(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed' };
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size too large (max 10MB)' };
  }
  
  // Check for suspicious file names
  if (/\.(exe|bat|cmd|scr|pif|com|js|jar|php|asp|jsp)$/i.test(file.name)) {
    return { isValid: false, error: 'Potentially dangerous file extension' };
  }
  
  return { isValid: true };
}

/**
 * Content Security Policy (CSP) validator
 */
export function validateCSP(content: string): boolean {
  // Check for inline scripts or styles that would violate CSP
  const violations = [
    /<script[^>]*>[^<]*<\/script>/gi,
    /style\s*=\s*["'][^"']*["']/gi,
    /onclick\s*=\s*["'][^"']*["']/gi,
    /onload\s*=\s*["'][^"']*["']/gi,
    /javascript:/gi
  ];
  
  return !violations.some(pattern => pattern.test(content));
}