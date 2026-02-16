"use strict";
/**
 * XSS Sanitization Utility
 *
 * Sanitizes user-generated content to prevent XSS attacks
 * Uses DOMPurify to strip all HTML tags and attributes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeText = sanitizeText;
exports.sanitizeRichText = sanitizeRichText;
exports.sanitizeEmail = sanitizeEmail;
exports.sanitizePhone = sanitizePhone;
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
/**
 * Sanitize text input - removes ALL HTML tags and script content
 * Use for: reviews, comments, addresses, names
 */
function sanitizeText(input) {
    if (!input)
        return '';
    // Strip all HTML tags and attributes
    const cleaned = isomorphic_dompurify_1.default.sanitize(input, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: [], // No attributes allowed
    });
    return cleaned.trim();
}
/**
 * Sanitize rich text - allows limited safe HTML (bold, italic, links)
 * Use for: product descriptions (admin only)
 */
function sanitizeRichText(input) {
    if (!input)
        return '';
    // Allow only safe formatting tags
    const cleaned = isomorphic_dompurify_1.default.sanitize(input, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: [], // No attributes (prevents event handlers)
    });
    return cleaned.trim();
}
/**
 * Sanitize email - basic email format validation
 */
function sanitizeEmail(input) {
    if (!input)
        return '';
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
function sanitizePhone(input) {
    if (!input)
        return '';
    // Remove all non-numeric characters except + (for country code)
    return input.replace(/[^\d+]/g, '');
}
//# sourceMappingURL=sanitize.js.map