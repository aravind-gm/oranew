# R2 Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Create Cloudflare R2 Bucket

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **R2** in the sidebar
3. Click **Create bucket**
4. Name: `ora-images`
5. Click **Create bucket**

### Step 2: Create API Token

1. In R2, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Configure:
   - Token name: `ORA Backend`
   - Permissions: **Object Read & Write**
   - Bucket: `ora-images`
4. Click **Create API Token**
5. **COPY AND SAVE** the Access Key ID and Secret Access Key (shown only once!)

### Step 3: Enable Public Access

Option A: R2.dev Subdomain (Quick)
1. Go to bucket settings
2. Enable "R2.dev subdomain"
3. Copy the URL (e.g., `https://pub-xxx.r2.dev`)

Option B: Custom Domain (Production)
1. Go to bucket settings
2. Click "Connect domain"
3. Enter: `cdn.orashop.in`
4. Add the CNAME record to your DNS

### Step 4: Configure Backend

Add to `backend/.env`:

```env
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY="your-access-key-id"
R2_SECRET_KEY="your-secret-access-key"
R2_BUCKET="ora-images"
R2_PUBLIC_BASE_URL="https://cdn.orashop.in"
```

> 📍 Find your Account ID in the Cloudflare Dashboard URL: `https://dash.cloudflare.com/ACCOUNT_ID/r2`

### Step 5: Configure Frontend

Add to `frontend/.env.local`:

```env
NEXT_PUBLIC_CDN_URL="https://cdn.orashop.in"
```

### Step 6: Install Dependencies

```bash
cd backend
npm install
```

### Step 7: Run Migrations

```bash
cd backend
npx prisma migrate dev --name r2_cdn_migration
```

### Step 8: Test Upload

```bash
# Start backend
cd backend
npm run dev

# Test R2 health (in another terminal)
curl http://localhost:8000/api/r2/health \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "configured": true,
  "connected": true,
  "message": "R2 storage is healthy"
}
```

### Step 9: Migrate Existing Images (Optional)

If you have existing images in Supabase Storage:

```bash
# Dry run first
npm run migrate:r2:dry

# Actual migration
npm run migrate:r2

# Verify
npm run migrate:r2:verify
```

---

## ✅ Verification Checklist

- [ ] R2 bucket created
- [ ] API token generated
- [ ] Public access enabled
- [ ] Backend .env configured
- [ ] Frontend .env.local configured
- [ ] Dependencies installed
- [ ] Prisma migrations applied
- [ ] Health check passes
- [ ] Test upload works

---

## 🔧 Troubleshooting

### "R2 storage is not configured"
- Check all R2 environment variables are set
- Restart the backend server

### "Access Denied" on upload
- Verify API token has write permissions
- Check bucket name matches R2_BUCKET

### Images not loading on frontend
- Verify NEXT_PUBLIC_CDN_URL is correct
- Check if R2.dev subdomain or custom domain is enabled

### CORS errors
- R2 handles CORS automatically for public buckets
- If using custom domain, verify Cloudflare proxy is enabled

---

## 📚 More Resources

- [Full Documentation](./R2_CDN_IMPLEMENTATION.md)
- [Migration Guide](./R2_CDN_IMPLEMENTATION.md#migration-guide)
- [API Reference](./R2_CDN_IMPLEMENTATION.md#api-reference)
- [Cleanup Checklist](./SUPABASE_STORAGE_CLEANUP_CHECKLIST.md)
