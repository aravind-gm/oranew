# 🔄 ADMIN PRODUCT CREATION - COMPLETE FLOW MAP

**A step-by-step trace of what happens when an admin creates a product**

---

## 📍 STEP 1: Admin Navigates to `/admin/products/new`

### Frontend
```typescript
// src/app/admin/products/new/page.tsx - useEffect
useEffect(() => {
  if (!isHydrated) return;  // Wait for store to hydrate
  
  if (!token || user?.role !== 'ADMIN') {
    router.push('/admin/login');  // Redirect if not admin
    return;
  }
  fetchCategories();  // Load dropdown options
}, [isHydrated, token, user, router]);
```

**What happens:**
- Store checks if hydrated (localStorage loaded into Zustand)
- Verifies token exists AND user.role === 'ADMIN'
- Fetches categories list from `/api/categories`

**Axios Request**:
```
GET /api/categories
Headers: Authorization: Bearer eyJ...
```

**Response**:
```json
{
  "success": true,
  "data": [
    {"id": "cat123", "name": "Rings", "slug": "rings"},
    {"id": "cat456", "name": "Necklaces", "slug": "necklaces"}
  ]
}
```

---

## 📍 STEP 2: Admin Clicks "Upload Images"

### Frontend
```typescript
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  if (!token || !isHydrated) {
    setError('❌ Authentication not ready...');
    return;
  }

  console.log('[Admin] Starting image upload...', {
    fileCount: files.length,
    hasToken: !!token,
  });
```

**Browser Console Output:**
```
[Admin] Starting image upload... {
  fileCount: 1,
  hasToken: true,
  isHydrated: true
}
```

### Axios Interceptor Triggers
```typescript
// src/lib/api.ts - Request interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const authStore = useAuthStore.getState();
    const token = authStore.token || localStorage.getItem('ora_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      const isAdminRequest = config.url?.includes('admin') || config.url?.includes('upload');
      if (isAdminRequest) {
        console.log('[Axios] Token attached to request:', {
          endpoint: config.url,      // '/api/upload/images'
          method: config.method,     // 'post'
          hasToken: !!token,         // true
          fromStore: !!authStore.token,
          authHeaderSet: true        // ✅ CRITICAL
        });
      }
    }
  }
  return config;
});
```

**Browser Console Output:**
```
[Axios] Token attached to request: {
  endpoint: /api/upload/images,
  method: post,
  hasToken: true,
  fromStore: true,
  authHeaderSet: true ✅
}
```

### Request Sent to Backend
```
POST /api/upload/images
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ✅

[File data in body]
```

---

## 📍 STEP 3: Backend Receives Image Upload Request

### Backend Auth Middleware Triggers
```typescript
// src/middleware/auth.ts
export const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.error('[Auth Middleware] ❌ NO TOKEN PROVIDED');
      throw new AppError('Not authorized, no token provided', 401);
    }

    console.log('[Auth Middleware] 🔐 Token validation starting...', {
      endpoint: 'POST /upload/images',
      tokenLength: token.length,
    });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    
    console.log('[Auth Middleware] ✅ Token verified successfully', {
      userId: decoded.id,
      userEmail: decoded.email,
      userRole: decoded.role,
    });

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('[Auth Middleware] ⏰ TOKEN EXPIRED');
      next(new AppError('Token has expired', 401));
    } else {
      console.error('[Auth Middleware] ❌ TOKEN INVALID');
      next(new AppError('Invalid token signature', 401));
    }
  }
};
```

**Server Console Output:**
```
POST /api/upload/images
[Auth Middleware] 🔐 Token validation starting... {
  endpoint: POST /upload/images,
  tokenLength: 243
}
[Auth Middleware] ✅ Token verified successfully {
  userId: user123,
  userEmail: admin@ora.com,
  userRole: ADMIN
}
```

### Role Authorization Middleware
```typescript
// src/routes/upload.routes.ts
router.post(
  '/images',
  protect,              // 👈 Token validation (just passed)
  authorize('ADMIN', 'STAFF'),  // 👈 Role check (next)
  upload.array('images', 10),
  uploadImages
);
```

