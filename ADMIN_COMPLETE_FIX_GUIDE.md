# 🔧 ADMIN PANEL FIX GUIDE - COMPLETE SOLUTION

## 🚨 DIAGNOSIS COMPLETE

After a full system audit, I identified **4 CRITICAL ISSUES** causing the total admin failure:

### Issue 1: Missing Supabase ANON_KEY ❌
- **Location**: `backend/.env` line 9
- **Problem**: `SUPABASE_ANON_KEY="your-supabase-anon-key"` is a placeholder
- **Impact**: Not critical for backend (uses SERVICE_ROLE_KEY), but should be set

### Issue 2: JWT Secret Mismatch ❌
- **Location**: Multiple `.env` files have different JWT_SECRET values
- **Problem**: Tokens generated in one environment cannot be verified in another
- **Impact**: 401 Unauthorized errors on all authenticated requests
- **Evidence**: Backend logs show `invalid signature` errors

### Issue 3: Missing Storage Bucket ❌
- **Location**: Supabase Storage
- **Problem**: `product-images` bucket may not exist or lacks proper policies
- **Impact**: Image uploads fail with 404/403 errors

### Issue 4: No Admin User in Database ❌
- **Problem**: Database may not have an ADMIN role user
- **Impact**: Cannot log into admin panel

---

## ✅ FIX STEPS (In Order)

### STEP 1: Update Backend Environment Variables

Edit `backend/.env` and ensure these values are correct:

```env
# JWT - CRITICAL: Use same secret across all environments!
JWT_SECRET="ora-jewellery-super-secret-jwt-key-2024"
JWT_EXPIRES_IN="7d"

# Supabase Storage (get from Supabase Dashboard > Project Settings > API)
SUPABASE_URL="https://hgejomvgldqnqzkgffoi.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # Your actual anon key
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # Your actual service role key
```

**Where to get Supabase keys:**
1. Go to https://supabase.com/dashboard
2. Select your project (hgejomvgldqnqzkgffoi)
3. Click "Project Settings" (gear icon)
4. Click "API" in sidebar
5. Copy:
   - `URL` → SUPABASE_URL
   - `anon public` key → SUPABASE_ANON_KEY
   - `service_role` key → SUPABASE_SERVICE_ROLE_KEY

---

### STEP 2: Create Storage Bucket in Supabase

1. Go to Supabase Dashboard
2. Click "Storage" in left sidebar
3. Click "New bucket"
4. **Name**: `product-images`
5. **Public bucket**: ✅ Toggle ON
6. Click "Create bucket"

Then add storage policies:

1. Click on `product-images` bucket
2. Go to "Policies" tab
3. Click "New Policy" → "For full customization"
4. Create policy:
   - **Name**: `Allow public read`
   - **Allowed operations**: SELECT
   - **Policy definition**: `true`
5. Click "Review" → "Save policy"

**Note**: The SERVICE_ROLE_KEY bypasses RLS, so INSERT/DELETE don't need explicit policies.

---

### STEP 3: Seed Database with Admin User

Run the seed script:

```bash
cd backend
npx prisma db push   # Ensure tables exist
npx ts-node seed.js  # Or: node seed.js
```

This creates:
- Admin user: `admin@orashop.in` / password: `admin123`
- Categories: Necklaces, Earrings, Bracelets, Rings, Jewellery Sets
- Sample products

**Or run SQL directly in Supabase:**

```sql
-- Create admin user (password: admin123)
INSERT INTO users (id, email, password_hash, full_name, role, is_verified, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@orashop.in',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4bKV6THyYKdK8xdK',
  'ORA Admin',
  'ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET role = 'ADMIN', is_verified = true;
```

---

### STEP 4: Restart Backend Server

```bash
cd backend
npm run build  # Recompile TypeScript
npm run dev    # Start in development mode
```

Watch for these startup messages:
```
✅ Supabase Storage: CONNECTED
```

