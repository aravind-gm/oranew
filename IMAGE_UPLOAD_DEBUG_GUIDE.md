# Image Upload 500 Error - Quick Debug Guide

## Quick Checklist

When you encounter a 500 error on image upload, check these in order:

### 1. Backend is Running ✅
```bash
curl http://localhost:8000/api/health
# Should return 200 OK
```

### 2. Authentication is Valid ✅
- Token in frontend auth store is present
- Token hasn't expired
- Token was created with correct JWT_SECRET

### 3. File Format is Supported ✅
Supported formats:
- JPEG (.jpg, .jpeg)
- PNG (.png)  
- WebP (.webp)
- GIF (.gif)

File must be:
- Minimum: 100x100 pixels
- Maximum: 10000x10000 pixels
- Not corrupted or zero-bytes

### 4. R2 Storage is Configured ✅
Check `backend/.env`:
```
R2_ACCOUNT_ID=ff3f9d57...
R2_ACCESS_KEY=93a5a4b6...
R2_SECRET_KEY=f8ae910c...
R2_BUCKET=ora-images
R2_PUBLIC_BASE_URL=https://cdn.orashop.in
```

All values must be non-empty.

### 5. Network Connectivity ✅
Test R2 connectivity:
```bash
# Check if R2 endpoint is reachable
curl https://ff3f9d57917ee1bdfe19b56e3176ca6a.r2.cloudflarestorage.com
```

### 6. Check Backend Logs for Error Details
The enhanced logging will show:
```
[Upload Controller] 📸 Starting image upload...
[Upload Controller] 📋 Request files check: { filesReceived: true, fileCount: 1, ... }
[Upload Controller] ✅ Files received: { fileCount: 1, files: [...] }
[Image Processing] 🖼️ Generating variants...
[Image Processing] ✅ All variants generated...
[Upload Controller] 📤 Uploading variant...
[R2 Storage] 📤 Uploading file...
[R2 Storage] ✅ Upload successful...
[Upload Controller] ✅ File uploaded successfully...
```

If you see an error at any step, note:
- Which step failed
- The error message
- The stack trace

## Common Errors and Solutions

### Error: "No storage configured"
**Cause**: R2 configuration is missing or invalid
**Solution**: 
1. Check `backend/.env` has all R2_* variables
2. Verify values are not empty strings
3. Restart backend after updating .env

### Error: "Invalid image format"
**Cause**: Image is corrupted or unsupported format
**Solution**:
1. Try with a standard JPEG or PNG
2. Verify image is not corrupted
3. Check image dimensions are within limits

### Error: "Upload failed"
**Cause**: R2 credentials are incorrect or network issue
**Solution**:
1. Verify R2_ACCESS_KEY and R2_SECRET_KEY are correct
2. Check R2 account ID matches
3. Verify bucket name is correct
4. Test network connectivity to R2

### Error: "Variant generation failed"
**Cause**: Sharp library error or image processing issue
**Solution**:
1. Check backend has Sharp installed: `npm list sharp`
2. Verify image is valid format
3. Try with a different image file
4. Check system has enough memory

## Testing Upload with cURL

```bash
# 1. Generate test JWT token
cd backend
node -e "
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'ora-jewellery-production-jwt-secret-key-2024-secure';
const token = jwt.sign({
  sub: 'test-user',
  email: 'admin@test.com',
  role: 'ADMIN'
}, secret);
console.log('Token:', token);
"

# 2. Upload test image
curl -v -X POST http://localhost:8000/api/upload/images \
  -H "Authorization: Bearer <TOKEN_FROM_ABOVE>" \
  -F "images=@/path/to/test/image.jpg" \
  2>&1 | tee upload_test.log

# 3. Check response
# - Status code should be 200
# - Response should have: { "success": true, "data": { "urls": [...] } }
```

## Enabling Extra Verbose Logging

Edit `backend/src/controllers/upload.controller.ts` and add at the start of uploadImages:

```typescript
console.log('[Upload Controller] 🔍 VERBOSE DEBUG INFO:', {
  reqHeaders: req.headers,
  reqBody: req.body,
  reqUser: req.user,
  reqFiles: req.files,
  environment: {
    r2Configured: isR2Configured(),
    supabaseConfigured: isStorageConfigured(),
  }
});
```

Then rebuild and restart backend:
```bash
cd backend
npm run build
npm start
```

## Reading the Logs

Key log prefixes and what they mean:

| Prefix | Meaning | Status |
|--------|---------|--------|
| ✅ | Success - operation completed | Good |
| 📸 | Starting operation | Info |
| 🔄 | Processing | In progress |
| 📤 | Uploading | In progress |
| ❌ | Failed | Error |
| 🔴 | Critical error | Error |
| 🟡 | Warning | Attention |

## Performance Metrics

Expected times (local development):
- File receive: <100ms
- Variant generation (4 variants): 500-2000ms
- R2 upload: 1000-5000ms (depends on file size & network)
- Total for one image: 2-7 seconds

If uploads take much longer, check:
- Network connectivity to R2
- Backend CPU/memory usage
- File size (larger files take longer)

## Getting Help

When reporting a 500 error, include:
1. File size and format of image being uploaded
2. Backend logs around the upload time (copy full error section)
3. Network connectivity details (can you reach R2?)
4. R2 bucket name and region
5. Steps to reproduce the error