```typescript
// src/middleware/auth.ts
export const authorize = (...roles: UserRole[]) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      console.warn('[Auth Middleware] 🚫 USER ROLE NOT AUTHORIZED', {
        userRole: req.user.role,
        requiredRoles: roles,  // ['ADMIN', 'STAFF']
      });
      return next(new AppError('Access denied. Your role: CUSTOMER', 403));
    }

    console.log('[Auth Middleware] ✅ Authorization granted', {
      userRole: req.user.role,  // 'ADMIN'
    });
    next();
  };
};
```

**Server Console Output:**
```
[Auth Middleware] ✅ Authorization granted {
  userRole: ADMIN
}
```

### Multer File Processing
```typescript
// Handles Content-Type: multipart/form-data
// Extracts files array from request
// Stores in memory (memoryStorage)
// Max 5MB per file, max 10 files
// Only image/* MIME types accepted
```

### Image Upload Controller
```typescript
// src/controllers/upload.controller.ts
export const uploadImages = async (req: AuthRequest, res, next) => {
  try {
    console.log('[Upload Controller] 📸 Starting image upload...', {
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
    });

    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    console.log('[Upload Controller] ✅ Files received:', {
      fileCount: files.length,
      files: [
        { name: 'ring.jpg', size: 256000, type: 'image/jpeg' }
      ],
    });

    const uploadedUrls = [];
    
    for (const file of files) {
      const url = await uploadToStorage(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      uploadedUrls.push(url);
      
      console.log('[Upload Controller] ✅ File uploaded successfully:', {
        fileName: file.originalname,
        url: 'https://supabase.url/images/ring-abc123.jpg',
      });
    }

    console.log('[Upload Controller] ✅ IMAGE UPLOAD COMPLETE', {
      uploadedCount: 1,
      failedCount: 0,
      userId: req.user.id,
    });

    res.json({
      success: true,
      data: {
        urls: ['https://supabase.url/images/ring-abc123.jpg'],
      },
      message: 'Successfully uploaded 1 file',
    });
  } catch (error) {
    console.error('[Upload Controller] ❌ UPLOAD REQUEST FAILED', {
      error: error.message,
    });
    next(error);
  }
};
```

**Server Console Output:**
```
[Upload Controller] 📸 Starting image upload... {
  userId: user123,
  userEmail: admin@ora.com,
  userRole: ADMIN
}
[Upload Controller] ✅ Files received: {
  fileCount: 1,
  files: [{name: ring.jpg, size: 256000, type: image/jpeg}]
}
[Upload Controller] ✅ File uploaded successfully: {
  fileName: ring.jpg,
  url: https://supabase.url/images/ring-abc123.jpg
}
[Upload Controller] ✅ IMAGE UPLOAD COMPLETE {
  uploadedCount: 1,
  failedCount: 0,
  userId: user123
}
```

---

## 📍 STEP 4: Frontend Receives Image URL

### Response Interceptor
```typescript
api.interceptors.response.use(
  (response) => response,  // ✅ Status 200
  (error) => {
    // Only handles errors, success passes through
    return Promise.reject(error);
  }
);
```

### Frontend Processes Response
```typescript
// src/app/admin/products/new/page.tsx
if (response.data.success) {
  console.log('[Admin] Image upload successful:', {
    uploadedCount: response.data.data.urls.length,
    imageUrls: ['https://supabase.url/images/ring-abc123.jpg'],
  });

  const newImages = response.data.data.urls.map((url, index) => ({
    url,
    alt: form.name || 'Product image',
    isPrimary: images.length === 0 && index === 0,  // First image is primary
  }));
  
  setImages([...images, ...newImages]);
}
```

**Browser Console Output:**
```
[Admin] Image upload successful: {
  uploadedCount: 1,
  imageUrls: [https://supabase.url/images/ring-abc123.jpg]
}
```

**UI Update:**
- Image preview appears in form
- "Remove" button available
- Can upload more images or proceed to submit

---

## 📍 STEP 5: Admin Fills Form & Clicks "Create Product"

