# 🚀 Force Deploy Frontend to Vercel - Quick Guide

## 🎯 Fastest Method: GitHub Push + Vercel Auto-Deploy

```bash
# All changes should already be committed
# Just push to GitHub:
git push origin main

# Vercel will automatically detect the push
# and start a new deployment within seconds
```

**Time:** ~2-5 seconds for Vercel to detect  
**Result:** New build starts automatically

---

## Option 1: Force Redeploy via Vercel CLI

```bash
# From project root
cd /home/aravind/Downloads/oranew

# Login to Vercel (if not logged in)
vercel login

# Force redeploy (skip confirmations)
vercel deploy --prod --force
```

**What this does:**
- ✅ Forces a fresh build (ignores cache)
- ✅ Deploys to production immediately
- ✅ Latest code from current branch

**Time:** ~3-5 minutes

---

## Option 2: Clear Cache + Redeploy via Vercel Dashboard

### Step 1: Go to Vercel Dashboard
```
https://vercel.com/dashboard
```

### Step 2: Select Your Frontend Project
```
Look for: orashop.vercel.app (or similar)
Click on it
```

### Step 3: Go to Settings
```
Click: "Settings" tab
```

### Step 4: Clear Build Cache
```
Left sidebar: "Build Cache"
Click: "Clear all"
```

### Step 5: Trigger New Deployment
```
Top of page: "Deployments" tab
Find latest deployment (should show your git hash)
Click the three dots menu (⋯)
Select: "Redeploy"
```

**Time:** ~3-5 minutes  
**Result:** Fresh build from scratch

---

## Option 3: Trigger via Git (RECOMMENDED)

Simplest way - Vercel auto-listens to GitHub:

```bash
# Make sure code is pushed
git push origin main

# Vercel detects it automatically
# Watch deployment at: https://vercel.com/dashboard
```

**No action needed on Vercel side!**

---

## Option 4: Edit vercel.json to Force Rebuild

Add a timestamp to force detection:

```bash
# Edit vercel.json
nano vercel.json

# OR in VS Code
code vercel.json
```

Add this line to make a change Vercel detects:

```json
{
  "version": 2,
  "buildCommand": "npm --prefix frontend run build",
  "env": {
    ...
  }
}
```

Save and commit:
```bash
git add vercel.json
git commit -m "Force Vercel rebuild"
git push origin main
```

---

## Option 5: Deploy Specific Branch

```bash
# Deploy current branch to preview
cd /home/aravind/Downloads/oranew

vercel deploy --force

# This creates a preview URL
# View the output for your preview link
```

---

## Checking Deployment Status

### Via CLI
```bash
vercel logs --prod
```

### Via Dashboard
```
1. Go to: https://vercel.com/dashboard
2. Click your project
3. Click "Deployments" tab
4. Watch the latest deployment
5. Look for green checkmark ✅
```

### View Build Logs
```
Deployments tab → Click a deployment → "View Logs"
```

---

## Troubleshooting: Build Failing?

### Check for Build Errors
```bash
# View the latest build log
vercel logs --prod

# Look for:
❌ Failed to compile
❌ Type errors
❌ Module not found
```

### Common Issues & Fixes

**Issue: "Cannot find module '@/context/AuthContext'"**
```
Fix: This should be resolved now
Run: npm run build (from frontend)
Verify no errors locally first
```

**Issue: "TypeScript compilation errors"**
```
Run locally to verify:
cd frontend
npm run build

If it fails locally, fix it first
Then deploy
```

**Issue: Vercel not detecting changes**
```
Solutions:
1. Push to GitHub: git push origin main
2. Wait 5-10 seconds for Vercel to detect
3. If still nothing, use: vercel deploy --prod --force
```

---

## Full Deployment Checklist

```
BEFORE DEPLOYING:
[ ] All code changes made ✅
[ ] No syntax errors: npm run build (from frontend) ✅
[ ] No TypeScript errors ✅
[ ] All files saved

DEPLOYMENT:
[ ] Commit changes: git add . && git commit -m "message"
[ ] Push to GitHub: git push origin main
[ ] Wait for Vercel to detect (auto-deploy)
  OR manually deploy: vercel deploy --prod --force

VERIFICATION:
[ ] Check Vercel dashboard (green checkmark)
[ ] Check frontend URL: https://orashop.vercel.app (or your URL)
[ ] Load the page in browser
[ ] Check for any errors in browser console (F12)
[ ] Verify webhook status page loads
```

---

## Which Option to Use?

| Situation | Option | Time |
|-----------|--------|------|
| Code already pushed to GitHub | Just wait or Option 3 | 30s-3min |
| Code not pushed yet | Push first, then wait | 1-3min |
| Need force rebuild NOW | Option 1 (CLI) | 3-5min |
| Prefer GUI | Option 2 (Dashboard) | 3-5min |
| Want to be sure | Option 1 + Option 2 | 5-10min |

**RECOMMENDED:** Option 1 or 3 (push + wait for auto-deploy)

---

## Real-Time Monitoring

```bash
# Watch deployment in real-time
vercel logs --prod --follow

# Will show:
# ✓ Build started
# ✓ Downloading source code
# ✓ Running build script
# ✓ Build completed
# ✓ Deploying to production
# ✓ READY [URL]
```

---

## After Deployment

### Test the Changes

1. **Clear browser cache:**
   ```
   Open frontend URL
   Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   ```

2. **Check logs:**
   ```
   Press F12 (open DevTools)
   Click "Console" tab
   Look for any errors
   ```

3. **Verify webhook success page:**
   ```
   Go to /checkout/success?orderId=test
   Should show payment status polling
   ```

4. **Verify failed page:**
   ```
   Go to /checkout/failed?orderId=test
   Should show payment failed UI
   ```

---

## Quick Command Reference

```bash
# Push code and auto-deploy
git push origin main

# Force deploy via CLI
vercel deploy --prod --force

# Check deployment status
vercel logs --prod

# Watch deployment live
vercel logs --prod --follow

# Deploy preview version
vercel deploy

# Clear cache then redeploy (via CLI)
vercel deploy --prod --force
```

---

## Vercel Dashboard Link

**Quick Access:**
```
https://vercel.com/your-username/your-project
```

Look for:
- Deployments tab (shows history)
- Settings tab (cache clearing)
- Environment tab (env variables)
- Logs section (see errors)

---

## Still Not Working?

1. **Check if changes are pushed:**
   ```bash
   git log -1
   # Should show your latest commit
   ```

2. **Verify no build errors locally:**
   ```bash
   cd frontend
   npm run build
   # Should complete with no errors
   ```

3. **Force deploy with CLI:**
   ```bash
   vercel deploy --prod --force
   # Watch the output
   ```

4. **Check Vercel dashboard logs:**
   ```
   https://vercel.com/dashboard
   → Your project
   → Deployments
   → Latest deployment
   → View Logs
   ```

---

## Need Help?

Check these files for context:
- [PAYMENT_STATUS_VERIFIED_VS_CONFIRMED.md](PAYMENT_STATUS_VERIFIED_VS_CONFIRMED.md) - Explains payment flow
- [WEBHOOK_SECRET_SETUP_GUIDE.md](WEBHOOK_SECRET_SETUP_GUIDE.md) - Backend webhook setup
- [WEBHOOK_SECRET_QUICK_SETUP.md](WEBHOOK_SECRET_QUICK_SETUP.md) - Quick reference

All frontend changes are ready to deploy! 🚀
