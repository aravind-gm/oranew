# 🚀 Frontend Deployment on Vercel — ORA Jewellery

**Date:** January 25, 2026  
**Status:** ✅ Next.js frontend ready for Vercel deployment

---

## 📋 Quick Summary

Your **Next.js frontend** is ready to deploy to Vercel. The main task is to:
1. Update environment variables to point to your deployed backend
2. Push to GitHub
3. Deploy to Vercel (or re-deploy if already connected)

---

## 🔄 Current Setup

Your frontend is located at:
```
/home/aravind/Downloads/oranew/frontend/
```

**Current Environment Variables** (local development):
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/api
NEXT_PUBLIC_RAZORPAY_KEY=your-razorpay-key-id
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-name
```

---

## ✅ Step 1: Update Environment Variables

### Option A: Update Locally (Then Commit)

Update `frontend/.env.local` with your production values:

```env
NEXT_PUBLIC_API_URL=https://oranew-backend.onrender.com/api
NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_S3RpfRx3I2B7GC
NEXT_PUBLIC_SITE_URL=https://orashop.vercel.app
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-name
```

**Then commit:**
```bash
cd /home/aravind/Downloads/oranew
git add frontend/.env.local
git commit -m "Update frontend env variables for production"
git push origin main
```

---

### Option B: Use Vercel Environment Variables (Recommended for Production)

**Do NOT commit `.env.local` to Git** — instead set environment variables directly in Vercel:

1. Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**
2. Add each variable:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://oranew-backend.onrender.com/api` |
| `NEXT_PUBLIC_RAZORPAY_KEY` | `rzp_test_S3RpfRx3I2B7GC` |
| `NEXT_PUBLIC_SITE_URL` | `https://orashop.vercel.app` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Your Cloudinary account |

3. Click **Save** and redeploy

---

## 🚀 Step 2: Deploy to Vercel

### If Already Connected to GitHub:

1. Go to **Vercel Dashboard**
2. Select your project (should be connected to `aravind-gm/oranew`)
3. Click **Deployments**
4. The latest push should show a new deployment
5. Wait for build to complete (usually 2-3 minutes)

### If NOT Yet Connected:

1. Go to **[vercel.com](https://vercel.com)**
2. Click **Add New** → **Project**
3. Import your GitHub repository: `aravind-gm/oranew`
4. Select **Framework Preset:** `Next.js`
5. Configure build settings:
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install`
   - **Output Directory:** `.next`
6. Add environment variables (from Option B above)
7. Click **Deploy**

---

## 🔧 Step 3: Configure Frontend for Backend API

Your frontend needs to call the backend API. The endpoint is already configured via:
```
NEXT_PUBLIC_API_URL=https://oranew-backend.onrender.com/api
```

This is used in all API calls throughout the app. Example:
```typescript
const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/products`);
```

---

## ✨ Step 4: Verify Frontend Deployment

### Test the Deployed Site

1. Go to your Vercel deployment URL (e.g., `https://orashop.vercel.app`)
2. Check that:
   - ✅ Homepage loads without errors
   - ✅ Products display correctly
   - ✅ API calls work (check browser console for errors)
   - ✅ Images load properly
   - ✅ Cart functionality works
   - ✅ Checkout flow initializes

### Monitor Logs

1. Vercel Dashboard → **Your Project** → **Deployments**
2. Click the latest deployment
3. View **Build Logs** and **Runtime Logs**
4. Check for any API connection errors

---

## 🔗 Integration Checklist

- [ ] Backend deployed to Render: `https://oranew-backend.onrender.com` ✅
- [ ] Frontend environment variables updated
- [ ] Frontend deployed to Vercel
- [ ] `NEXT_PUBLIC_API_URL` points to backend
- [ ] Frontend can call backend API successfully
- [ ] Products load in storefront
- [ ] Cart and checkout work
- [ ] Admin panel accessible
- [ ] No CORS errors in browser console

---

## 🐛 Troubleshooting

### Issue: "Cannot GET /api/products" or 404 errors

**Cause:** Frontend can't reach backend API

**Solution:**
1. Check `NEXT_PUBLIC_API_URL` is correct: `https://oranew-backend.onrender.com/api`
2. Verify backend is running: `curl https://oranew-backend.onrender.com/api/health`
3. Check browser console for CORS errors
4. Ensure backend has proper CORS configuration

### Issue: Blank Page or Build Fails

**Solution:**
1. Check Vercel build logs for errors
2. Ensure all dependencies are installed: `npm install` locally
3. Test locally: `npm run dev`
4. Check for TypeScript errors: `npm run build`

### Issue: Cloudinary Images Not Loading

**Solution:**
1. Verify `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set in Vercel
2. Check image URLs are from Supabase Storage (not Cloudinary)
3. Verify Supabase public URLs are accessible

### Issue: Razorpay Payment Not Working

**Solution:**
1. Check `NEXT_PUBLIC_RAZORPAY_KEY` is the test key
2. Verify backend webhook is configured in Razorpay dashboard
3. Check payment endpoints in backend are working

---

## 📊 Deployment URLs

| Service | URL | Status |
|---------|-----|--------|
| **Backend API** | https://oranew-backend.onrender.com | ✅ Deployed |
| **Frontend** | https://orashop.vercel.app | 🔄 Deploying |
| **Webhook** | https://ora-webhook.onrender.com | ⏳ To Deploy |
| **Admin Panel** | https://orashop.vercel.app/admin | 🔄 Deploying |

---

## 🎯 Next Steps After Frontend Deployment

1. ✅ Backend deployed to Render
2. ✅ Frontend updated and deployed to Vercel
3. ⏳ Deploy webhook service to Render
4. ⏳ Configure Razorpay webhook URL
5. ⏳ Test full payment flow end-to-end

---

## 📞 Quick Reference

**Frontend Repo:** https://github.com/aravind-gm/oranew/tree/main/frontend

**Vercel Project:** https://vercel.com/aravind-gm/oranew

**Environment Variables Needed:**
- `NEXT_PUBLIC_API_URL` → Backend API URL
- `NEXT_PUBLIC_RAZORPAY_KEY` → Razorpay test key
- `NEXT_PUBLIC_SITE_URL` → Frontend URL
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` → Cloudinary account

---

**Last Updated:** January 25, 2026
