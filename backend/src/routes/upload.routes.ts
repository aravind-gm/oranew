import { Router } from 'express';
import multer from 'multer';
import { deleteImage, uploadImages, uploadVideo } from '../controllers/upload.controller';
import { authorize, protect } from '../middleware/auth';

const router = Router();

// Configure multer for memory storage (files stored in buffer for upload to Supabase)
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max (increased for flexibility)
    files: 10, // Max 10 files at once
  },
  fileFilter: (_req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max for product videos
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (['video/mp4', 'video/webm', 'video/quicktime'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP4, WebM, and MOV videos are allowed'));
    }
  },
});

// Upload multiple images (admin only)
router.post(
  '/images',
  protect,
  authorize('ADMIN', 'STAFF'),
  imageUpload.array('images', 10),
  uploadImages
);

// Upload single product video (admin only)
router.post(
  '/videos',
  protect,
  authorize('ADMIN', 'STAFF'),
  videoUpload.single('video'),
  uploadVideo
);

// Delete an image (admin only)
router.delete(
  '/images',
  protect,
  authorize('ADMIN', 'STAFF'),
  deleteImage
);

export default router;
