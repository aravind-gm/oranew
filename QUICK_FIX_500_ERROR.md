# 🔧 QUICK FIX - 500 ERROR RESOLUTION

## The Problem
- **Error:** `GET /api/categories 500` and `GET /api/products 500`
- **Cause:** Backend cannot connect to Supabase database
- **Message:** `Can't reach database server at 'aws-1-ap-south-1.pooler.supabase.com:6543'`

---

## Immediate Actions (Try in Order)

### 1️⃣ CHECK SUPABASE STATUS (2 min)
```
1. Open: https://app.supabase.com/
2. Select project: hgejomvgldqnqzkgffoi
3. Go to: Settings → Database
4. Look for:
   - Database status = "Running" (not "Paused")
   - No error messages in Activity tab
5. If paused: Click "Resume"
6. If stuck: Try restarting the service
```

### 2️⃣ RESTART CONNECTION POOLER (2 min)
```
1. In Supabase: Settings → Database → Connection pooler
2. Click Toggle OFF, wait 10 seconds
3. Click Toggle ON, wait 30 seconds
4. Test: curl https://oranew-backend.onrender.com/health/detailed
5. If still failing, proceed to step 3
```

### 3️⃣ CHECK IP WHITELIST (3 min)
```
1. In Supabase: Settings → Security → IP Whitelist
2. If enabled:
   - Add: 0.0.0.0/0 (temporary, for testing)
   - Or get Render's IP and add it
3. Save and test again
```

### 4️⃣ REDEPLOY BACKEND (3 min)
```
1. Go to: https://dashboard.render.com/
2. Find: oranew-backend
3. Click: Deployments → Manual Deploy
4. Wait for "Live" status
5. Test: curl https://oranew-backend.onrender.com/api/categories
```

### 5️⃣ VERIFY FIX (2 min)
```bash
# Test health
curl https://oranew-backend.onrender.com/health/detailed
# Should show: "database":{"connected":true}

# Test categories
curl https://oranew-backend.onrender.com/api/categories
# Should return JSON array

# Test products
curl https://oranew-backend.onrender.com/api/products?page=1&limit=16
# Should return JSON array

# Check frontend
Open: https://orashop.vercel.app
- Console should have no 500 errors
- Products/categories should load
```

---

## Success Indicator ✅

When fixed, you'll see:
```json
{
  "status": "healthy",
  "database": { "connected": true },
  "storage": { "configured": true }
}
```

---

## If Still Not Working

**Provide this information:**
1. Screenshot of Supabase dashboard (Settings → Database)
2. Output of: `curl https://oranew-backend.onrender.com/health/detailed`
3. Render backend logs from last 30 minutes
4. Time when issue started

---

**Estimated Fix Time:** 5-15 minutes  
**Difficulty:** Easy to Medium
