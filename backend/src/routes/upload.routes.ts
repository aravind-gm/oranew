import { Router } from 'express';
import multer from 'multer';
import { deleteImage, uploadImages } from '../controllers/upload.controller';
import { authorize, protect } from '../middleware/auth';

const router = Router();

// Configure multer for memory storage (files stored in buffer for upload to Supabase)
const upload = multer({
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

// Upload multiple images (admin only)
router.post(
  '/images',
  protect,
  authorize('ADMIN', 'STAFF'),
  upload.array('images', 10),
  uploadImages
);

// Delete an image (admin only)
router.delete(
  '/images',
  protect,
  authorize('ADMIN', 'STAFF'),
  deleteImage
);

export default router;
