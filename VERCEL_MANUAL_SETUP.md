# ⚡ Vercel Manual Environment Variables Setup

Your Vercel deployment is failing because **4 environment variables are missing**. You must add them manually in the Vercel dashboard.

## 🔧 Quick Setup (2 minutes)

### Step 1: Open Vercel Dashboard
```
1. Go to: https://vercel.com/dashboard
2. Click your project: "oranew" or "orashop"
3. Go to: Settings → Environment Variables
```

### Step 2: Add These 4 Variables
Copy-paste each one exactly:

| Variable Name | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://oranew.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hgejomvgldqnqzkgffoi.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Get from: `backend/.env` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Get from: `backend/.env` → `RAZORPAY_KEY_ID` |

### Step 3: Deploy
```bash
cd /home/aravind/Downloads/oranew
vercel deploy --prod --force
```

---

## 📝 Where to Find Values

### NEXT_PUBLIC_SUPABASE_ANON_KEY
```bash
grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" backend/.env
```

### NEXT_PUBLIC_RAZORPAY_KEY_ID
```bash
grep "RAZORPAY_KEY_ID" backend/.env | head -1
```

---

## ✅ Verification

After deployment completes, check:
```bash
vercel env list
```

Should show all 4 variables as "Production".

Then redeploy:
```bash
vercel deploy --prod --force
```
