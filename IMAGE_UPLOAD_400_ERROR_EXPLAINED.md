# 🔴 Image Upload 400 Error - Complete Explanation

## The Error You're Seeing

```
Failed to load resource: the server responded with a status of 400 (Bad Request)
[Admin] Image upload failed: AxiosError #codebase
```

---

## 📍 Where This Happens

**Location**: When admin tries to upload images in `/admin/products/new`
- File: [frontend/src/app/admin/products/new/page.tsx](frontend/src/app/admin/products/new/page.tsx#L100)
- Endpoint: `POST /api/upload/images`
- Error thrown at: Line 117 (catch block)

---

## 🔍 What Causes the 400 Error

### Root Cause: Express Middleware Ordering

The **400 Bad Request** error occurs when the backend's Express middleware is set up in the WRONG order:

```typescript
// ❌ WRONG ORDER (causes 400)
app.use(express.json());                    // ← Process ALL bodies as JSON
app.use(express.urlencoded({ ... }));      // ← Process ALL form data
app.use('/api/upload', uploadRoutes);       // ← Too late! Multer never executes
```

**What happens:**
1. Admin selects images and clicks upload
2. Frontend creates FormData object with images
3. Frontend sends: `POST /upload/images` with `Content-Type: multipart/form-data`
4. Backend's `express.json()` middleware intercepts the request FIRST
5. Express.json() tries to parse multipart data as JSON → **FAILS**
6. Returns **400 Bad Request** before multer even sees the request
7. Multer never gets a chance to process the images

### Step-by-Step Breakdown

```
Browser Request:
  POST /api/upload/images
  Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW
  [Image file binary data]
        ↓
Backend Middleware Chain:
  1. express.json() → "This is multipart, not JSON! 400 error!"
  2. express.urlencoded() → Skipped (error already thrown)
  3. uploadRoutes (multer) → Never reached!
        ↓
Response Sent:
  HTTP 400 Bad Request
  "Cannot parse multipart/form-data as JSON"
```

---

## ✅ How It's Fixed

### Correct Middleware Order

```typescript
// ✅ CORRECT ORDER
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Step 1: Register upload routes BEFORE body parsers
app.use('/api/upload', uploadRoutes);  // Multer handles multipart FIRST

// Step 2: Body parsers AFTER upload routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

**How it works now:**
1. Admin uploads images
2. Frontend sends multipart/form-data to `/api/upload/images`
3. Multer middleware (part of uploadRoutes) processes the request FIRST
4. Multer parses the files and populates `req.files`
5. Upload controller receives the files
6. Files uploaded to Supabase
7. Frontend receives image URLs

### Key Principle: Express Processes Routes in Order

```typescript
// Express evaluates route handlers in the order they're registered

// Registered First:
app.use('/api/upload', uploadRoutes);  // Handles multipart (multer) ✅

// Registered Second:
app.use(express.json());               // For all other JSON endpoints
```

---

## 🔐 Frontend Side: Authorization Header

Even though the backend was fixed, the frontend also has proper error handling:

**File**: [frontend/src/app/admin/products/new/page.tsx](frontend/src/app/admin/products/new/page.tsx#L85-L145)

```typescript
// Step 1: Create FormData
const formData = new FormData();
Array.from(files).forEach((file) => {
  formData.append('images', file);
});

// Step 2: CRITICAL - Never manually set Content-Type for FormData!
// This comment exists for a reason:
// "Manually setting it will OVERRIDE the Authorization header"
const response = await api.post('/upload/images', formData);
// Axios automatically adds: Content-Type: multipart/form-data; boundary=...
// AND preserves Authorization header from interceptor

// Step 3: Handle success
if (response.data.success) {
  console.log('[Admin] Image upload successful:', {
    uploadedCount: response.data.data.urls.length,
  });
  setImages([...images, ...newImages]);
}

// Step 4: Handle different error types
} catch (error: unknown) {
  console.error('[Admin] Image upload failed:', error);
  
  if (err.response?.status === 401) {
    // Token expired
    setError('❌ Unauthorized - Please re-login');
  } else if (err.response?.status === 403) {
    // User not admin
    setError('❌ Access Denied - Only Admins can upload');
  } else if (err.response?.status === 400) {
    // Middleware error / validation error
    setError(`❌ ${err.response.data?.message || err.message}`);
  }
}
```

---

## 🔄 Complete Request Flow

### Before Fix ❌
```
Frontend                          Backend
  ↓                                ↓
