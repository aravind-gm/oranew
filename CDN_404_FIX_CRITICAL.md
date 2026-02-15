# CRITICAL: Product Images 404 - CDN Not Configured

## Issue
All product images returning 404:
```
Failed to load resource: https://cdn.orashop.in/products/hero.webp (404)
Failed to load resource: https://cdn.orashop.in/products/1769277395140-Screenshot-2026-01-21-232731.png (404)
```

## Root Cause
The custom domain `cdn.orashop.in` is configured in the code but **not properly connected to Cloudflare R2 bucket**. Two possible issues:

1. **R2 bucket doesn't have public access enabled**
2. **Custom domain `cdn.orashop.in` not connected to R2**

## Solutions (Choose One)

### Option A: Enable R2 Public Access with Default Domain ⚡ FASTEST

1. Go to **Cloudflare Dashboard** → R2 → `ora-images` bucket
2. Click **Settings** tab
3. Under **Public Access**, click **Enable**
4. Copy the generated public URL (format: `https://pub-<account-id>.r2.dev`)
5. Update environment variables in **3 places**:

**Backend (.env.production on Render):**
```bash
R2_PUBLIC_BASE_URL="https://pub-ff3f9d57917ee1bdfe19b56e3176ca6a.r2.dev"
```

**Frontend (.env.production on Vercel):**
```bash
NEXT_PUBLIC_CDN_URL="https://pub-ff3f9d57917ee1bdfe19b56e3176ca6a.r2.dev"
```

**Frontend (.env.local for local dev):**
```bash
NEXT_PUBLIC_CDN_URL="https://pub-ff3f9d57917ee1bdfe19b56e3176ca6a.r2.dev"
```

6. Redeploy both frontend and backend
7. **Update database** (images already have `cdn.orashop.in` hardcoded):
   ```sql
   -- Run in Supabase SQL Editor
   UPDATE products 
   SET images = REPLACE(images::text, 'cdn.orashop.in', 'pub-ff3f9d57917ee1bdfe19b56e3176ca6a.r2.dev')::jsonb;
   
   UPDATE banners 
   SET "imageUrl" = REPLACE("imageUrl", 'cdn.orashop.in', 'pub-ff3f9d57917ee1bdfe19b56e3176ca6a.r2.dev')
   WHERE "imageUrl" LIKE '%cdn.orashop.in%';
   ```

**Pros:** Fast, free, works immediately  
**Cons:** Ugly URL, not branded

---

### Option B: Connect Custom Domain to R2 🎨 RECOMMENDED

1. **Enable R2 Public Access First:**
   - Cloudflare Dashboard → R2 → `ora-images` → Settings → Enable Public Access

2. **Add Custom Domain:**
   - In R2 bucket settings, click **Connect Domain**
   - Enter: `cdn.orashop.in`
   - Cloudflare will show DNS instructions

3. **Update DNS Records:**
   - Go to Cloudflare DNS settings for `orashop.in`
   - Add CNAME record:
     ```
     Type: CNAME
     Name: cdn
     Target: <R2-bucket-public-url> (from step 1)
     Proxy: Yes (orange cloud)
     ```

4. **Wait for DNS Propagation** (1-5 minutes)

5. **Test CDN:**
   ```bash
   curl -I https://cdn.orashop.in/products/hero.webp
   # Should return 200 OK instead of 404
   ```

6. No database changes needed - images already use `cdn.orashop.in`

**Pros:** Branded URL, professional, no DB changes  
**Cons:** Requires DNS access, takes a few minutes

---

## Quick Test After Fix

```bash
# Should return 200 OK and image content
curl -I https://cdn.orashop.in/products/hero.webp

# Or test with browser DevTools:
# Open https://orashop.vercel.app → Network tab → Images should load without 404
```

## Environment Variables Summary

Files updated in this session:
- ✅ `frontend/.env.local` - Added `NEXT_PUBLIC_CDN_URL`
- ✅ `frontend/.env.production` - Added `NEXT_PUBLIC_CDN_URL`
- ⚠️ `backend/.env.production` - Already has `R2_PUBLIC_BASE_URL`

**You need to:**
1. Choose Option A or B above
2. Update environment variables in **Vercel** (frontend) and **Render** (backend)
3. Redeploy both services

---

## Related Issue: Checkout Timeout

The screenshot shows:
```
timeout of 10000ms exceeded
```

This is likely caused by the backend trying to verify product images during checkout and timing out because CDN is unreachable. **Fixing the CDN will likely fix the checkout timeout too.**

---

**Priority:** P0 - CRITICAL (blocks all product pages, checkout, and image uploads)  
**Time to Fix:** 5-10 minutes (Option A) or 10-20 minutes (Option B)  
**Next Action:** Choose Option A for immediate fix, then migrate to Option B for production
