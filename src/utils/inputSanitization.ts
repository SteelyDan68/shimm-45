/**
 * Input sanitization utilities for preventing XSS attacks
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
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requires: min 8 chars, uppercase, lowercase, number, symbol
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} {
  const errors: string[] = [];
  let score = 0;
  
  // Length requirements (more stringent)
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  } else {
    score += 1;
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
  
  // Additional security checks
  if (password.length > 16) {
    score += 1;
  }
  
  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters');
    score -= 1;
  }
  
  if (/123|abc|qwe|password|admin/i.test(password)) {
    errors.push('Password should not contain common patterns');
    score -= 1;
  }
  
  return {
    isValid: errors.length === 0 && score >= 4,
    errors,
    score: Math.max(0, Math.min(5, score))
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
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rate limiting utility for form submissions
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];
    
    // Remove attempts outside the window
    const validAttempts = userAttempts.filter(attempt => now - attempt < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Record this attempt
    validAttempts.push(now);
    this.attempts.set(identifier, validAttempts);
    
    return true;
  }

  getRemainingTime(identifier: string): number {
    const userAttempts = this.attempts.get(identifier) || [];
    if (userAttempts.length < this.maxAttempts) return 0;
    
    const oldestAttempt = Math.min(...userAttempts);
    const remainingTime = this.windowMs - (Date.now() - oldestAttempt);
    
    return Math.max(0, remainingTime);
  }
}

/**
 * Sanitize message content for safe display
 */
export function sanitizeMessageContent(content: string): string {
  if (!content || typeof content !== 'string') return '';
  
  // First sanitize basic HTML
  let sanitized = sanitizeText(content);
  
  // Limit message length
  if (sanitized.length > 5000) {
    sanitized = sanitized.substring(0, 5000) + '...';
  }
  
  // Remove excessive whitespace but preserve line breaks
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  sanitized = sanitized.replace(/[ \t]{2,}/g, ' ');
  
  return sanitized.trim();
}

/**
 * Validate and sanitize user profile inputs
 */
export function validateProfileInput(field: string, value: string): { isValid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeDbInput(value);
  
  switch (field) {
    case 'firstName':
    case 'lastName':
      if (sanitized.length > 50) {
        return { isValid: false, error: 'Name must be less than 50 characters', sanitized };
      }
      if (!/^[a-zA-ZÀ-ÿ\s-']*$/.test(sanitized)) {
        return { isValid: false, error: 'Name contains invalid characters', sanitized };
      }
      break;
      
    case 'email':
      if (!validateEmail(sanitized)) {
        return { isValid: false, error: 'Invalid email format', sanitized };
      }
      break;
      
    case 'bio':
      if (sanitized.length > 1000) {
        return { isValid: false, error: 'Bio must be less than 1000 characters', sanitized };
      }
      break;
  }
  
  return { isValid: true, sanitized };
}