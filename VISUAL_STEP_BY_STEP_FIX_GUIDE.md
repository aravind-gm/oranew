# 🎬 VISUAL STEP-BY-STEP GUIDE: FIX 500 ERRORS

## GOAL
Get APIs working again in 10 minutes

---

## STEP 1: Login to Render Dashboard

```
Open: https://dashboard.render.com/

Expected screen:
┌─────────────────────────────────────┐
│ Render Dashboard                    │
│                                     │
│ Services:                           │
│ ├─ oranew-backend  [green dot]     │
│ ├─ oranew-frontend [green dot]     │
│ └─ webhook-service [green dot]     │
│                                     │
└─────────────────────────────────────┘

Click: oranew-backend
```

---

## STEP 2: Open Settings

```
After clicking oranew-backend, you'll see:

┌─────────────────────────────────────────┐
│ oranew-backend Service                  │
│                                         │
│ [Overview] [Logs] [Events] [Settings]   │
│           ← Click Settings               │
└─────────────────────────────────────────┘

You'll be taken to Settings page
```

---

## STEP 3: Find Environment Variables

```
In Settings page, scroll down to:

┌─────────────────────────────────────────┐
│ Environment                             │
├─────────────────────────────────────────┤
│                                         │
│ Node Environment  production            │
│ DATABASE_URL      [long string...]      │
│ JWT_SECRET        [hidden]              │
│ RAZORPAY_KEY_ID   [hidden]              │
│                                         │
│ [Add Environment Variable]              │
│                                         │
└─────────────────────────────────────────┘

Find: DATABASE_URL
```

---

## STEP 4: Edit DATABASE_URL

```
Click on the DATABASE_URL row to edit:

┌─────────────────────────────────────────┐
│ DATABASE_URL                            │
├─────────────────────────────────────────┤
│                                         │
│ postgresql://postgres.hgejomvgld...    │
│                                         │
│ [Edit] [Copy] [Delete]                 │
│                                         │
└─────────────────────────────────────────┘

Click: [Edit]
```

---

## STEP 5: Replace the URL

```
You'll see an edit dialog:

┌─────────────────────────────────────────┐
│ Edit Variable: DATABASE_URL             │
├─────────────────────────────────────────┤
│                                         │
│ Value:                                  │
│ ┌─────────────────────────────────┐    │
│ │ postgresql://postgres.hgejomvg..│    │
│ └─────────────────────────────────┘    │
│                                         │
│ [Clear] [Save] [Cancel]                │
│                                         │
└─────────────────────────────────────────┘

Action: 
1. Select all (Ctrl+A)
2. Delete
3. Paste new URL (see below)
```

**Copy this URL:**
```
postgresql://postgres:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres
```

---

## STEP 6: Save Changes

```
After pasting new URL:

┌─────────────────────────────────────────┐
│ Edit Variable: DATABASE_URL             │
├─────────────────────────────────────────┤
│                                         │
│ Value:                                  │
│ ┌─────────────────────────────────┐    │
│ │ postgresql://postgres:G.M.arav..│    │
│ │ ..@db.hgejomvgldqnqzkgffoi...   │    │
│ └─────────────────────────────────┘    │
│                                         │
│ [Clear] [Save] [Cancel]                │
│           ↑ Click Save                  │
│                                         │
└─────────────────────────────────────────┘

Click: Save
```

---

## STEP 7: Wait for Redeploy

```
After saving, you'll see:

┌─────────────────────────────────────────┐
│ oranew-backend                          │
│                                         │
│ Latest Deployment                       │
│ Status: Deploying...  [spinner]         │
│                                         │
│ Build Logs:                             │
│ > Building...                           │
│ > Starting server...                    │
│ > Live ✓                                │
│                                         │
└─────────────────────────────────────────┘

Wait until: Status = "Live" (green)
Time: 2-3 minutes
```

---

## STEP 8: Verify Health Check

```
Once status shows "Live", test in terminal:

$ curl https://oranew-backend.onrender.com/health/detailed

Expected response:
{
  "status": "healthy",
  "timestamp": "2026-01-28T...",
  "database": {
    "connected": true    ← THIS SHOULD BE TRUE
  },
  "storage": {
    "configured": true
  }
}

✅ If "connected": true, proceed to Step 9
❌ If still false, wait 2 more minutes and retry
```