### Frontend Form Validation
```typescript
const validationErrors = [];

if (!form.name.trim()) {
  validationErrors.push('Product name is required');
}

if (!form.price || parseFloat(form.price) <= 0) {
  validationErrors.push('Price must be greater than 0');
}

if (!form.categoryId) {
  validationErrors.push('Category is required');
}

if (images.length === 0) {
  validationErrors.push('At least one image is required');  // ✅ Image validation added
}

const stockQty = parseInt(form.stockQuantity);
if (isNaN(stockQty) || stockQty < 0) {
  validationErrors.push('Stock quantity must be a non-negative number');
}

const discountPct = parseFloat(form.discountPercent || '0');
if (discountPct < 0 || discountPct > 100) {
  validationErrors.push('Discount must be between 0% and 100%');
}

if (validationErrors.length > 0) {
  setError(`❌ Form Validation Failed:\n${validationErrors.map(e => `• ${e}`).join('\n')}`);
  return;  // ✅ Don't send to server if validation fails
}
```

**Example validation error display:**
```
❌ Form Validation Failed:
• Price must be greater than 0
• Stock quantity must be a non-negative number
```

### Frontend Axios Request
```typescript
// Form data prepared
const productData = {
  name: 'Gold Diamond Ring',
  description: 'Premium 18K gold ring...',
  shortDescription: 'Elegant gold ring',
  price: '5000',
  discountPercent: '10',
  categoryId: 'cat123',
  material: '18K Gold',
  stockQuantity: '25',
  isFeatured: true,
  isActive: true,
  images: [
    {
      url: 'https://supabase.url/images/ring-abc123.jpg',
      alt: 'Gold Diamond Ring',
      isPrimary: true,
    }
  ],
  metaTitle: 'Gold Diamond Ring',
  metaDescription: 'Premium 18K gold ring',
};

console.log('[Admin] Submitting product creation request...', {
  productName: 'Gold Diamond Ring',
  imageCount: 1,
  hasToken: true,
  isHydrated: true,
});

const response = await api.post('/admin/products', productData);
```

**Browser Console Output:**
```
[Admin] Submitting product creation request... {
  productName: Gold Diamond Ring,
  imageCount: 1,
  hasToken: true,
  isHydrated: true,
  endpoint: /admin/products
}

[Axios] Token attached to request: {
  endpoint: /admin/products,
  method: post,
  hasToken: true,
  fromStore: true,
  authHeaderSet: true ✅
}
```

### Request Sent to Backend
```
POST /api/admin/products
Content-Type: application/json
Authorization: Bearer eyJ... ✅

{
  "name": "Gold Diamond Ring",
  "price": "5000",
  "discountPercent": "10",
  "categoryId": "cat123",
  "images": [...],
  ...
}
```

---

## 📍 STEP 6: Backend Processes Product Creation

### Auth & Authorization (Same as before)
```
[Auth Middleware] 🔐 Token validation starting...
[Auth Middleware] ✅ Token verified successfully {userId: ..., role: ADMIN}
[Auth Middleware] ✅ Authorization granted {userRole: ADMIN}
```

### Product Controller Validation
```typescript
// src/controllers/product.controller.ts
if (!req.user) {
  throw new AppError('Not authenticated', 401);
}

console.log('[Product Controller] 📝 Creating product...', {
  userId: req.user.id,
  userRole: req.user.role,
});

const errors = [];

if (!name || !name.trim()) {
  errors.push('Product name is required');
}
if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
  errors.push('Valid price (> 0) is required');
}
if (!categoryId) {
  errors.push('Category ID is required');
}
if (discountPercent && (parseFloat(discountPercent) < 0 || parseFloat(discountPercent) > 100)) {
  errors.push('Discount must be between 0 and 100');
}
if (stockQuantity && (parseInt(stockQuantity) < 0)) {
  errors.push('Stock quantity must be a non-negative number');
}

if (errors.length > 0) {
  console.warn('[Product Controller] ⚠️ VALIDATION FAILED', {
    errors: ['Valid price (> 0) is required']
  });
  throw new AppError(`Validation failed: ${errors.join('; ')}`, 400);
}

// Verify category exists
const category = await prisma.category.findUnique({
  where: { id: categoryId }
});

if (!category) {
  console.error('[Product Controller] ❌ CATEGORY NOT FOUND', {
    categoryId
  });
  throw new AppError(`Category with ID ${categoryId} not found`, 400);
}
```

