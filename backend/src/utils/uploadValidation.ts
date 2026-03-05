import { logUploadEvent, SecurityEventType } from './securityLogger';

/**
 * Image Upload Security Validation
 * SECURITY: Prevent malicious file uploads
 */

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// Blocked MIME types (explicit deny list)
const BLOCKED_MIME_TYPES = [
  'image/svg+xml',
  'application/pdf',
  'text/javascript',
  'text/html',
  'application/javascript',
  'application/x-sh',
  'application/x-executable',
];

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
  reason?: string;
}

/**
 * Validate uploaded file for security
 * @param file - Multer file object
 * @param userId - User uploading the file
 * @param ip - Request IP address
 * @returns Validation result
 */
export const validateImageUpload = (
  file: Express.Multer.File,
  userId?: string,
  ip?: string
): UploadValidationResult => {
  // Check file exists
  if (!file) {
    return {
      valid: false,
      error: 'No file provided',
      reason: 'MISSING_FILE',
    };
  }

  // Check MIME type is allowed
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    logUploadEvent(
      SecurityEventType.INVALID_FILE_TYPE,
      `Upload rejected: Invalid MIME type ${file.mimetype}`,
      userId,
      ip,
      { fileName: file.originalname, mimeType: file.mimetype }
    );

    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
      reason: 'INVALID_MIME_TYPE',
    };
  }

  // Check MIME type is not blocked
  if (BLOCKED_MIME_TYPES.includes(file.mimetype)) {
    logUploadEvent(
      SecurityEventType.MALICIOUS_UPLOAD_ATTEMPT,
      `Upload rejected: Blocked MIME type ${file.mimetype}`,
      userId,
      ip,
      { fileName: file.originalname, mimeType: file.mimetype }
    );

    return {
      valid: false,
      error: 'This file type is not allowed for security reasons.',
      reason: 'BLOCKED_MIME_TYPE',
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    logUploadEvent(
      SecurityEventType.FILE_SIZE_EXCEEDED,
      `Upload rejected: File size ${file.size} bytes exceeds limit`,
      userId,
      ip,
      { fileName: file.originalname, fileSize: file.size, maxSize: MAX_FILE_SIZE }
    );

    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      reason: 'FILE_TOO_LARGE',
    };
  }

  // Check file extension matches MIME type
  const extension = file.originalname.split('.').pop()?.toLowerCase();
  const expectedExtensions = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
  };

  const expected = expectedExtensions[file.mimetype as keyof typeof expectedExtensions];
  if (expected && !expected.includes(extension || '')) {
    logUploadEvent(
      SecurityEventType.MALICIOUS_UPLOAD_ATTEMPT,
      `Upload rejected: MIME type mismatch (${file.mimetype} vs .${extension})`,
      userId,
      ip,
      { fileName: file.originalname, mimeType: file.mimetype, extension }
    );

    return {
      valid: false,
      error: 'File extension does not match file type',
      reason: 'MIME_EXTENSION_MISMATCH',
    };
  }

  // Check filename for suspicious patterns
  const suspiciousPatterns = [
    /\.php$/i,
    /\.exe$/i,
    /\.sh$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.js$/i,
    /\.html$/i,
    /\.svg$/i,
    /<script>/i,
    /<\?php/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.originalname)) {
      logUploadEvent(
        SecurityEventType.MALICIOUS_UPLOAD_ATTEMPT,
        `Upload rejected: Suspicious filename pattern detected`,
        userId,
        ip,
        { fileName: file.originalname, pattern: pattern.toString() }
      );

      return {
        valid: false,
        error: 'Filename contains suspicious patterns',
        reason: 'SUSPICIOUS_FILENAME',
      };
    }
  }

  // All checks passed
  return { valid: true };
};

/**
 * Validate multiple files
 * @param files - Array of Multer files
 * @param userId - User uploading files
 * @param ip - Request IP
 * @returns Validation results for all files
 */
export const validateMultipleImageUploads = (
  files: Express.Multer.File[],
  userId?: string,
  ip?: string
): { valid: boolean; errors: string[]; failedFiles: string[] } => {
  const errors: string[] = [];
  const failedFiles: string[] = [];

  for (const file of files) {
    const result = validateImageUpload(file, userId, ip);
    if (!result.valid) {
      errors.push(result.error || 'Unknown error');
      failedFiles.push(file.originalname);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    failedFiles,
  };
};
