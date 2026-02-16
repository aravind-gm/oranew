/**
 * XSS Sanitization Utility
 *
 * Sanitizes user-generated content to prevent XSS attacks
 * Uses DOMPurify to strip all HTML tags and attributes
 */
/**
 * Sanitize text input - removes ALL HTML tags and script content
 * Use for: reviews, comments, addresses, names
 */
export declare function sanitizeText(input: string | null | undefined): string;
/**
 * Sanitize rich text - allows limited safe HTML (bold, italic, links)
 * Use for: product descriptions (admin only)
 */
export declare function sanitizeRichText(input: string | null | undefined): string;
/**
 * Sanitize email - basic email format validation
 */
export declare function sanitizeEmail(input: string | null | undefined): string;
/**
 * Sanitize phone number - removes non-numeric characters
 */
export declare function sanitizePhone(input: string | null | undefined): string;
//# sourceMappingURL=sanitize.d.ts.map