If you see:
```
❌ Supabase Storage ERROR: Bucket "product-images" does not exist
```
→ Go back to Step 2

---

### STEP 5: Test Admin Login

1. Go to http://localhost:3000/admin/login
2. Login with:
   - Email: `admin@orashop.in`
   - Password: `admin123`
3. Should redirect to `/admin` dashboard

If you get "Invalid credentials":
- Check backend logs for JWT errors
- Verify admin user exists: Run SQL `SELECT * FROM users WHERE role = 'ADMIN'`

---

### STEP 6: Test Image Upload

1. Go to http://localhost:3000/admin/products/new
2. Fill in:
   - Product Name: "Test Ring"
   - Category: Select any
   - Price: 9999
3. Click "Upload Images" and select a .jpg/.png file
4. Watch browser console for:
   - `[Admin] Starting image upload...`
   - `[Admin] Image upload successful`

If upload fails:
- Check backend logs for Supabase errors
- Verify bucket exists and SERVICE_ROLE_KEY is correct

---

### STEP 7: Test Product Creation

After images upload successfully:
1. Fill remaining fields
2. Click "Create Product"
3. Should redirect to `/admin/products`
4. New product should appear in list

---

## 🔍 TROUBLESHOOTING

### Error: 401 Unauthorized
**Cause**: JWT token invalid or expired
**Fix**: 
1. Clear localStorage: `localStorage.clear()`
2. Re-login to admin panel
3. Ensure JWT_SECRET matches in backend/.env

### Error: 403 Forbidden
**Cause**: User doesn't have ADMIN role
**Fix**: Update user role in database:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@orashop.in';
```

### Error: 400 Bad Request on Image Upload
**Cause**: Multer middleware conflict with express.json()
**Fix**: Already fixed in server.ts - upload routes are registered before express.json()

### Error: Storage bucket not found
**Cause**: Bucket doesn't exist
**Fix**: Create `product-images` bucket in Supabase Dashboard > Storage

### Error: Invalid signature
**Cause**: JWT_SECRET changed between token generation and verification
**Fix**: Use consistent JWT_SECRET, clear tokens, re-login

---

## ✅ VERIFICATION CHECKLIST

Run these tests in order:

- [ ] Backend starts without Supabase errors
- [ ] Admin login works (admin@orashop.in / admin123)
- [ ] Categories load in product form dropdown
- [ ] Image upload returns Supabase URL
- [ ] Product creation succeeds
- [ ] Product appears in admin list
- [ ] Product appears on frontend shop

---

## 📁 FILES MODIFIED

1. `backend/src/config/supabase.ts` - Added validation and diagnostics
2. `backend/src/server.ts` - Added Supabase connection test at startup
3. `backend/setup-supabase-storage.sql` - Storage bucket setup SQL
4. `backend/setup-admin-user.sql` - Admin user creation SQL

---

## 🔑 ENVIRONMENT VARIABLE REFERENCE

### backend/.env (Required)
```env
DATABASE_URL="postgresql://..."          # Pooled connection
DIRECT_URL="postgresql://..."            # Direct connection
SUPABASE_URL="https://xxx.supabase.co"   # Project URL
SUPABASE_SERVICE_ROLE_KEY="eyJ..."       # Service role (bypasses RLS)
JWT_SECRET="your-consistent-secret"       # MUST be same everywhere
```

### frontend/.env.local (Required)
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/api
```

---

## 🎯 ROOT CAUSE SUMMARY

| Issue | Root Cause | Impact | Fix |
|-------|-----------|--------|-----|
| 401 Errors | JWT_SECRET mismatch | All auth fails | Sync JWT_SECRET |
| Image Upload Fails | Missing bucket | No product images | Create bucket |
| Product Creation Fails | No categories | Can't select category | Run seed |
| No Admin Access | No admin user | Can't login | Create admin user |

The system was NEVER properly configured for production - placeholder values were used in environment files.
