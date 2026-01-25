import { NextFunction, Response } from 'express';
import {
    deleteFromStorage,
    isStorageConfigured,
    uploadToStorage,
} from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

/**
 * Upload multiple images to Supabase Storage
 * @route POST /api/upload/images
 * @access Private (Admin/Staff)
 */
export const uploadImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 🔐 Verify admin authentication
    if (!req.user) {
      console.error('[Upload Controller] ❌ NO USER IN REQUEST', {
        endpoint: '/upload/images',
        method: 'POST',
      });
      throw new AppError('Not authenticated', 401);
    }

    console.log('[Upload Controller] 📸 Starting image upload...', {
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
    });

    // Check if Supabase storage is configured
    if (!isStorageConfigured()) {
      console.error('[Upload Controller] ❌ STORAGE NOT CONFIGURED', {
        userId: req.user.id,
      });
      throw new AppError(
        'Storage not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment variables.',
        500
      );
    }

    const files = (req.files as any[]) || [];

    if (!files || files.length === 0) {
      console.warn('[Upload Controller] ⚠️ NO FILES UPLOADED', {
        userId: req.user.id,
      });
      throw new AppError('No files uploaded', 400);
    }

    console.log('[Upload Controller] ✅ Files received:', {
      fileCount: files.length,
      files: files.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype })),
    });

    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    // Upload each file
    for (const file of files) {
      try {
        const url = await uploadToStorage(
          file.buffer,
          file.originalname,
          file.mimetype
        );
        uploadedUrls.push(url);
        console.log('[Upload Controller] ✅ File uploaded successfully:', {
          originalFileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedUrl: url,  // Full URL for debugging
        });
      } catch (error: any) {
        const errorMsg = `Failed to upload ${file.originalname}: ${error.message}`;
        errors.push(errorMsg);
        console.error('[Upload Controller] ❌ File upload failed:', {
          fileName: file.originalname,
          error: error.message,
        });
      }
    }

    // If all uploads failed, throw error
    if (uploadedUrls.length === 0 && errors.length > 0) {
      console.error('[Upload Controller] ❌ ALL UPLOADS FAILED', {
        errors,
        userId: req.user.id,
      });
      throw new AppError(`All uploads failed: ${errors.join(', ')}`, 500);
    }

    console.log('[Upload Controller] ✅ IMAGE UPLOAD COMPLETE', {
      uploadedCount: uploadedUrls.length,
      failedCount: errors.length,
      uploadedUrls: uploadedUrls,  // Log all URLs for verification
      userId: req.user.id,
      userEmail: req.user.email,
    });

    res.json({
      success: true,
      data: {
        urls: uploadedUrls,
        errors: errors.length > 0 ? errors : undefined,
      },
      message:
        errors.length > 0
          ? `Uploaded ${uploadedUrls.length} files, ${errors.length} failed`
          : `Successfully uploaded ${uploadedUrls.length} files`,
    });
  } catch (error) {
    console.error('[Upload Controller] 🔴 UPLOAD REQUEST FAILED', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.id,
    });
    next(error);
  }
};

/**
 * Delete an image from Supabase Storage
 * @route DELETE /api/upload/images
 * @access Private (Admin/Staff)
 */
export const deleteImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { url } = req.body;

    if (!url) {
      throw new AppError('Image URL is required', 400);
    }

    if (!isStorageConfigured()) {
      throw new AppError(
        'Storage not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment variables.',
        500
      );
    }

    await deleteFromStorage(url);

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
