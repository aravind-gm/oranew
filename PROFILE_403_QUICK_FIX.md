# ⚡ QUICK FIX: Copy-Paste Solution

## The Problem
```
GET https://hgejomvgldqnqzkgffoi.supabase.co/rest/v1/profiles?... 403 (Forbidden)
```

## The Solution (2 minutes)

### 1️⃣ Open Supabase Dashboard
- Go to your project
- Click **SQL Editor**

### 2️⃣ Copy-Paste This SQL
```sql
-- Drop old policies
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Users can select their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
ON profiles FOR DELETE
USING (auth.uid() = id);
```

### 3️⃣ Click "Run"

### 4️⃣ Test
- Clear browser cache (Ctrl+Shift+Del)
- Go to `/account`
- ✅ Should work now

---

## Why It Works
The old `FOR ALL` policy was too broad. The new policies are:
- **SELECT** → Read your profile ✅
- **INSERT** → Create your profile ✅
- **UPDATE** → Edit your profile ✅
- **DELETE** → Delete your profile ✅

Each handles its own operation correctly.

---

## If Still Not Working
1. Refresh page (Ctrl+Shift+R)
2. Log out and log in again
3. Clear browser storage (F12 → Application → Clear All)
