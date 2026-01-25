# 📱 Step-by-Step Frontend Deployment to Vercel

**Date:** January 25, 2026  
**Goal:** Deploy ORA Jewellery frontend to Vercel in 5 minutes

---

## 🎯 Prerequisites (Before You Start)

✅ Backend deployed at: `https://oranew-backend.onrender.com`  
✅ Code pushed to GitHub: `https://github.com/aravind-gm/oranew`  
✅ Vercel account created: `https://vercel.com`  

---

## 📋 Step-by-Step Instructions

### **STEP 1: Log Into Vercel Dashboard**

1. Go to **https://vercel.com** in your browser
2. Click **Sign In** (top right)
3. Sign in with GitHub (recommended)
4. You'll see your Vercel Dashboard

---

### **STEP 2: Check If Project Already Exists**

**Look for existing project:**
- On the left sidebar, look for your projects
- Search for **`oranew`** project
- If it exists, click to open it → **Go to STEP 4**
- If it doesn't exist → **Go to STEP 3**

---

### **STEP 3: Create New Vercel Project** (If Needed)

1. Click **Add New** button (top left)
2. Select **Project**
3. You'll see: "Let's build something new"
4. Click **Import Git Repository**
5. Search for: **`oranew`**
6. Select the repository from the list
7. Click **Import**

---

### **STEP 4: Configure Build Settings**

You should now see the import dialog. Fill in:

#### **Root Directory:**
- Leave blank OR select `./`

#### **Framework Preset:**
- Select **Next.js** (should auto-detect)

#### **Build Command:**
```
npm run build
```

#### **Install Command:**
```
npm install
```

#### **Output Directory:**
```
.next
```

---

### **STEP 5: Add Environment Variables**

**Click on "Environment Variables" section**

Add these variables ONE BY ONE:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://oranew-backend.onrender.com/api` |
| `NEXT_PUBLIC_RAZORPAY_KEY` | `rzp_test_S3RpfRx3I2B7GC` |
| `NEXT_PUBLIC_SITE_URL` | `https://orashop.vercel.app` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Leave as is (or update with your account) |

**For each variable:**
1. Type **Key** name (e.g., `NEXT_PUBLIC_API_URL`)
2. Type **Value** (e.g., `https://oranew-backend.onrender.com/api`)
3. Press **Tab** or click next field
4. It auto-saves

---

### **STEP 6: Deploy!**

1. Scroll to bottom of page
2. Click **Deploy** button (blue, bottom right)
3. **Wait 2-5 minutes** while it builds

**You'll see:**
- 🟡 Yellow: Building...
- 🟢 Green: Deployment ready!

---

### **STEP 7: Get Your Live URL**

When deployment finishes (green checkmark):

1. You'll see "Congratulations! Your project has been successfully deployed"
2. Click **Visit** button OR
3. Go to Vercel Dashboard → Your Project → **Deployments** tab
4. Your URL will be something like:
   ```
   https://oranew.vercel.app
   ```

---

## ✅ Verify Deployment Works

### **Test 1: Homepage Loads**
1. Open your Vercel URL in browser
2. Wait for page to load (first load takes ~10 seconds)
3. You should see the ORA Jewellery homepage
4. ✅ If you see the home page, **PASS**

### **Test 2: Check Browser Console for Errors**
1. Press `F12` (Developer Tools)
2. Click **Console** tab
3. Look for red errors
4. ✅ No red errors = **PASS**
5. ⚠️ If you see errors, go to **TROUBLESHOOTING** below

### **Test 3: Load Products**
1. Navigate to **Products** or **Shop** page
2. Wait for products to load
3. You should see product cards with images
4. ✅ If products show = **PASS**
5. ❌ If blank/no products = Check troubleshooting

### **Test 4: Check Network Requests**
1. Press `F12` (Developer Tools)
2. Click **Network** tab
3. Reload page
4. Look for requests to `oranew-backend.onrender.com`
5. ✅ If you see backend requests = **PASS**
6. ❌ If no requests/404 errors = API URL is wrong (STEP 5)

---

## 🐛 Troubleshooting

### **Problem: Build Failed**

**Error in Vercel logs:**

1. Click **Deployments** tab
2. Click the failed deployment
3. Scroll down to see error message
4. **Common causes:**
   - Missing dependency → Run `npm install` locally, test `npm run build`
   - TypeScript error → Check for compilation errors locally
   - Wrong folder → Make sure you're deploying from root `/oranew`

**Solution:**
```bash
cd /home/aravind/Downloads/oranew/frontend
npm install
npm run build
```

If this works locally, redeploy from Vercel.

---

### **Problem: Blank Page / 404**

**Causes:**
- API URL is wrong
- Backend is down
- Environment variables not set

**Fix:**
1. Check browser console (F12 → Console)
2. Look for errors about API
3. If it says "Cannot reach `oranew-backend.onrender.com`":
   - Go to Vercel → Settings → Environment Variables
   - Verify `NEXT_PUBLIC_API_URL` is correct
   - Redeploy (Deployments → Latest → Redeploy)

---

### **Problem: Products Don't Load**

**Causes:**
- Backend API not responding
- CORS issue
- Wrong API URL

**Fix:**
1. Test backend manually:
   ```bash
   curl https://oranew-backend.onrender.com/api/health
   ```
   Should see: `{"status":"ok"}`

2. If backend works, check API URL in Vercel:
   - Go to Vercel Project → Settings → Environment Variables
   - Verify `NEXT_PUBLIC_API_URL=https://oranew-backend.onrender.com/api`
   - Redeploy

---

### **Problem: Images Don't Load**

**Causes:**
- Images from Supabase Storage
- CORS issue
- URL format wrong

**Fix:**
1. Check console for image URL errors
2. Images should load from Supabase, not Cloudinary
3. Verify Supabase storage URLs are public

---

## 📊 Deployment Checklist

- [ ] Vercel account created & logged in
- [ ] Project imported from GitHub
- [ ] Build command set to `npm run build`
- [ ] `NEXT_PUBLIC_API_URL` set to backend URL
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY` set
- [ ] `NEXT_PUBLIC_SITE_URL` set
- [ ] Deployment completed (green checkmark)
- [ ] Homepage loads in browser
- [ ] No errors in console (F12)
- [ ] Products load from backend API
- [ ] Backend requests visible in Network tab

---

## 🔄 How to Redeploy

**If you need to redeploy (after code changes):**

1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** tab
3. Find the latest deployment
4. Click **...** (three dots) → **Redeploy**
5. Wait for build to complete

**OR automatically via GitHub:**

1. Make changes locally
2. Push to GitHub:
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```
3. Vercel automatically redeploys!

---

## 📞 Your Deployment Info

| Item | Value |
|------|-------|
| **Vercel Project URL** | https://vercel.com/aravind-gm/oranew |
| **GitHub Repo** | https://github.com/aravind-gm/oranew |
| **Frontend Code** | `/home/aravind/Downloads/oranew/frontend/` |
| **Backend API** | https://oranew-backend.onrender.com/api |
| **Expected Frontend URL** | https://orashop.vercel.app OR https://oranew.vercel.app |

---

## 🎯 What's Next After Frontend Deploys?

1. ✅ Backend deployed to Render
2. ✅ Frontend deployed to Vercel (in progress)
3. ⏳ **Next:** Deploy webhook service to Render
4. ⏳ Register webhook in Razorpay dashboard
5. ⏳ Test full payment flow end-to-end

---

**Last Updated:** January 25, 2026
