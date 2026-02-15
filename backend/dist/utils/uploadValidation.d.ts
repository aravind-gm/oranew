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
export declare const validateImageUpload: (file: Express.Multer.File, userId?: string, ip?: string) => UploadValidationResult;
/**
 * Validate multiple files
 * @param files - Array of Multer files
 * @param userId - User uploading files
 * @param ip - Request IP
 * @returns Validation results for all files
 */
export declare const validateMultipleImageUploads: (files: Express.Multer.File[], userId?: string, ip?: string) => {
    valid: boolean;
    errors: string[];
    failedFiles: string[];
};
//# sourceMappingURL=uploadValidation.d.ts.map