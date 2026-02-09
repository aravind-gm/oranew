# Supabase Storage Cleanup Checklist

## ORA Jewellery — Post-Migration Cleanup

**Purpose:** This checklist guides you through safely removing Supabase Storage after migrating to Cloudflare R2.

---

## ⚠️ CRITICAL: Do NOT proceed until:

- [ ] All images have been migrated to R2 (`npm run migrate:r2`)
- [ ] All migrations are verified (`npm run migrate:r2:verify`)
- [ ] Production site is using CDN URLs (check Network tab)
- [ ] At least 1 week has passed since migration
- [ ] Backup of Supabase Storage exists

---

## Step 1: Verify Migration Completion

```sql
-- Run in Supabase SQL Editor

-- Check migration status
SELECT status, COUNT(*) as count 
FROM image_migrations 
GROUP BY status;

-- Expected result:
-- status    | count
-- ----------+------
-- verified  | (all images)

-- Check for any unmigrated product images
SELECT COUNT(*) FROM product_images WHERE cdn_verified = false;
-- Expected: 0

-- Check for any Supabase URLs still in use
SELECT COUNT(*) FROM product_images WHERE image_url LIKE '%supabase.co%';
-- Expected: 0
```

---

## Step 2: Verify CDN is Serving All Images

```bash
# Check frontend is using CDN URLs
curl -I "https://cdn.orashop.in/products/[any-product-id]/hero.webp"

# Expected response:
# HTTP/2 200
# content-type: image/webp
# cache-control: public, max-age=31536000, immutable
```

---

## Step 3: Verify R2 Storage Health

```bash
# Run from backend directory
npm run dev

# In another terminal:
curl -X GET "http://localhost:8000/api/r2/health" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Expected response:
# { "success": true, "configured": true, "connected": true }
```

---

## Step 4: Delete Supabase Storage Files

### Option A: Automated (Recommended)

```bash
cd backend
npm run migrate:r2:cleanup
```

### Option B: Manual via Supabase Dashboard

1. Go to Supabase Dashboard
2. Navigate to Storage > product-images
3. Select all files
4. Delete

### Option C: Via SQL (for metadata only)

```sql
-- This does NOT delete actual files, only references
-- Use only if files were already deleted from Storage

-- Clear migration tracking table (optional)
DELETE FROM image_migrations WHERE status = 'verified';

-- Clear original_url references
UPDATE product_images SET original_url = NULL WHERE original_url IS NOT NULL;
```

---

## Step 5: Remove Supabase Storage Bucket

1. Go to Supabase Dashboard > Storage
2. Click on `product-images` bucket
3. Settings > Delete bucket
4. Confirm deletion

---

## Step 6: Remove Supabase Storage Code (Optional)

After confirming R2 is working perfectly in production for at least 2 weeks:

### Files that can be simplified:

| File | Action |
|------|--------|
| `backend/src/config/supabase.ts` | Remove storage functions (keep auth) |
| `backend/src/controllers/upload.controller.ts` | Remove Supabase fallback |
| `frontend/src/utils/supabaseUrlHelper.ts` | Can be removed |

### Environment Variables to Remove:

```env
# These are only for Storage, NOT for Auth
# Only remove if you're 100% sure R2 is working
# SUPABASE_SERVICE_ROLE_KEY - KEEP for Auth!
```

---

## Step 7: Update Documentation

- [ ] Update README.md to reflect R2 usage
- [ ] Update .env.example to only include R2 variables for storage
- [ ] Archive Supabase Storage documentation

---

## Step 8: Final Verification

- [ ] Homepage loads with all images
- [ ] Product pages show all variants
- [ ] Admin can upload new products
- [ ] Admin can update banners
- [ ] No console errors related to images
- [ ] Lighthouse image score ≥ 95

---

## Rollback Plan

If issues arise after cleanup:

1. **Restore from backup:** Re-upload images to Supabase Storage
2. **Update URLs:** Run SQL to restore original_url to image_url
3. **Disable R2:** Set `R2_ACCESS_KEY=""` in .env to use Supabase fallback

```sql
-- Emergency rollback (restore Supabase URLs)
UPDATE product_images 
SET image_url = original_url 
WHERE original_url IS NOT NULL AND original_url LIKE '%supabase.co%';

-- Reset verification flags
UPDATE product_images SET cdn_verified = false;
```

---

## Support

If you encounter issues:

1. Check backend logs for error messages
2. Verify R2 credentials are correct
3. Test CDN URL accessibility
4. Contact Cloudflare support for R2 issues

---

**Last Updated:** February 6, 2026  
**Author:** ORA Engineering Team
