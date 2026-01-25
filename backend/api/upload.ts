// backend/api/upload.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  successResponse,
  errorResponse,
  methodNotAllowed,
  withErrorHandling,
} from '../lib/handlers';
import { requireAdmin } from '../lib/auth';
import { uploadToSupabase } from '../lib/supabase';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  // Verify admin
  const authHeader = req.headers.authorization;
  requireAdmin(authHeader);

  try {
    // For Vercel serverless, handle file upload from FormData sent by frontend
    // The body will be the raw file buffer
    const buffer = typeof req.body === 'string' 
      ? Buffer.from(req.body, 'binary')
      : req.body;

    if (!buffer || buffer.length === 0) {
      return errorResponse(res, 'No file provided', 400);
    }

    // Get filename from content-disposition header
    const contentDisposition = req.headers['content-disposition'] || '';
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch ? filenameMatch[1] : `upload-${Date.now()}`;

    // Get content type
    const contentType = req.headers['content-type'] as string || 'image/jpeg';

    // Upload to Supabase
    const publicUrl = await uploadToSupabase(
      'product-images',
      `products/${Date.now()}-${filename}`,
      buffer as Buffer,
      contentType
    );

    return successResponse(res, { url: publicUrl }, 201);
  } catch (error) {
    console.error('[Upload Error]', error);
    return errorResponse(res, 'Upload failed', 500);
  }
}

export default withErrorHandling(handler);
