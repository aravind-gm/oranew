# ✅ SUPABASE VERIFICATION CHECKLIST

**Status**: Run this after database setup  
**Purpose**: Verify all tables were created correctly

---

## 🔍 VERIFICATION STEPS

### Method 1: Supabase Dashboard (Easiest)

**Step 1: Log into Supabase**
- Go to [https://supabase.co/dashboard](https://supabase.co/dashboard)
- Click project "orashop" or your project name

**Step 2: View Database Tables**
- Left sidebar → Click "SQL Editor"
- Or: Left sidebar → Click "Table Editor"

**Step 3: Check Tables List**
You should see these 20 tables:

```
✅ users                    ✅ payment
✅ addresses                ✅ reviews
✅ categories               ✅ coupons
✅ products                 ✅ inventory_locks
✅ product_images           ✅ wishlists
✅ cart_items               ✅ notifications
✅ orders                   ✅ password_resets
✅ order_items              ✅ returns
✅ reason_categories        ✅ cron_jobs
✅ webhook_events           ✅ _prisma_migrations
```

**Step 4: Verify Table Structure**
- Click on "users" table
- Should see columns: id, email, password_hash, full_name, phone, role, is_verified, created_at, updated_at
- If columns are there, table is correct ✅

---

### Method 2: Prisma Studio (Visual Editor)

**Step 1: Open Terminal**
```bash
cd c:\Users\selvi\Downloads\orashop.in\oranew\backend
```

**Step 2: Start Prisma Studio**
```bash
npx prisma studio
```

**Step 3: Browser Opens**
- Automatically opens http://localhost:5555
- Shows all tables visually
- Can click each table to see structure

**Step 4: Verify Each Model**
- Click "User" → Should show user records (initially empty)
- Click "Product" → Should show products list (initially empty)
- Click "Category" → Should show categories (initially empty)
- All should work without errors

---

### Method 3: Command Line Query

**Step 1: Open Terminal**

**Step 2: Connect to Supabase**
```bash
psql "postgresql://postgres:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres"
```

**Step 3: List All Tables**
```sql
\dt
```

**Expected Output**:
```
           List of relations
 Schema |       Name        | Type  |  Owner
--------+-------------------+-------+----------
 public | _prisma_migrations| table | postgres
 public | addresses         | table | postgres
 public | cart_items        | table | postgres
 public | categories        | table | postgres
 public | coupons           | table | postgres
 public | cron_jobs         | table | postgres
 public | inventory_locks   | table | postgres
 public | notifications     | table | postgres
 public | order_items       | table | postgres
 public | orders            | table | postgres
 public | password_resets   | table | postgres
 public | payment           | table | postgres
 public | product_images    | table | postgres
 public | products          | table | postgres
 public | reason_categories | table | postgres
 public | returns           | table | postgres
 public | reviews           | table | postgres
 public | users             | table | postgres
 public | webhook_events    | table | postgres
 public | wishlists         | table | postgres
(20 rows)
```

**Step 4: Check Table Structure**
```sql
\d users
```

**Expected Output**:
```
                    Table "public.users"
        Column      |           Type           | Collation | Nullable | Default
--------------------+--------------------------+-----------+----------+--
 id                 | text                     |           | not null |
 email              | text                     |           | not null |
 password_hash      | text                     |           | not null |
 full_name          | text                     |           | not null |
 phone              | text                     |           |          |
 role               | users_role               |           | not null | 'CUSTOMER'::users_role
 is_verified        | boolean                  |           | not null | false
 created_at         | timestamp with time zone |           | not null | now()
 updated_at         | timestamp with time zone |           | not null |
Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
    "users_email_key" UNIQUE CONSTRAINT, btree (email)
```

**Step 5: Count Records**
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM orders;
```

**Expected Output** (initially):
```
 count
-------
     0
(1 row)
```

(All counts should be 0 initially, which is correct)

**Step 6: Exit**
```sql
\q
```

---

### Method 4: API Health Check

**Step 1: Start Backend**
```bash
cd backend
npm run dev
```

**Should see**:
```
✅ ORA Jewellery API Server Running
Port: 5000
Env: development
```

**Step 2: Test Health Endpoint**
```bash
curl http://localhost:5000/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-23T10:30:45.123Z"
}
```

**Step 3: Test Products Endpoint**
```bash
curl http://localhost:5000/api/products
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "products": [],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 0,
      "pages": 0
    }
  }
}
```

✅ If this works, database is connected!

---

## ✅ SUCCESS INDICATORS

### Database Is Working If You See:

1. ✅ 20 tables in Supabase dashboard
2. ✅ `\dt` shows all 20 tables with proper structure
3. ✅ `\d users` shows correct columns
4. ✅ Backend starts without "Database connection" errors
5. ✅ `/api/products` returns success with empty array
6. ✅ Prisma Studio opens and shows all models
7. ✅ Count queries return 0 (initially correct)

### Database Is NOT Working If You See:

1. ❌ Fewer than 20 tables in Supabase
2. ❌ `psql` command fails (connection refused)
3. ❌ Backend shows "cannot access database"
4. ❌ `/api/products` returns error
5. ❌ Prisma Studio shows "Error: Database connection"
6. ❌ Tables exist but have wrong columns

---

## 🔧 TROUBLESHOOTING

### Issue: "can't connect to database"

**Solution 1: Check Credentials**
```bash
# Verify .env file
cat backend/.env | grep DATABASE_URL
cat backend/.env | grep DIRECT_URL
# Both should have valid Supabase URLs
```

**Solution 2: Verify Supabase Project**
- Go to https://supabase.co/dashboard
- Check project status (should be "Active")
- Restart project if needed

**Solution 3: Check Network**
```bash
# Test connection
psql "postgresql://postgres:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres" -c "SELECT 1"
# Should return: 1
```

### Issue: "tables exist but wrong structure"

**Solution: Re-run Migration**
```bash
cd backend
npx prisma db push --skip-generate
# May show: ⚠️ Your database is out of sync
# Click "Yes" to update
```

### Issue: "too many connections"

**Solution: Use Pooled Connection**
This usually happens if using DATABASE_URL for migrations. Prisma automatically uses DIRECT_URL for migrations, so this shouldn't happen.

```bash
# Clear old connections
# Go to Supabase dashboard → Database → Connection Pooler
# Restart pooler
```

---

## 📊 TABLE RELATIONSHIP DIAGRAM

```
USERS
├── id (Primary Key)
├── email (Unique)
├── password_hash
├── role (ADMIN | STAFF | CUSTOMER)
│
├── Relationships:
│   ├── addresses (1 to many)
│   ├── cart_items (1 to many)
│   ├── orders (1 to many)
│   ├── reviews (1 to many)
│   ├── wishlists (1 to many)
│   ├── notifications (1 to many)
│   └── password_resets (1 to many)

