import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
/**
 * Upload multiple images to Cloudflare R2 (or fallback to Supabase Storage)
 * @route POST /api/upload/images
 * @access Private (Admin/Staff)
 */
export declare const uploadImages: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Upload single product video to Cloudflare R2 (or fallback to Supabase Storage)
 * @route POST /api/upload/videos
 * @access Private (Admin/Staff)
 */
export declare const uploadVideo: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Delete an image from storage (R2 or Supabase)
 * @route DELETE /api/upload/images
 * @access Private (Admin/Staff)
 */
export declare const deleteImage: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=upload.controller.d.ts.map