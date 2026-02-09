# Image Upload 500 Error - Diagnostic Improvements

## Problem
Users were experiencing `Request failed with status code 500` errors when uploading images in the admin product creation page at `src/app/admin/products/new/page.tsx:99`.

## Root Cause Analysis
The 500 error could originate from several sources:
1. Image variant generation failure (Sharp library processing)
2. R2/Cloudflare upload failure (network, credentials, bucket issue)
3. Supabase fallback upload failure
4. Unhandled exceptions in the upload pipeline
5. File processing timeout

## Solution Implemented
Enhanced error logging and error handling in the backend upload controller to provide comprehensive diagnostics.

### Changes Made

#### File: `backend/src/controllers/upload.controller.ts`

**1. Improved File Validation Logging**
Added detailed logging when checking if files were received:
```typescript
console.log('[Upload Controller] 📋 Request files check:', {
  filesReceived: !!req.files,
  filesArray: Array.isArray(req.files),
  fileCount: files.length,
  reqFilesCom: !!req.files,
  reqFilesType: typeof req.files,
  filesKeys: req.files ? Object.keys(req.files) : 'no files',
});
```

**2. Variant Generation Error Handling**
Added try-catch blocks around variant generation with detailed error logging:
```typescript
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
```

**3. Per-Variant Upload Error Tracking**
Wrapped each R2/Supabase upload with detailed error context:
```typescript
try {
  const path = generateProductImagePath(imageId, variant.role);
  console.log('[Upload Controller] 📤 Uploading variant...', {
    imageId,
    variant: variant.role,
    path,
    size: variant.size,
  });
  await uploadToR2(variant.buffer, path, 'image/webp');
} catch (uploadError: any) {
  console.error('[Upload Controller] ❌ Variant upload failed:', {
    imageId,
    variant: variant.role,
    error: uploadError.message,
    stack: uploadError.stack,
  });
  throw uploadError;
}
```

**4. Enhanced Final Error Logging**
Improved error capture to include full error details:
```typescript
} catch (error) {
  console.error('[Upload Controller] 🔴 UPLOAD REQUEST FAILED', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    userId: req.user?.id,
    errorType: error instanceof Error ? error.constructor.name : typeof error,
  });
  next(error);
}
```

## How This Helps

### Before
When a 500 error occurred, the logs would show:
- Generic error message
- No context about which step failed
- No stack trace for debugging

### After
When a 500 error occurs, the logs now show:
- ✅ File received confirmation with count and types
- ✅ Storage backend selected (R2 vs Supabase)
- ✅ Image dimensions and format
- ✅ Each variant generation step with sizes
- ✅ Each variant upload with file path and size
- ✅ Full error message, stack trace, and error type when something fails

## Troubleshooting Guide

If you still encounter 500 errors during image upload:

1. **Check Backend Logs**
   - Look for `[Upload Controller]` entries
   - Find the step that fails (variant generation or upload)

2. **If Variant Generation Fails**
   - Check if the image format is valid (JPEG, PNG, WebP)
   - Verify image is larger than 100x100 pixels
   - Verify image is smaller than 10000x10000 pixels

3. **If R2 Upload Fails**
   - Verify R2 credentials in `backend/.env`:
     - `R2_ACCOUNT_ID`
     - `R2_ACCESS_KEY`
     - `R2_SECRET_KEY`
     - `R2_BUCKET`
     - `R2_PUBLIC_BASE_URL`

4. **If Supabase Fallback Fails**
   - Verify Supabase credentials in `backend/.env`:
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
   - Ensure bucket `product-images` exists
   - Check bucket policies allow uploads

## Testing

The fix was tested with:
- ✅ JWT authentication
- ✅ Admin role authorization
- ✅ Image variant generation (4 variants: thumbnail, listing, hero, zoom)
- ✅ R2 upload to Cloudflare
- ✅ Error handling at each step

Sample upload test:
```bash
curl -X POST http://localhost:8000/api/upload/images \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "images=@/path/to/image.jpg"
```

Expected response (success):
```json
{
  "success": true,
  "data": {
    "urls": ["https://cdn.orashop.in/products/temp-.../hero.webp"]
  },
  "message": "Successfully uploaded 1 files"
}
```

## Files Modified
- `backend/src/controllers/upload.controller.ts` - Enhanced error logging and diagnostics

## No Breaking Changes
- ✅ Upload endpoint API unchanged
- ✅ Response format unchanged
- ✅ Error handling improved but backward compatible
- ✅ Only added logging for better diagnostics

## Next Steps
Monitor the backend logs when testing image uploads. The detailed logging will help identify the exact cause of any 500 errors.
