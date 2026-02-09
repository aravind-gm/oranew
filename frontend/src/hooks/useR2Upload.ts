/**
 * useR2Upload Hook
 * React hook for uploading images to Cloudflare R2
 * 
 * Features:
 * - Product image upload with variants
 * - Banner image upload
 * - Collection image upload
 * - Brand asset upload
 * - Progress tracking
 * - Error handling
 * 
 * @author ORA Engineering
 */

'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';

// ============================================
// TYPES
// ============================================

export interface UploadProgress {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  message?: string;
}

export interface ProductImageResult {
  role: string;
  url: string;
  width: number;
  height: number;
}

export interface UploadResult {
  success: boolean;
  urls?: string[];
  images?: ProductImageResult[];
  error?: string;
}

export interface BannerUploadResult {
  success: boolean;
  bannerId?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  error?: string;
}

// ============================================
// PRODUCT IMAGE UPLOAD HOOK
// ============================================

export function useProductImageUpload() {
  const [progress, setProgress] = useState<UploadProgress>({ status: 'idle', progress: 0 });

  const upload = useCallback(async (
    files: File[],
    productId: string
  ): Promise<UploadResult> => {
    setProgress({ status: 'uploading', progress: 0, message: 'Preparing upload...' });

    try {
      const formData = new FormData();
      formData.append('productId', productId);
      files.forEach((file) => {
        formData.append('images', file);
      });

      setProgress({ status: 'uploading', progress: 30, message: 'Uploading to CDN...' });

      // Use R2 endpoint (or fallback to legacy)
      const response = await api.post('/r2/product-images', formData);

      if (response.data.success) {
        setProgress({ status: 'success', progress: 100, message: 'Upload complete!' });
        return {
          success: true,
          urls: response.data.data.urls,
          images: response.data.data.images,
        };
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Upload failed';
      setProgress({ status: 'error', progress: 0, message: errorMsg });
      return { success: false, error: errorMsg };
    }
  }, []);

  const reset = useCallback(() => {
    setProgress({ status: 'idle', progress: 0 });
  }, []);

  return { upload, progress, reset };
}

// ============================================
// LEGACY IMAGE UPLOAD HOOK (Backwards Compatible)
// ============================================

export function useImageUpload() {
  const [progress, setProgress] = useState<UploadProgress>({ status: 'idle', progress: 0 });

  const upload = useCallback(async (files: File[]): Promise<UploadResult> => {
    setProgress({ status: 'uploading', progress: 0, message: 'Preparing upload...' });

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      setProgress({ status: 'uploading', progress: 30, message: 'Uploading...' });

      // Use legacy endpoint (now R2-backed)
      const response = await api.post('/upload/images', formData);

      if (response.data.success) {
        setProgress({ status: 'success', progress: 100, message: 'Upload complete!' });
        return {
          success: true,
          urls: response.data.data.urls,
        };
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Upload failed';
      setProgress({ status: 'error', progress: 0, message: errorMsg });
      return { success: false, error: errorMsg };
    }
  }, []);

  const reset = useCallback(() => {
    setProgress({ status: 'idle', progress: 0 });
  }, []);

  return { upload, progress, reset };
}

// ============================================
// BANNER UPLOAD HOOK
// ============================================

export function useBannerUpload() {
  const [progress, setProgress] = useState<UploadProgress>({ status: 'idle', progress: 0 });

  const upload = useCallback(async (
    file: File,
    options: {
      page: 'home' | 'collection' | 'checkout' | 'cart' | 'product';
      title?: string;
      ctaText?: string;
      ctaLink?: string;
      generateMobile?: boolean;
    }
  ): Promise<BannerUploadResult> => {
    setProgress({ status: 'uploading', progress: 0, message: 'Preparing banner...' });

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('page', options.page);
      if (options.title) formData.append('title', options.title);
      if (options.ctaText) formData.append('ctaText', options.ctaText);
      if (options.ctaLink) formData.append('ctaLink', options.ctaLink);
      if (options.generateMobile) formData.append('generateMobile', 'true');

      setProgress({ status: 'uploading', progress: 30, message: 'Uploading banner...' });

      const response = await api.post('/r2/banners', formData);

      if (response.data.success) {
        setProgress({ status: 'success', progress: 100, message: 'Banner uploaded!' });
        return {
          success: true,
          bannerId: response.data.data.bannerId,
          imageUrl: response.data.data.imageUrl,
          mobileImageUrl: response.data.data.mobileImageUrl,
        };
      } else {
        throw new Error(response.data.message || 'Banner upload failed');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Banner upload failed';
      setProgress({ status: 'error', progress: 0, message: errorMsg });
      return { success: false, error: errorMsg };
    }
  }, []);

  const updateBanner = useCallback(async (
    bannerId: string,
    file: File
  ): Promise<BannerUploadResult> => {
    setProgress({ status: 'uploading', progress: 0, message: 'Updating banner...' });

    try {
      const formData = new FormData();
      formData.append('image', file);

      setProgress({ status: 'uploading', progress: 30, message: 'Uploading new image...' });

      const response = await api.put(`/r2/banners/${bannerId}`, formData);

      if (response.data.success) {
        setProgress({ status: 'success', progress: 100, message: 'Banner updated!' });
        return {
          success: true,
          bannerId: response.data.data.bannerId,
          imageUrl: response.data.data.imageUrl,
        };
      } else {
        throw new Error(response.data.message || 'Banner update failed');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Banner update failed';
      setProgress({ status: 'error', progress: 0, message: errorMsg });
      return { success: false, error: errorMsg };
    }
  }, []);

  const toggleVisibility = useCallback(async (bannerId: string): Promise<boolean> => {
    try {
      const response = await api.patch(`/r2/banners/${bannerId}/toggle`);
      return response.data.data?.isActive ?? false;
    } catch {
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setProgress({ status: 'idle', progress: 0 });
  }, []);

  return { upload, updateBanner, toggleVisibility, progress, reset };
}

// ============================================
// COLLECTION IMAGE UPLOAD HOOK
// ============================================

export function useCollectionImageUpload() {
  const [progress, setProgress] = useState<UploadProgress>({ status: 'idle', progress: 0 });

  const upload = useCallback(async (
    file: File,
    collectionSlug: string,
    altText?: string
  ): Promise<UploadResult> => {
    setProgress({ status: 'uploading', progress: 0, message: 'Preparing collection image...' });

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('collectionSlug', collectionSlug);
      if (altText) formData.append('altText', altText);

      setProgress({ status: 'uploading', progress: 30, message: 'Uploading...' });

      const response = await api.post('/r2/collections', formData);

      if (response.data.success) {
        setProgress({ status: 'success', progress: 100, message: 'Collection image uploaded!' });
        return {
          success: true,
          urls: [response.data.data.heroUrl, response.data.data.thumbnailUrl].filter(Boolean),
        };
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Upload failed';
      setProgress({ status: 'error', progress: 0, message: errorMsg });
      return { success: false, error: errorMsg };
    }
  }, []);

  const reset = useCallback(() => {
    setProgress({ status: 'idle', progress: 0 });
  }, []);

  return { upload, progress, reset };
}

// ============================================
// BRAND ASSET UPLOAD HOOK
// ============================================

export function useBrandAssetUpload() {
  const [progress, setProgress] = useState<UploadProgress>({ status: 'idle', progress: 0 });

  const upload = useCallback(async (
    file: File,
    assetType: 'logo' | 'favicon' | 'og_image' | 'watermark',
    altText?: string
  ): Promise<UploadResult> => {
    setProgress({ status: 'uploading', progress: 0, message: `Uploading ${assetType}...` });

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('assetType', assetType);
      if (altText) formData.append('altText', altText);

      setProgress({ status: 'uploading', progress: 30, message: 'Processing...' });

      const response = await api.post('/r2/brand', formData);

      if (response.data.success) {
        setProgress({ status: 'success', progress: 100, message: `${assetType} uploaded!` });
        return {
          success: true,
          urls: [response.data.data.url],
        };
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Upload failed';
      setProgress({ status: 'error', progress: 0, message: errorMsg });
      return { success: false, error: errorMsg };
    }
  }, []);

  const reset = useCallback(() => {
    setProgress({ status: 'idle', progress: 0 });
  }, []);

  return { upload, progress, reset };
}

// ============================================
// DELETE IMAGE HOOK
// ============================================

export function useDeleteImage() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteImage = useCallback(async (imageId: string): Promise<boolean> => {
    setIsDeleting(true);
    try {
      const response = await api.delete(`/r2/product-images/${imageId}`);
      return response.data.success;
    } catch {
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const deleteByUrl = useCallback(async (url: string): Promise<boolean> => {
    setIsDeleting(true);
    try {
      const response = await api.delete('/r2/images', { data: { url } });
      return response.data.success;
    } catch {
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return { deleteImage, deleteByUrl, isDeleting };
}

// ============================================
// REORDER IMAGES HOOK
// ============================================

export function useReorderImages() {
  const [isReordering, setIsReordering] = useState(false);

  const reorder = useCallback(async (
    productId: string,
    imageOrder: string[]
  ): Promise<boolean> => {
    setIsReordering(true);
    try {
      const response = await api.put('/r2/product-images/reorder', {
        productId,
        imageOrder,
      });
      return response.data.success;
    } catch {
      return false;
    } finally {
      setIsReordering(false);
    }
  }, []);

  return { reorder, isReordering };
}