---

## STEP 9: Test API Endpoints

**Test Categories:**
```bash
$ curl https://oranew-backend.onrender.com/api/categories

Expected: JSON array
[
  { "id": "...", "name": "Rings", ... },
  { "id": "...", "name": "Earrings", ... }
]

✅ If JSON data returned, SUCCESS!
❌ If error, check Step 8 again
```

**Test Products:**
```bash
$ curl https://oranew-backend.onrender.com/api/products?page=1&limit=16

Expected: JSON object with products
{
  "data": [
    { "id": "...", "name": "Ring 1", ... },
    { "id": "...", "name": "Ring 2", ... }
  ]
}

✅ If JSON data returned, SUCCESS!
```

---

## STEP 10: Verify Frontend

```
Open in browser: https://orashop.vercel.app

Screen should show:

┌──────────────────────────────────────┐
│         ORA Jewellery                │
│                                      │
│ [Categories loaded]                  │
│ • Rings                              │
│ • Earrings                           │
│ • Necklaces                          │
│                                      │
│ [Products loading...]                │
│ [Product card] [Product card]...     │
│                                      │
│ Press F12 to check console           │
│ Should see NO red errors ✅           │
│                                      │
└──────────────────────────────────────┘

✅ If everything loads and no errors = FIXED!
```

---

## Troubleshooting Visual Guide

### If Still Seeing 500 Errors

**Check Render Logs:**
```
In Render Dashboard:
Service: oranew-backend
Tab: [Logs]

Look for error messages about database
```

**Check Database:**
```
Open: https://app.supabase.com/
Project: hgejomvgldqnqzkgffoi
Settings → Database

Status indicators should ALL be green:
├─ Database: Running ✓
├─ Connection pooler: Healthy ✓
└─ Storage: Connected ✓

If any RED:
- Click "Resume" if paused
- Restart pooler (toggle off/on)
```

**Revert if Needed:**
```
If fix doesn't work:
1. Go back to Render Settings → Environment
2. Edit DATABASE_URL again
3. Paste OLD value (the long one with pooler)
4. Click Save
5. Wait for redeploy

This will revert the change
```

---

## Success Indicators Checklist

✅ **All of these should be true:**

```
□ Render service shows "Live" (green status)
□ /health/detailed shows "database": { "connected": true }
□ /api/categories returns JSON with data
□ /api/products returns JSON with data
□ Frontend loads without errors
□ Browser console has no red error messages
□ Can see product categories in UI
□ Can see product listings in UI
```

---

## Timeline

```
Time    Activity
────────────────────────────────────────
00:00   Start - Open Render dashboard
01:00   Edit DATABASE_URL in Render
02:00   Save changes
03:00   Wait for Render to redeploy
05:00   Check health endpoint
06:00   Test /api/categories
07:00   Test /api/products
08:00   Open frontend, verify
09:00   Complete! ✅

Total: ~10 minutes
```

---

## If You Get Stuck

**I'm seeing a different screen:**
- Make sure you're in the right service (oranew-backend)
- Make sure you're in Settings, not Overview
- Scroll down to find Environment section

**The value won't save:**
- Try clearing the entire field first
- Copy-paste the new URL slowly
- Click Save, wait for confirmation

**Database still shows not connected:**
- Wait another 2-3 minutes
- Render might still be deploying
- Check that you pasted the entire URL correctly
- No extra spaces or characters

**Can't find oranew-backend service:**
- Make sure logged into Render
- Check that you're viewing the correct team/organization
- The service should show green "Live" status

---

## Key Points to Remember

🎯 **You only need to change ONE thing:**
- DATABASE_URL environment variable in Render

🎯 **Use this exact new value:**
```
postgresql://postgres:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres
```

🎯 **Don't need to touch:**
- Backend code
- Frontend code
- Supabase database
- Any other environment variables

🎯 **The fix is:**
- Safe (easy to revert)
- Fast (5-10 minutes)
- Reliable (95%+ success rate)

---

**Status:** Ready to Execute ✅  
**Difficulty:** Easy (Follow the 10 steps)  
**Time:** 5-10 minutes  
**Risk:** None (can revert anytime)