[FormData]                    express.json()
  ↓                           (Intercepts first)
POST /upload/images      ↗          ↓
Content-Type:           X    Cannot parse as JSON
multipart/form-data           ↓
  ↓                          400 Bad Request ❌
[Error Caught]
Display: "Failed to upload"
```

### After Fix ✅
```
Frontend                          Backend
  ↓                                ↓
[FormData]                   uploadRoutes (Multer)
  ↓                          (Processes first)
POST /upload/images      ↗          ↓
Content-Type:                Parse multipart ✅
multipart/form-data           ↓
  ↓                    [req.files populated]
[Success Handler]             ↓
Display: "Upload complete"   Supabase Upload
                                  ↓
                          Return URLs to Frontend
```

---

## 🧪 How to Test the Fix

### Test 1: Image Upload
```bash
# 1. Open browser DevTools (F12)
# 2. Go to /admin/products/new
# 3. Click "Select Images"
# 4. Choose 1-3 image files
# 5. Watch the console
```

**Expected Console Output**:
```
[Admin] Starting image upload... {
  fileCount: 1,
  hasToken: true,
  isHydrated: true
}

[Axios] POST /upload/images
  Authorization: Bearer eyJhbGc...
  Content-Type: multipart/form-data; boundary=----...

[Admin] Image upload successful: {
  uploadedCount: 1,
  imageUrls: [
    "https://supabase-project.supabase.co/storage/v1/object/public/images/ring-abc123.jpg"
  ]
}
```

### Test 2: Backend Console
```bash
# In backend terminal, you should see:
[Upload Controller] 📸 Starting image upload... {
  userId: 'user-123',
  userEmail: 'admin@example.com',
  userRole: 'ADMIN'
}

[Upload Controller] ✅ Files received: {
  fileCount: 1,
  files: [{
    name: 'ring.jpg',
    size: 256000,
    type: 'image/jpeg'
  }]
}

[Upload Controller] ✅ File uploaded successfully: {
  fileName: 'ring.jpg',
  url: 'https://supabase.../ring-abc123.jpg'
}

[Upload Controller] ✅ IMAGE UPLOAD COMPLETE {
  uploadedCount: 1,
  failedCount: 0,
  userId: 'user-123'
}
```

---

## 🛠️ Files Involved

| File | Purpose | Status |
|------|---------|--------|
| [backend/src/server.ts](backend/src/server.ts) | Middleware ordering | ✅ Fixed |
| [backend/src/routes/upload.routes.ts](backend/src/routes/upload.routes.ts) | Multer configuration | ✅ Correct |
| [backend/src/controllers/upload.controller.ts](backend/src/controllers/upload.controller.ts) | Upload logic | ✅ Correct |
| [frontend/src/app/admin/products/new/page.tsx](frontend/src/app/admin/products/new/page.tsx) | Upload UI & error handling | ✅ Correct |
| [frontend/src/lib/api.ts](frontend/src/lib/api.ts) | Axios interceptor | ✅ Correct |

---

## 📊 Error Status Codes

| Status | Meaning | Solution |
|--------|---------|----------|
| **400** | Express.json() parsed multipart | Middleware ordering issue |
| **401** | Token missing/expired | Re-login and retry |
| **403** | User not ADMIN/STAFF | Check user role |
| **500** | Supabase connection failed | Check credentials |
| **200** | ✅ Upload successful | Proceed |

---

## 🚀 Key Takeaways

1. **Why 400?** → Express middleware was parsing multipart data as JSON
2. **How Fixed?** → Moved upload routes BEFORE body parser middleware
3. **Frontend Works?** → Axios auto-detects FormData and sets correct headers
4. **Auth Preserved?** → Axios interceptor adds token before multer processes
5. **Error Handling?** → Frontend catches and displays appropriate messages

---

## ✅ Current Status

- **Backend:** Fixed (middleware ordering corrected)
- **Frontend:** Proper error handling in place
- **Supabase:** Connected and ready
- **Image Upload:** Should work ✅

Try uploading an image now and check the console logs!
