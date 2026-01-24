# 🔧 SUPABASE DATABASE SETUP - CREATE TABLES GUIDE

**Issue**: Supabase account has no tables  
**Solution**: Run Prisma migrations to create all required tables  
**Status**: Ready to implement

---

## 📋 REQUIRED TABLES

Based on your Prisma schema, you need these 20 tables:

1. **users** - Customer & admin accounts
2. **addresses** - Shipping/billing addresses
3. **categories** - Product categories (with hierarchy)
4. **products** - Product catalog
5. **product_images** - Product images (URLs)
6. **cart_items** - Shopping cart items
7. **orders** - Customer orders
8. **order_items** - Items in each order
9. **payments** - Payment records
10. **reviews** - Product reviews
11. **coupons** - Discount codes
12. **inventory_locks** - Reserved inventory
13. **wishlists** - Saved products
14. **notifications** - User notifications
15. **password_resets** - Password reset tokens
16. **returns** - Order returns
17. **reason_categories** - Return reason types
18. **cron_jobs** - Scheduled jobs
19. **webhook_events** - Payment webhook logs
20. **migrations** - Prisma migration history

---

## ⚡ QUICK FIX (2 STEPS)

### Step 1: Navigate to Backend Directory
```bash
cd c:\Users\selvi\Downloads\orashop.in\oranew\backend
```

### Step 2: Run Migration
```bash
# This will create all tables in Supabase automatically
npx prisma db push
```

**What happens**:
- Connects to Supabase using DIRECT_URL from .env
- Creates all tables from schema.prisma
- Creates relationships and constraints
- Takes 30-60 seconds

**Expected output**:
```
✅ Database synced successfully
✨ Tables created:
  - users
  - addresses
  - categories
  - products
  - product_images
  - ... (18 more tables)
```

---

## 📊 VERIFY TABLES WERE CREATED

After running `npx prisma db push`, verify:

