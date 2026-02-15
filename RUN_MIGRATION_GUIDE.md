# Run Database Migration via Supabase

## ⭐ Best Option: Supabase Web SQL Editor (Easiest & Most Reliable)

This is the **fastest and safest way** to run the migration without authentication issues.

### Steps:

1. **Open Supabase Dashboard:**
   - Go to: https://app.supabase.com/
   - Login to your account
   - Select your project

2. **Navigate to SQL Editor:**
   - Click **SQL Editor** in left sidebar
   - Click **+ New Query** button

3. **Copy the Migration SQL:**
   
   Paste this entire SQL block:

```sql
-- Add gift collections and occasions to products
-- Migration: add_gift_collections_occasions

ALTER TABLE "products" 
  ADD COLUMN IF NOT EXISTS "collections" TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "occasions" TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "is_featured_gift" BOOLEAN DEFAULT false;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "products_collections_idx" ON "products" USING GIN ("collections");
CREATE INDEX IF NOT EXISTS "products_occasions_idx" ON "products" USING GIN ("occasions");
CREATE INDEX IF NOT EXISTS "products_is_featured_gift_idx" ON "products"("is_featured_gift") WHERE "is_featured_gift" = true;

-- Add comments
COMMENT ON COLUMN "products"."collections" IS 'Gift collections this product belongs to, e.g., ["gifts-for-her", "valentine-special"]';
COMMENT ON COLUMN "products"."occasions" IS 'Occasions this product is suitable for, e.g., ["birthday", "anniversary", "valentine"]';
COMMENT ON COLUMN "products"."is_featured_gift" IS 'Whether this product is featured in Gifts For Her page';
```

4. **Run the Query:**
   - Click **RUN** button (or press `Ctrl+Enter`)
   - Wait for success message ✅

5. **Verify It Worked:**
   
   Create a new query and paste:
   
```sql
-- Check if columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('collections', 'occasions', 'is_featured_gift')
ORDER BY ordinal_position;
```

   You should see 3 rows with:
   - `collections` → `text[]`
   - `occasions` → `text[]`
   - `is_featured_gift` → `boolean`

---

## Alternative: Using Node.js Script (If Web UI doesn't work)

If you prefer CLI, use Node.js with your connection string:

```bash
npm install pg
```

Create `migrate.js`:

```javascript
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://postgres.hgejomvgldqnqzkgffoi:9EtOmJae6YyUxXx2@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres?sslmode=require'
});

const sql = fs.readFileSync('backend/migrations/add_gift_collections.sql', 'utf8');

pool.query(sql, (err, res) => {
  if (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Migration completed successfully!');
  pool.end();
});
```

Run:
```bash
node migrate.js
```

---

## Alternative: Using PgBouncer Connection (Application Connection)

---

## What the Migration Adds

```
Column Name        | Type      | Default | Purpose
─────────────────────────────────────────────────────────
collections        | text[]    | {}      | Gift collections ["gifts-for-her", ...]
occasions          | text[]    | {}      | Occasions ["birthday", "anniversary", ...]
is_featured_gift   | boolean   | false   | Featured in showcase section
```

---

## After Migration: Next Steps

1. ✅ Run migration (above)
2. 🔄 Restart backend: `npm run build && npm run dev`
3. 🎁 Tag products in admin panel: `/admin/v2/products`
4. 👀 View page: `/collections/gifts-for-her`

---

**Recommended: Use Supabase SQL Editor for fastest results!** 🚀
