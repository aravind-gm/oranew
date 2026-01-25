# PHASE 1: SUPABASE SETUP - STEP-BY-STEP CHECKLIST
## Complete Supabase Configuration for Production

**Estimated Time:** 1-2 hours  
**Status:** Ready to Execute  
**Date:** January 25, 2026  

---

## 📋 PRE-REQUISITES

Before you start, make sure you have:

- [ ] Supabase account (https://supabase.com)
- [ ] Existing Supabase project OR permission to create new one
- [ ] Database already created with tables (products, categories, users, orders, etc.)
- [ ] Supabase SQL Editor access
- [ ] Text editor to copy-paste SQL

---

## 🎯 PHASE 1 OBJECTIVES

✅ Enable Row-Level Security (RLS) on all tables  
✅ Create security policies (public read, admin write)  
✅ Create performance indexes  
✅ Set up storage bucket for images  
✅ Verify all configurations  

---

## ⚙️ STEP-BY-STEP EXECUTION

### STEP 1: Access Supabase SQL Editor

```
1. Go to: https://app.supabase.com/dashboard
2. Select your project (ora-jewellery-prod)
3. Left sidebar > SQL Editor
4. You should see a blank editor
```

**Screenshot location:** Top-left shows project name

✅ **Verification:** SQL Editor is open and ready

---

### STEP 2: Copy & Paste RLS Policies SQL

```
1. Open file: SUPABASE_RLS_SETUP.sql (in your repo root)
2. Copy ALL content from that file
3. In Supabase SQL Editor, paste the entire content
4. Click "RUN" button (top-right, green play icon)
```

**Expected output:**
```
Query succeeded (no results)
Query succeeded (no results)
...multiple success messages...
```

✅ **Verification:** All RLS policies executed successfully

---

### STEP 3: Verify RLS is Enabled

Run this query to verify:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected output:**

| tablename | rowsecurity |
|-----------|------------|
| addresses | true |
| cart_items | true |
| categories | true |
| notifications | true |
| order_items | true |
| orders | true |
| password_resets | true |
| product_images | true |
| products | true |
| reviews | true |
| users | true |
| wishlists | true |

**All tables must show `rowsecurity = true`**

✅ **Verification:** RLS enabled on all tables

---

### STEP 4: Check RLS Policies on Products Table

Run this query:

```sql
SELECT tablename, policyname, action, definition
FROM pg_policies
WHERE tablename = 'products'
ORDER BY policyname;
```

**Expected output:**

| tablename | policyname | action |
|-----------|-----------|--------|
| products | admin_all_access | ALL |
| products | public_read_active_products | SELECT |

✅ **Verification:** Products policies exist

---

### STEP 5: Test Public Read Access

```sql
-- This query simulates public user (no auth)
SELECT id, name, final_price 
FROM products 
WHERE is_active = true 
LIMIT 5;
```

**Expected:** Returns 5 active products

✅ **Verification:** Public can read active products

---

### STEP 6: Create Storage Bucket via Dashboard

```
1. Left sidebar > Storage
2. Click "Create Bucket"
3. Name: product-images
4. ☐ UNCHECK "Private bucket" (make it public)
5. Click "Create bucket"
```

**Screenshot:** Shows "product-images" in bucket list

✅ **Verification:** Bucket created and public

---

### STEP 7: Test Storage Bucket

```
1. Click into "product-images" bucket
2. Click "Upload file"
3. Select any image from your computer
4. Click "Upload"
5. Right-click uploaded image > "Copy URL"
6. Paste in browser address bar
7. Image should display (not download)
```

**Expected URL format:**
```
https://[project].supabase.co/storage/v1/object/public/product-images/[filename]
```

✅ **Verification:** Storage bucket is publicly accessible

---

### STEP 8: Get Your Supabase Credentials

Go to **Settings > API** and copy:

```
SUPABASE_URL = "https://[PROJECT].supabase.co"
SUPABASE_ANON_KEY = "eyJhbGc..." (copy from "anon public key")
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGc..." (copy from "service_role")
```

**⚠️ Keep service_role key SECRET!**

✅ **Verification:** Credentials copied and saved

---

### STEP 9: Generate JWT_SECRET

Open terminal and run:

```bash
openssl rand -base64 32
```

**Example output:**
```
aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890+/=
```

Save this value as `JWT_SECRET`

✅ **Verification:** Strong random secret generated

---

### STEP 10: Create .env File for Backend

Create file: `backend/.env.production`

```env
# DATABASE
DATABASE_URL="postgresql://postgres.[PROJECT]:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:PASSWORD@db.[PROJECT].supabase.co:5432/postgres"

# SUPABASE
SUPABASE_URL="https://[PROJECT].supabase.co"
SUPABASE_ANON_KEY="[paste from step 8]"
SUPABASE_SERVICE_ROLE_KEY="[paste from step 8]"

# JWT
JWT_SECRET="[paste from step 9]"
JWT_EXPIRES_IN="7d"

# RAZORPAY
RAZORPAY_KEY_ID="rzp_live_[your_key]"
RAZORPAY_KEY_SECRET="[your_secret]"
RAZORPAY_WEBHOOK_SECRET="[webhook_secret]"

# FRONTEND
FRONTEND_URL="https://orashop.com"
ALLOWED_ORIGINS="https://orashop.com,https://www.orashop.com"

# SERVER
NODE_ENV="production"
PORT="3001"
```

✅ **Verification:** .env file created with all values

---

### STEP 11: Create .env for Frontend

Create file: `frontend/.env.production`

```env
NEXT_PUBLIC_API_URL="https://api.orashop.com"
NEXT_PUBLIC_RAZORPAY_KEY="rzp_live_[your_key]"
NEXT_PUBLIC_SITE_URL="https://orashop.com"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[paste from step 8]"
```

✅ **Verification:** Frontend .env created

---

### STEP 12: Run Database Migrations

```bash
cd backend

# Ensure Prisma is ready
npm install

# Generate Prisma client
npx prisma generate

# Run any pending migrations
npx prisma migrate deploy
```

**Expected output:**
```
✓ Migrations have been applied
```

**If no migrations to apply:**
```
No pending migrations to apply
```

✅ **Verification:** Database schema is current

---

### STEP 13: Verify Database Connection

```bash
cd backend

# Test connection locally
npx prisma db execute --stdin << 'EOF'
SELECT 
  'Database Connection: OK' as status,
  COUNT(*) as product_count
FROM products;
EOF
```

**Expected output:**
```
Database Connection: OK | 5
```

✅ **Verification:** Database connection works

---

### STEP 14: Create Verification Report

Run this SQL in Supabase to get final status:

```sql
-- Final Verification Report
SELECT 
  'RLS Enabled' as check_item,
  COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT 
  'Active Products',
  COUNT(*)
FROM products 
WHERE is_active = true
UNION ALL
SELECT 
  'Active Categories',
  COUNT(*)
FROM categories 
WHERE is_active = true
UNION ALL
SELECT 
  'Admin Users',
  COUNT(*)
FROM users 
WHERE role = 'ADMIN';
```

Save this output for your records.

✅ **Verification:** All checks complete

---

## ✅ PHASE 1 COMPLETION CHECKLIST

- [ ] RLS enabled on all tables
- [ ] Public read policies working
- [ ] Admin write policies working
- [ ] Performance indexes created
- [ ] Storage bucket created and public
- [ ] Test image uploadable and viewable
- [ ] SUPABASE_URL copied
- [ ] SUPABASE_ANON_KEY copied
- [ ] SUPABASE_SERVICE_ROLE_KEY copied
- [ ] JWT_SECRET generated
- [ ] backend/.env.production created
- [ ] frontend/.env.production created
- [ ] Database migrations applied
- [ ] Database connection verified
- [ ] Verification report generated

**Phase 1 Status:** ✅ COMPLETE when all items are checked

---

## 🚨 TROUBLESHOOTING

### Issue: "Permission denied" error when running SQL

**Solution:**
```
Make sure you're connected as the project owner
Left sidebar > Settings > Database
Verify connection status
```

### Issue: "Relations not found" error

**Solution:**
```
Run: npx prisma generate
Run: npx prisma migrate deploy
Then retry SQL queries
```

### Issue: Storage bucket won't accept files

**Solution:**
```
1. Click bucket name > Edit
2. Make sure "Private bucket" is UNCHECKED
3. Check CORS configuration
```

### Issue: RLS policies blocking legitimate requests

**Solution:**
```
In backend API, add admin token to request headers:
Authorization: Bearer [JWT_TOKEN]
```

---

## 📞 NEXT STEPS

Once Phase 1 is complete:

✅ **Next:** Move to [PHASE 2: Backend Deployment Setup](./PHASE_2_BACKEND_SETUP.md)

---

## 📝 COMPLETION SIGN-OFF

```
Phase 1: Supabase Setup - COMPLETE ✅

Completed on: [Date]
By: [Your Name]
Database: Connected ✓
RLS Policies: Enabled ✓
Storage: Configured ✓
Credentials: Saved ✓
Environment Files: Created ✓

Ready for Phase 2: Backend Deployment
```

---

**Phase 1 Status:** ✅ READY TO EXECUTE

Start now with Step 1!