### Option 1: Check Supabase Dashboard
1. Go to [supabase.co](https://supabase.co)
2. Log in with your account
3. Click project "orashop"
4. Click "SQL Editor" in sidebar
5. You should see all 20 tables listed

### Option 2: Query Tables via psql
```bash
# Connect to Supabase PostgreSQL
psql "postgresql://postgres:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres"

# List all tables
\dt

# Check users table structure
\d users

# Count records
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
```

### Option 3: Check via Prisma Studio
```bash
npx prisma studio
```
- Opens browser UI at http://localhost:5555
- Shows all tables and data
- Can view/edit records visually

---

## 🎯 IF MIGRATION FAILS

### Error: "Cannot access database"
**Reason**: Connection string is wrong or database is down  
**Fix**:
```bash
# Verify connection string
echo $DIRECT_URL
# Should output: postgresql://postgres:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres

# Test connection with psql
psql $DIRECT_URL -c "SELECT 1"
# Should return: 1
```

### Error: "User does not have permission"
**Reason**: Supabase user account doesn't have admin rights  
**Fix**:
1. Go to Supabase dashboard
2. Click "Database" → "Users"
3. Find "postgres" user
4. Ensure role is "postgres" or "superuser"
5. Try migration again

### Error: "Relation already exists"
**Reason**: Tables already partially created  
**Fix**:
```bash
# DESTRUCTIVE - Resets database (use only if safe!)
npx prisma migrate reset --force

# Then create fresh:
npx prisma db push
```

---

## 📝 WHAT EACH TABLE DOES

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| **users** | User accounts | id, email, passwordHash, role (ADMIN/STAFF/CUSTOMER) |
| **addresses** | Shipping addresses | userId, addressLine1, city, state, pincode |
| **categories** | Product categories | id, name, slug, parentId (for subcategories) |
| **products** | Product catalog | id, name, price, finalPrice, stockQuantity |
| **product_images** | Product images | productId, url, isPrimary |
| **cart_items** | Shopping cart | userId, productId, quantity |
| **orders** | Customer orders | id, userId, totalAmount, status |
| **order_items** | Items in orders | orderId, productId, quantity, price |
| **payments** | Payment records | id, orderId, razorpayId, amount, status |
| **reviews** | Product reviews | id, productId, userId, rating, comment |
| **coupons** | Discount codes | id, code, discountPercent, maxUses |
| **inventory_locks** | Reserved stock | id, productId, quantity, expiresAt |
| **wishlists** | Saved products | userId, productId |
| **notifications** | Alerts | userId, type, message, read |
| **password_resets** | Reset tokens | userId, token, expiresAt |
| **returns** | Return requests | id, orderId, reason, status |
| **reason_categories** | Return reasons | id, name, description |
| **cron_jobs** | Scheduled tasks | id, name, lastRun, nextRun |
| **webhook_events** | Payment logs | id, event, payload, processed |
| **migrations** | Migration history | id, name, executedAt (Auto-created by Prisma) |

---

## 🔐 AFTER TABLES ARE CREATED

### Step 1: Verify Connection in Backend
```bash
# Start backend server
npm run dev

# Should NOT show database connection errors
# Should show: ✅ "ORA Jewellery API Server Running"
```

### Step 2: Test API
```bash
# Test connection
curl http://localhost:5000/health
# Should return: { "status": "ok" }

# Test products endpoint
curl http://localhost:5000/api/products
# Should return: { "success": true, "data": { "products": [], ... } }
```

### Step 3: Create Sample Data
You can now:
1. Create admin account via `/api/auth/signup` or `/api/auth/register`
2. Upload images via `/api/upload/images`
3. Create products via admin panel `/admin/products/new`
4. Create categories via admin panel `/admin/categories`

---

## 🔄 PRISMA COMMANDS REFERENCE

| Command | Purpose |
|---------|---------|
| `npx prisma db push` | Create/update tables (recommended) |
| `npx prisma migrate dev` | Create migration file (for team) |
| `npx prisma studio` | Visual database editor |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma validate` | Check schema syntax |
| `npx prisma format` | Format schema.prisma file |

---

## ✅ STEP-BY-STEP SETUP

### 1. Open Terminal/Command Prompt
```bash
# Navigate to project
cd c:\Users\selvi\Downloads\orashop.in\oranew

# Go to backend
cd backend
```

### 2. Verify Environment
```bash
# Check .env file has database credentials
cat .env | grep DATABASE_URL
cat .env | grep DIRECT_URL

# Both should show Supabase URLs
```

### 3. Create Tables
```bash
# Run Prisma migration
npx prisma db push

# Wait for completion (should see checkmarks)
# ✅ Database synced successfully
```

### 4. Verify Tables
```bash
# Open Prisma Studio
npx prisma studio

# Browser opens at http://localhost:5555
# Inspect all tables
# Verify structure matches schema
```

### 5. Start Backend
```bash
# Open new terminal
npm run dev

# Should start without errors
```

### 6. Test in Browser
```
Go to: http://localhost:5000/api/products
Should see: { "success": true, "data": { "products": [], "pagination": {...} } }
```

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue: "ECONNREFUSED" or "Connection timeout"
**Cause**: Supabase database is offline or credentials are wrong  
**Solution**:
```bash
# Verify credentials in .env are correct
# Test directly with psql
psql "postgresql://postgres:PASSWORD@HOST:5432/postgres"

# Check Supabase dashboard to ensure project is active
```

### Issue: "Table already exists"
**Cause**: Tables were partially created  
**Solution**:
```bash
# Check what tables exist
npx prisma db push --skip-generate

# Or reset entire database (DESTRUCTIVE!)
npx prisma migrate reset --force
```

### Issue: "No database selected"
**Cause**: Using pooled connection (DATABASE_URL) instead of direct (DIRECT_URL)  
**Solution**:
```bash
# Ensure .env has BOTH:
DATABASE_URL="postgresql://...?pgbouncer=true"    # For app
DIRECT_URL="postgresql://..."                      # For migrations

# prisma db push automatically uses DIRECT_URL
```

### Issue: Migration appears stuck
**Cause**: Large schema takes time, or network is slow  
**Solution**:
```bash
# Wait 2-3 minutes (migration can take time)
# If still stuck, Ctrl+C to cancel
# Check Supabase dashboard to see what tables exist
# Run again to continue from where it stopped
```

---

## 📊 DATABASE ARCHITECTURE

```
┌─────────────┐
│   Users     │
├─────────────┤
│ id (PK)     │
│ email (UK)  │
│ password    │
│ role        │
└──────┬──────┘
       │
       ├─→ Addresses
       ├─→ CartItems
       ├─→ Orders
       ├─→ Reviews
       ├─→ Wishlists
       └─→ Notifications

┌─────────────┐
│ Categories  │
├─────────────┤
│ id (PK)     │
│ slug (UK)   │
│ parentId    │ (Self-referencing for hierarchy)
└──────┬──────┘
       │
       └─→ Products

┌──────────────┐
│  Products    │
├──────────────┤
│ id (PK)      │
│ slug (UK)    │
│ categoryId   │ → Categories
│ stockQty     │
└──────┬───────┘
       │
       ├─→ ProductImages
       ├─→ CartItems
       ├─→ OrderItems
       ├─→ Reviews
       ├─→ InventoryLocks
       └─→ Wishlists

┌──────────────┐
│   Orders     │
├──────────────┤
│ id (PK)      │
│ userId       │ → Users
│ totalAmount  │
└──────┬───────┘
       │
       ├─→ OrderItems (→ Products)
       └─→ Payments

```

---

## ✨ AFTER SUCCESSFUL SETUP

You'll be able to:
1. ✅ Upload products with images
2. ✅ Manage categories
3. ✅ Create orders
4. ✅ Process payments
5. ✅ Handle returns
6. ✅ Manage inventory
7. ✅ Track reviews
8. ✅ Send notifications

---

## 🎯 SUMMARY

**Current Status**: ❌ No tables in Supabase  
**Required Action**: Run `npx prisma db push`  
**Expected Result**: ✅ 20 tables created  
**Time Required**: 2-5 minutes  
**Breaking Changes**: None  

---

## 📞 IF YOU NEED HELP

After running the migration:

1. **Check if tables exist**:
   ```bash
   npx prisma studio
   ```

2. **Check if backend connects**:
   ```bash
   npm run dev
   # Should say: ✅ ORA Jewellery API Server Running
   ```

3. **Check if you can query**:
   ```bash
   curl http://localhost:5000/api/products
   # Should return JSON with products array
   ```

If any of these fail, run this command and share output:
```bash
cd backend && npx prisma db push --skip-generate 2>&1 | tee migration_output.txt
```

---

**Next Step**: Run the migration command above and let me know if you see ✅ success or ❌ error
