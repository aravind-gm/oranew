import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
/**
 * Upload multiple images to Supabase Storage
 * @route POST /api/upload/images
 * @access Private (Admin/Staff)
 */
export declare const uploadImages: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Delete an image from Supabase Storage
 * @route DELETE /api/upload/images
 * @access Private (Admin/Staff)
 */
export declare const deleteImage: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=upload.controller.d.ts.map