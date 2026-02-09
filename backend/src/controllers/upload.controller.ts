import { NextFunction, Response } from 'express';
import {
    deleteFromStorage,
    isStorageConfigured,
    uploadToStorage,
} from '../config/supabase';
import { isR2Configured, uploadToR2, generateProductImagePath, getCdnUrl, deleteFromR2 } from '../config/r2';
import { generateProductVariants } from '../services/image.service';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

/**
 * Upload multiple images to Cloudflare R2 (or fallback to Supabase Storage)
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

    // Check if R2 is configured (preferred), otherwise fallback to Supabase
    const useR2 = isR2Configured();
    const useSupabase = !useR2 && isStorageConfigured();

    if (!useR2 && !useSupabase) {
      console.error('[Upload Controller] ❌ NO STORAGE CONFIGURED');
      throw new AppError(
        'Storage not configured. Please set R2 or Supabase environment variables.',
        500
      );
    }

    console.log('[Upload Controller] 📦 Storage backend:', useR2 ? 'Cloudflare R2' : 'Supabase Storage');

    const files = (req.files as any[]) || [];

    console.log('[Upload Controller] 📋 Request files check:', {
      filesReceived: !!req.files,
      filesArray: Array.isArray(req.files),
      fileCount: files.length,
      reqFilesCom: !!req.files,
      reqFilesType: typeof req.files,
      filesKeys: req.files ? Object.keys(req.files) : 'no files',
    });

    if (!files || files.length === 0) {
      console.warn('[Upload Controller] ⚠️ NO FILES UPLOADED', {
        userId: req.user.id,
        receivedFiles: req.files,
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
        let url: string;

        if (useR2) {
          // Generate unique ID for this image set
          const imageId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          
          console.log('[Upload Controller] 🔄 Processing image variants...', {
            imageId,
            fileName: file.originalname,
            fileSize: file.size,
          });

          // Generate all variants and upload
          let variants;
          try {
            variants = await generateProductVariants(file.buffer);
            console.log('[Upload Controller] ✅ Variants generated:', {
              imageId,
              variantCount: variants.length,
            });
          } catch (variantError: any) {
            console.error('[Upload Controller] ❌ Variant generation failed:', {
              fileName: file.originalname,
              error: variantError.message,
              stack: variantError.stack,
            });
            throw variantError;
          }
          
          // Upload each variant
          let uploadedVariants = 0;
          for (const variant of variants) {
            try {
              const path = generateProductImagePath(imageId, variant.role);
              console.log('[Upload Controller] 📤 Uploading variant...', {
                imageId,
                variant: variant.role,
                path,
                size: variant.size,
              });
              await uploadToR2(variant.buffer, path, 'image/webp');
              uploadedVariants++;
              console.log('[Upload Controller] ✅ Variant uploaded:', {
                imageId,
                variant: variant.role,
              });
            } catch (uploadError: any) {
              console.error('[Upload Controller] ❌ Variant upload failed:', {
                imageId,
                variant: variant.role,
                error: uploadError.message,
                stack: uploadError.stack,
              });
              throw uploadError;
            }
          }
          
          // Return the hero variant URL (main display image)
          url = getCdnUrl(generateProductImagePath(imageId, 'hero'));
          console.log('[Upload Controller] ✅ Image URL generated:', {
            imageId,
            url,
          });
        } else {
          // Fallback to Supabase Storage
          url = await uploadToStorage(
            file.buffer,
            file.originalname,
            file.mimetype
          );
        }

        uploadedUrls.push(url);
        console.log('[Upload Controller] ✅ File uploaded successfully:', {
          originalFileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedUrl: url,
          backend: useR2 ? 'R2' : 'Supabase',
        });
      } catch (error: any) {
        const errorMsg = `Failed to upload ${file.originalname}: ${error.message || String(error)}`;
        errors.push(errorMsg);
        console.error('[Upload Controller] ❌ File upload failed:', {
          fileName: file.originalname,
          error: error.message || String(error),
          stack: error.stack,
          errorType: error.constructor.name,
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
      uploadedUrls: uploadedUrls,
      userId: req.user.id,
      userEmail: req.user.email,
      backend: useR2 ? 'R2' : 'Supabase',
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
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.id,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    next(error);
  }
};

/**
 * Delete an image from storage (R2 or Supabase)
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

    const useR2 = isR2Configured();

    if (useR2) {
      // Extract path from CDN URL
      const cdnBaseUrl = process.env.R2_PUBLIC_BASE_URL || '';
      if (url.includes(cdnBaseUrl)) {
        const path = url.replace(cdnBaseUrl + '/', '');
        await deleteFromR2(path);
      } else {
        console.warn('[Upload Controller] URL does not match R2 CDN, skipping delete:', url);
      }
    } else if (isStorageConfigured()) {
      await deleteFromStorage(url);
    } else {
      throw new AppError('Storage not configured.', 500);
    }

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
