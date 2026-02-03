# 🚨 URGENT: Fix Profile 403 Forbidden Error - RLS Policy Issue

## Problem
Users are getting a **403 Forbidden** error when accessing `/account` page:
```
GET https://hgejomvgldqnqzkgffoi.supabase.co/rest/v1/profiles?select=*&id=eq.5495441b-4030-4477-8a4d-c30f0796aeb0 403 (Forbidden)
```

This means **Row Level Security (RLS) policies are blocking profile access**.

---

## Root Cause
The RLS policy in the migration file `20260201_create_profiles_table.sql` uses an overly restrictive approach:
- The old `FOR ALL` policy was combining SELECT with other operations
- This can cause authentication context issues

---

## Solution: Update RLS Policies

### Step 1: Check Current RLS Status in Supabase Dashboard
1. Go to **Supabase Dashboard**
2. Click your project
3. Navigate to **SQL Editor**
4. Run this to see current policies:
```sql
SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'profiles';
```

### Step 2: Drop Old Policies (if they exist)
In Supabase SQL Editor, run:
```sql
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
```

### Step 3: Create New RLS Policies
Run this SQL in Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT (read) their own profile
CREATE POLICY "Users can select their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can INSERT their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can UPDATE their own profile
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Users can DELETE their own profile
CREATE POLICY "Users can delete their own profile"
ON profiles
FOR DELETE
USING (auth.uid() = id);
```

### Step 4: Verify Policies are Active
Run this query:
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;
```

You should see 4 policies:
- ✅ Users can select their own profile (SELECT)
- ✅ Users can insert their own profile (INSERT)
- ✅ Users can update their own profile (UPDATE)
- ✅ Users can delete their own profile (DELETE)

---

## Testing

### Test 1: Direct Supabase Query
In your browser console:
```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .single();

console.log(data, error);
```
Should return your profile without error (not 403).

### Test 2: Account Page
Navigate to `/account` - should work now without 403 error.

### Test 3: Profile Completion
If redirected to `/auth/complete-profile`:
1. Fill in your full name and phone
2. Click "Save"
3. Should redirect to `/account` successfully

---

## Why This Works

**Old Policy (❌ Problematic)**:
```sql
CREATE POLICY "Users can manage their own profile"
ON profiles
FOR ALL  -- ❌ Too broad, includes SELECT with UPDATE/DELETE logic
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

Issues:
- `FOR ALL` applies single logic to SELECT, INSERT, UPDATE, DELETE
- `WITH CHECK` only applies to INSERT/UPDATE/DELETE, not SELECT
- Can cause confusion in auth context

**New Policies (✅ Correct)**:
- Separate policy for **SELECT** (read-only) - just needs `USING` clause
- Separate policy for **INSERT** (create) - needs `WITH CHECK`
- Separate policy for **UPDATE** (modify) - needs both `USING` and `WITH CHECK`
- Separate policy for **DELETE** (remove) - just needs `USING` clause

This is **more explicit and less error-prone**.

---

## File Updated
✅ Backend migration file updated: `backend/prisma/migrations/20260201_create_profiles_table.sql`

If you haven't run migrations yet, the new SQL will be used automatically.
If you already ran migrations, manually apply the SQL above in Supabase Dashboard.

---

## Quick Checklist

- [ ] 1. Go to Supabase SQL Editor
- [ ] 2. Drop old policies (copy/paste Step 2 SQL)
- [ ] 3. Create new policies (copy/paste Step 3 SQL)
- [ ] 4. Verify with query from Step 4
- [ ] 5. Test account page access
- [ ] 6. Test profile completion flow

**Time to fix: ~5 minutes**