**Server Console Output:**
```
POST /api/admin/products
[Product Controller] 📝 Creating product... {
  userId: user123,
  userRole: ADMIN
}
[Product Controller] ✅ Validation passed, creating product... {
  productName: Gold Diamond Ring,
  price: 5000,
  discountPercent: 10,
  finalPrice: 4500,
  stockQuantity: 25,
  imageCount: 1
}
```

### Database Create
```typescript
const product = await prisma.product.create({
  data: {
    name: 'Gold Diamond Ring',
    slug: 'gold-diamond-ring',
    description: 'Premium 18K gold ring...',
    price: 5000,
    discountPercent: 10,
    finalPrice: 4500,
    sku: `ORA-${Date.now()}`,
    categoryId: 'cat123',
    stockQuantity: 25,
    isFeatured: true,
    isActive: true,
    images: {
      create: [
        {
          imageUrl: 'https://supabase.url/images/ring-abc123.jpg',
          altText: 'Gold Diamond Ring',
          sortOrder: 0,
          isPrimary: true,
        }
      ]
    },
  },
  include: { images: true, category: true },
});
```

### Success Response
```typescript
console.log('[Product Controller] ✅ PRODUCT CREATED SUCCESSFULLY', {
  productId: 'prod-abc123',
  productName: 'Gold Diamond Ring',
  categoryId: 'cat123',
  price: 5000,
  finalPrice: 4500,
  stockQuantity: 25,
  imageCount: 1,
  createdByUserId: 'user123',
  createdByEmail: 'admin@ora.com',
});

res.status(201).json({
  success: true,
  message: 'Product "Gold Diamond Ring" created successfully',
  data: product,
});
```

**Server Console Output:**
```
[Product Controller] ✅ PRODUCT CREATED SUCCESSFULLY {
  productId: prod-abc123,
  productName: Gold Diamond Ring,
  categoryId: cat123,
  price: 5000,
  finalPrice: 4500,
  stockQuantity: 25,
  imageCount: 1,
  createdByUserId: user123,
  createdByEmail: admin@ora.com
}
```

---

## 📍 STEP 7: Frontend Receives Success & Redirects

### Frontend Response Handling
```typescript
const response = await api.post('/admin/products', productData);

if (response.data.success) {
  console.log('[Admin] ✅ Product created successfully:', {
    productId: response.data.data.id,
    productName: response.data.data.name,
  });
  
  router.push('/admin/products');  // ✅ Redirect to product list
}
```

**Browser Console Output:**
```
[Admin] ✅ Product created successfully: {
  productId: prod-abc123,
  productName: Gold Diamond Ring
}
```

### UI Update
- Form clears
- User redirected to `/admin/products`
- New product appears in list with:
  - ✅ Name: "Gold Diamond Ring"
  - ✅ Price: 5000 (with 10% discount = 4500)
  - ✅ Stock: 25
  - ✅ Category: "Rings"
  - ✅ Image thumbnail visible
  - ✅ Active/Featured status

---