CATEGORIES
├── id (Primary Key)
├── slug (Unique)
├── parent_id (Self-referencing for hierarchy)
│
├── Relationships:
│   └── products (1 to many)

PRODUCTS
├── id (Primary Key)
├── slug (Unique)
├── category_id → CATEGORIES
├── stock_quantity
│
├── Relationships:
│   ├── product_images (1 to many)
│   ├── cart_items (1 to many)
│   ├── order_items (1 to many)
│   ├── reviews (1 to many)
│   ├── inventory_locks (1 to many)
│   └── wishlists (1 to many)

ORDERS
├── id (Primary Key)
├── user_id → USERS
├── billing_address_id → ADDRESSES
├── shipping_address_id → ADDRESSES
│
├── Relationships:
│   ├── order_items (1 to many)
│   ├── payment (1 to 1)
│   └── returns (1 to many)
```

---

## 🎯 NEXT STEPS AFTER VERIFICATION

1. ✅ **Database Created**: All 20 tables exist
2. ✅ **Backend Connected**: Can query database
3. ⏭️ **Create Admin User**: Use admin signup endpoint
4. ⏭️ **Create Categories**: Use admin category creation
5. ⏭️ **Create Products**: Use admin product creation
6. ⏭️ **Test Full Flow**: Create order, process payment

---

## 📞 IF VERIFICATION FAILS

Run this and share the output:

```bash
cd backend

# Check Node.js
node --version

# Check Prisma
npx prisma --version

# Check connection
npx prisma db execute --stdin < test.sql
```

Create `test.sql`:
```sql
SELECT 1 as connection_test;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
```

---

## ✨ COMPLETION CHECKLIST

- [ ] 20 tables exist in Supabase
- [ ] Table structures are correct
- [ ] Backend starts without errors
- [ ] `/api/products` endpoint works
- [ ] Database returns empty results (initially correct)
- [ ] Prisma Studio opens
- [ ] No connection errors in console

**All checked?** ✅ Database setup complete! Ready for admin operations.

