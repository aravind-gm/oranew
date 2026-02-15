/**
 * Image Upload Security Validation
 * Prevents malicious file uploads and executable code injection
 */
import { NextFunction, Response } from 'express';
import { AuthRequest } from './auth';
/**
 * Validates uploaded images for security
 * - Checks MIME type against whitelist
 * - Enforces file size limit
 * - Rejects dangerous file types (SVG, PDF, executables)
 */
export declare const validateImageUpload: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=imageValidation.d.ts.map