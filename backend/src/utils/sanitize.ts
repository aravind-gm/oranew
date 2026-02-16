/**
 * XSS Sanitization Utility
 * 
 * Sanitizes user-generated content to prevent XSS attacks
 * Uses DOMPurify to strip all HTML tags and attributes
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize text input - removes ALL HTML tags and script content
 * Use for: reviews, comments, addresses, names
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';
  
  // Strip all HTML tags and attributes
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
  });
  
  return cleaned.trim();
}

/**
 * Sanitize rich text - allows limited safe HTML (bold, italic, links)
 * Use for: product descriptions (admin only)
 */
export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return '';
  
  // Allow only safe formatting tags
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [], // No attributes (prevents event handlers)
  });
  
  return cleaned.trim();
}

/**
 * Sanitize email - basic email format validation
 */
export function sanitizeEmail(input: string | null | undefined): string {
  if (!input) return '';
  
  const cleaned = input.toLowerCase().trim();
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) {
    throw new Error('Invalid email format');
  }
  
  return cleaned;
}

/**
 * Sanitize phone number - removes non-numeric characters
 */
export function sanitizePhone(input: string | null | undefined): string {
  if (!input) return '';
  
  // Remove all non-numeric characters except + (for country code)
  return input.replace(/[^\d+]/g, '');
}
