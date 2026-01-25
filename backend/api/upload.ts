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
import multipart from 'parse-multipart';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  // Verify admin
  const authHeader = req.headers.authorization;
  requireAdmin(authHeader);

  try {
    // Parse multipart form data
    const boundary = (req.headers['content-type'] || '').split('boundary=')[1];

    if (!boundary) {
      return errorResponse(res, 'No file provided', 400);
    }

    const parts = multipart.parse(Buffer.from(req.body), boundary);

    if (!parts || parts.length === 0) {
      return errorResponse(res, 'No file provided', 400);
    }

    const file = parts[0];
    const filename = `products/${Date.now()}-${file.filename}`;

    // Upload to Supabase
    const publicUrl = await uploadToSupabase(
      'product-images',
      filename,
      file.data,
      file.type
    );

    return successResponse(res, { url: publicUrl }, 201);
  } catch (error) {
    console.error('[Upload Error]', error);
    return errorResponse(res, 'Upload failed', 500);
  }
}

export default withErrorHandling(handler);
