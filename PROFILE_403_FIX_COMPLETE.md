# ✅ Complete Fix: Profile 403 Forbidden Error

## 📋 Summary
User gets **403 Forbidden** when trying to access `/account` page because RLS policy blocks profile query.

**Root Cause**: RLS policies were using `FOR ALL` which caused auth context issues. Updated to use separate policies for SELECT, INSERT, UPDATE, DELETE.

---

## 🔧 Step-by-Step Fix

### Step 1: Access Supabase Dashboard
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project (orashop)
3. Go to **SQL Editor** (left sidebar)

### Step 2: Check Current Policies
Paste this query to see what policies exist:

```sql
SELECT schemaname, tablename, policyname, cmd FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;
```

**Click "Run"** and check results.

### Step 3: Clear Old Policies
If you see any of these, copy this and run it:

```sql
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can select their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
```

### Step 4: Create New Optimized Policies
Copy the entire block below and paste into SQL Editor:

```sql
-- Enable Row Level Security (should already be enabled)
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

**Click "Run"** - should complete without errors.

### Step 5: Verify Policies
Run this to confirm all 4 policies are active:

```sql
SELECT 
  policyname,
  cmd,
  qual as "using_clause",
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
```

Expected output:
```
✅ Users can delete their own profile   | DELETE | ...
✅ Users can insert their own profile   | INSERT | ...
✅ Users can select their own profile   | SELECT | ...
✅ Users can update their own profile   | UPDATE | ...
```

---

## 🧪 Test the Fix

### Test 1: Browser Console Test
1. Go to your app
2. Open **Developer Tools** (F12)
3. Go to **Console** tab
4. Paste this:

```javascript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .single();

console.log('Profile Data:', data);
console.log('Error:', error);
```

Expected: Should see your profile data (not 403 error)

### Test 2: Account Page
1. Open your app
2. Navigate to `/account`
3. Should load successfully (not redirect to `/auth/complete-profile`)

### Test 3: Profile Completion
1. If redirected to `/auth/complete-profile`:
   - Fill in Full Name: "John Doe"
   - Fill in Phone: "9876543210"
   - Click "Save"
2. Should redirect to `/account` without errors

---

## 📁 Files Updated

### Migration File
**Path**: `backend/prisma/migrations/20260201_create_profiles_table.sql`

**Changes**:
- ✅ Split `FOR ALL` into separate SELECT, INSERT, UPDATE, DELETE policies
- ✅ Added DROP POLICY IF EXISTS for idempotency
- ✅ More explicit and less error-prone approach

### Code (No Changes Needed)
Frontend code is correct - the issue was purely database RLS configuration.

---

## 🎯 Why This Works

| Aspect | Old Approach | New Approach |
|--------|-------------|--------------|
| **SELECT** | ❌ Handled by `FOR ALL` with `WITH CHECK` | ✅ Dedicated SELECT policy with `USING` |
| **INSERT** | ✅ Separate `FOR INSERT` policy | ✅ Dedicated INSERT policy |
| **UPDATE** | ❌ Handled by `FOR ALL` | ✅ Dedicated UPDATE policy |
| **DELETE** | ❌ Handled by `FOR ALL` | ✅ Dedicated DELETE policy |
| **Auth Context** | 🤔 Can be ambiguous | ✅ Clear and explicit |
| **Maintenance** | 🤔 Hard to debug | ✅ Easy to troubleshoot |

---

## ⚠️ If Still Getting 403

Try these:

1. **Check Session Persistence**
   - Go to `/auth/login` and log in again
   - Force refresh after login (Ctrl+Shift+R)

2. **Clear Browser Storage**
   - Open DevTools → Application
   - Clear LocalStorage and SessionStorage
   - Refresh page

3. **Verify Table Exists**
   In SQL Editor, run:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'profiles';
   ```
   Should return 1 row.

4. **Check RLS is Enabled**
   ```sql
   SELECT relrowsecurity FROM pg_class 
   WHERE relname = 'profiles';
   ```
   Should return `true`.

5. **Check User Record**
   ```sql
   SELECT id FROM auth.users 
   WHERE email = 'your-email@example.com';
   ```
   Should return your user ID.

---

## 📞 Need Help?

If issue persists:
1. Screenshot the error from browser DevTools
2. Share the user email
3. Share the error message from SQL Editor (if any)
4. Check database logs in Supabase Dashboard → Logs

---

## ✅ Completion Checklist

- [ ] Accessed Supabase Dashboard
- [ ] Checked current policies (Step 2)
- [ ] Dropped old policies (Step 3)
- [ ] Created new policies (Step 4)
- [ ] Verified 4 policies exist (Step 5)
- [ ] Tested account page access
- [ ] Tested profile completion flow
- [ ] All working ✅

**Time to Complete: 5-10 minutes**
