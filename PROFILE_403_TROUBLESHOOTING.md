# 🔍 Troubleshooting: If RLS Policies Don't Seem to Work

## Common Issues & Solutions

### Issue 1: "Table does not exist" Error
**Error**: `Table "profiles" does not exist`

**Solution**:
1. Check if table is in `public` schema:
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'profiles';
```

2. If not found, create it:
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
```

Then apply RLS policies.

---

### Issue 2: "Policy Already Exists" Error
**Error**: `CREATE POLICY ... already exists`

**Solution**: Run these DROP statements first:
```sql
DROP POLICY IF EXISTS "Users can select their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
```

Then create new policies.

---

### Issue 3: Still Getting 403 After Policies
**Symptoms**:
- Policies are created ✅
- But still getting 403 error

**Debugging Steps**:

1. **Check RLS is enabled**:
```sql
SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles';
```
Should return `true`.

2. **Check user exists in auth.users**:
```sql
SELECT id, email FROM auth.users LIMIT 5;
```

3. **Check session context**:
In browser console:
```javascript
const { data } = await supabase.auth.getSession();
console.log('Current user ID:', data.session.user.id);
```

4. **Test direct query**:
```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', '5495441b-4030-4477-8a4d-c30f0796aeb0')
  .single();

console.log('Data:', data);
console.log('Error:', error);
```

---

### Issue 4: Can Insert But Can't Select
**Symptoms**:
- Can create profile (POST works)
- Can't read profile (GET returns 403)

**Cause**: SELECT policy might be missing

**Solution**:
```sql
-- Check SELECT policy exists
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'SELECT';

-- If missing, create it:
CREATE POLICY "Users can select their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);
```

---

### Issue 5: Profile Table Gets 403 But Other Tables Work
**Symptoms**:
- Can read from `products`, `orders`, etc.
- But `profiles` table always returns 403

**Possible Causes**:
1. RLS enabled on profiles but no SELECT policy
2. SELECT policy has wrong condition
3. User auth context not being passed

**Debug**:
```sql
-- Check all policies on profiles
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';

-- Check if RLS blocking everything
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Then test - if works, RLS was the problem
-- Re-enable and fix policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

---

### Issue 6: Fresh Login Still Shows 403
**Symptoms**:
- Just logged in
- New session token
- Still getting 403

**Cause**: Session might not be recognized yet

**Solution**:
1. Force hard refresh:
```javascript
// In browser console
window.location.href = '/account?t=' + Date.now();
```

2. Or wait a moment and try again:
```javascript
setTimeout(() => {
  window.location.reload();
}, 2000);
```

3. Check browser storage is cleared (F12 → Application → Clear All)

---

### Issue 7: Working in One Browser But Not Another
**Symptoms**:
- Works on Chrome
- Doesn't work on Firefox
- Or works on incognito but not regular

**Cause**: Browser cache or stored session issues

**Solution**:
1. Clear all site data for your domain:
   - F12 → Application → Storage → Clear Site Data
2. Hard refresh: Ctrl+Shift+R
3. Log out and log in again

---

## Quick Verification Checklist

Run this SQL to verify everything is correct:

```sql
-- 1. Table exists
SELECT 'Table Exists' as check, COUNT(*) as result 
FROM information_schema.tables 
WHERE table_name = 'profiles';

-- 2. RLS enabled
SELECT 'RLS Enabled' as check, relrowsecurity as result 
FROM pg_class WHERE relname = 'profiles';

-- 3. Policies exist and are correct
SELECT 'SELECT Policy' as check, policyname 
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'SELECT'
UNION ALL
SELECT 'INSERT Policy', policyname 
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'INSERT'
UNION ALL
SELECT 'UPDATE Policy', policyname 
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'UPDATE'
UNION ALL
SELECT 'DELETE Policy', policyname 
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'DELETE';

-- 4. Check users exist
SELECT 'Users Count' as check, COUNT(*) as result FROM auth.users;

-- 5. Check profiles records
SELECT 'Profiles Count' as check, COUNT(*) as result FROM profiles;
```

Expected Results:
- ✅ Table Exists: 1
- ✅ RLS Enabled: true
- ✅ 4 Policies (SELECT, INSERT, UPDATE, DELETE)
- ✅ Users Count: > 0
- ✅ Profiles Count: > 0

---

## Still Stuck?

1. Take a screenshot of the error
2. Check Supabase Dashboard → Logs for detailed error
3. Try the migration file approach instead:
   - Run: `npx prisma migrate deploy`
   - This will apply all pending migrations