## 🔄 COMPLETE REQUEST LIFECYCLE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ADMIN USER ACTION                              │
│                   Clicks "Create Product" Button                          │
└──────────────────────────────────────┬──────────────────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────┐
                    │   FRONTEND VALIDATION (NEW)         │
                    │ ✅ All required fields filled       │
                    │ ✅ Price > 0                        │
                    │ ✅ Stock >= 0                       │
                    │ ✅ Discount 0-100%                  │
                    │ ✅ At least 1 image                 │
                    └──────────────────┬──────────────────┘
                                       │
            ┌──────────────────────────▼──────────────────────────────┐
            │           AXIOS REQUEST INTERCEPTOR                      │
            │ ✅ Gets token from store or localStorage                │
            │ ✅ Sets Authorization: Bearer <token>                   │
            │ ✅ Logs for /admin endpoints                            │
            └──────────────────┬───────────────────────────────────────┘
                               │
        ┌──────────────────────▼─────────────────────────────┐
        │      POST /api/admin/products                       │
        │      Headers: Authorization: Bearer ...             │
        │      Content-Type: application/json                 │
        │      Body: {product data with images array}         │
        └──────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────▼─────────────────────────────┐
        │           BACKEND MIDDLEWARE                    │
        │ ✅ Express receives request                     │
        │ ✅ CORS checked                                │
        │ ✅ JSON parsed                                 │
        │ ✅ Path normalization applied                  │
        └──────────────────┬──────────────────────────────┘
                           │
    ┌──────────────────────▼──────────────────────────────┐
    │      BACKEND AUTH MIDDLEWARE (protect)              │
    │ ✅ Extract token from Authorization header          │
    │ ✅ Verify JWT signature                             │
    │ ✅ Check token not expired                          │
    │ ✅ Attach req.user with id, email, role            │
    │ ✅ Log successful verification                      │
    └──────────────────┬───────────────────────────────────┘
                       │
    ┌──────────────────▼──────────────────────────────────┐
    │   BACKEND ROLE MIDDLEWARE (authorize)               │
    │ ✅ Check req.user.role includes 'ADMIN' or 'STAFF'  │
    │ ✅ If not, return 403 Forbidden                     │
    │ ✅ If yes, proceed                                  │
    └──────────────────┬───────────────────────────────────┘
                       │
    ┌──────────────────▼──────────────────────────────────┐
    │   BACKEND PRODUCT CONTROLLER                        │
    │ ✅ Verify req.user exists                           │
    │ ✅ Validate all input fields                        │
    │ ✅ Check category exists                            │
    │ ✅ Calculate final price                            │
    │ ✅ Create product in database                       │
    │ ✅ Create associated images                         │
    │ ✅ Return 201 with product data                     │
    └──────────────────┬───────────────────────────────────┘
                       │
    ┌──────────────────▼──────────────────────────────────┐
    │   BACKEND RESPONSE                                  │
    │ {                                                   │
    │   "success": true,                                 │
    │   "message": "Product created successfully",       │
    │   "data": {                                        │
    │     "id": "prod-abc123",                          │
    │     "name": "Gold Diamond Ring",                  │
    │     "price": 5000,                                │
    │     "images": [...]                               │
    │   }                                                │
    │ }                                                   │
    └──────────────────┬───────────────────────────────────┘
                       │
    ┌──────────────────▼──────────────────────────────────┐
    │   FRONTEND RESPONSE INTERCEPTOR                     │
    │ ✅ Status 201 (success)                             │
    │ ✅ Extract product data                             │
    │ ✅ Pass to handler                                  │
    └──────────────────┬───────────────────────────────────┘
                       │
    ┌──────────────────▼──────────────────────────────────┐
    │   FRONTEND HANDLES SUCCESS                          │
    │ ✅ Log: Product created successfully                │
    │ ✅ Redirect to /admin/products                      │
    │ ✅ Product appears in list                          │
    └──────────────────────────────────────────────────────┘
```

---

## 🎯 KEY VALIDATION POINTS

### Frontend (Before sending):
1. ✅ Product name not empty
2. ✅ Price > 0 and numeric
3. ✅ Category selected
4. ✅ At least 1 image uploaded
5. ✅ Stock >= 0
6. ✅ Discount 0-100%

### Backend (Before creating):
1. ✅ User authenticated (token valid)
2. ✅ User authorized (ADMIN or STAFF role)
3. ✅ Product name not empty
4. ✅ Price > 0 and numeric
5. ✅ Category exists in database
6. ✅ Discount 0-100%
7. ✅ Stock >= 0

**Result**: Double validation = Bulletproof data integrity

---

## 📊 HTTP STATUS CODES

| Scenario | Code | Response |
|----------|------|----------|
| Success | 201 | Product created |
| No token | 401 | Not authorized |
| Token expired | 401 | Token has expired |
| Not ADMIN | 403 | Access denied |
| Invalid data | 400 | Validation failed |
| Category not found | 400 | Category not found |
| Storage error | 500 | Storage not configured |

---

## 🔍 LOGS TO LOOK FOR

**Success Path Logs:**
```
✅ [Axios] Token attached to request
✅ [Auth Middleware] Token verified successfully
✅ [Auth Middleware] Authorization granted
✅ [Product Controller] Creating product...
✅ [Product Controller] PRODUCT CREATED SUCCESSFULLY
✅ [Admin] Product created successfully
```

**Error Path Logs:**
```
❌ [Axios] No token found
❌ [Auth Middleware] TOKEN INVALID
❌ [Auth Middleware] USER ROLE NOT AUTHORIZED
❌ [Product Controller] VALIDATION FAILED
❌ [Product Controller] CATEGORY NOT FOUND
```
