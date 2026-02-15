"use strict";
/**
 * Image Upload Security Validation
 * Prevents malicious file uploads and executable code injection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateImageUpload = void 0;
const errorHandler_1 = require("./errorHandler");
// Allowed MIME types for image uploads
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
];
// Maximum file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;
/**
 * Validates uploaded images for security
 * - Checks MIME type against whitelist
 * - Enforces file size limit
 * - Rejects dangerous file types (SVG, PDF, executables)
 */
const validateImageUpload = (req, res, next) => {
    try {
        const files = req.files || [];
        const singleFile = req.file;
        const filesToValidate = files.length > 0 ? files : singleFile ? [singleFile] : [];
        if (filesToValidate.length === 0) {
            return next();
        }
        for (const file of filesToValidate) {
            // 1. Check MIME type
            if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                throw new errorHandler_1.AppError(`Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`, 400);
            }
            // 2. Check file size
            if (file.size > MAX_FILE_SIZE) {
                throw new errorHandler_1.AppError(`File size exceeds 2MB limit. Got: ${(file.size / 1024 / 1024).toFixed(2)}MB`, 400);
            }
            // 3. Additional safety: check file extension
            const ext = file.originalname.split('.').pop()?.toLowerCase();
            if (!ext || !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
                throw new errorHandler_1.AppError(`Invalid file extension: .${ext}. Allowed: .jpg, .jpeg, .png, .webp`, 400);
            }
            // 4. Security: reject SVG (can contain embedded scripts)
            if (file.mimetype.includes('svg') || ext === 'svg') {
                throw new errorHandler_1.AppError('SVG files are not allowed for security reasons', 400);
            }
        }
        console.log('[Image Validation] ✅ Validated', {
            count: filesToValidate.length,
            sizes: filesToValidate.map(f => `${(f.size / 1024).toFixed(0)}KB`),
            types: [...new Set(filesToValidate.map(f => f.mimetype))],
        });
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateImageUpload = validateImageUpload;
//# sourceMappingURL=imageValidation.js.map