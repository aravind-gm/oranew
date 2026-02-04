# 📖 Step-by-Step: Razorpay Webhook Secret Setup

## WHERE TO GET THE SECRET

### Method 1: From Razorpay Dashboard (Recommended)

#### Step 1: Login to Razorpay
```
→ Go to: https://dashboard.razorpay.com
→ Login with your credentials
→ You should see the main dashboard
```

#### Step 2: Navigate to Webhooks
```
→ Top right: Click ⚙️ (Settings gear icon)
→ Left sidebar: Click "Webhooks"
→ You should see a list of webhooks or "No webhooks configured" message
```

#### Step 3: Add New Webhook
```
→ Click "Add webhook" button
→ A form will appear with these fields:
  ├─ Webhook URL: (text field)
  ├─ Events: (checkboxes)
  └─ Active: (toggle switch)
```

#### Step 4: Configure Webhook URL
```
Depending on your environment, enter:

LOCAL (for testing):
└─ http://localhost:8000/api/payments/webhook

OR with ngrok (for testing with Razorpay):
└─ https://abc123def.ngrok.io/api/payments/webhook

OR STAGING:
└─ https://your-staging-backend.com/api/payments/webhook

OR PRODUCTION (Render - Webhook Service):
└─ https://razorpay-webhook-zm3s.onrender.com/webhook/razorpay
```

#### Step 5: Select Events
```
✓ Check: payment.captured   (when payment succeeds)
✓ Check: payment.failed     (when payment fails)

Leave unchecked:
  ☐ payment.authorized
  ☐ order.paid
  ☐ (other events - not needed for this implementation)
```

#### Step 6: Copy the Signing Secret
```
→ After creating the webhook, Razorpay shows:
  ┌─────────────────────────────┐
  │ Signing Secret (Secret Key) │
  │ ___________________________  │
  │ test_ABC123XYZ789DEF...    │ ← Copy this!
  │ [Copy button]              │
  └─────────────────────────────┘

→ Click "Copy" button
→ Secret is now in your clipboard
```

---

## HOW TO ADD IT TO YOUR PROJECT

### Location in Project
```
Project Root
├── backend/
│   ├── src/
│   ├── .env           ← ADD HERE
│   ├── .env.example
│   └── ...
└── frontend/
```

### Step 1: Open Backend .env File
```bash
# Using terminal:
cd /home/aravind/Downloads/oranew/backend
nano .env

# OR using VS Code:
# File → Open File → backend/.env
```

### Step 2: Find the Payment Section
```dotenv
# Look for this section:
# Payment Gateway
RAZORPAY_KEY_ID="rzp_test_S3RpfRx3I2B7GC"
RAZORPAY_KEY_SECRET="2x7zVlpYrT6RA2xGQhhK27oe"
RAZORPAY_WEBHOOK_SECRET="..."  ← This line
```

### Step 3: Replace the Secret Value
```dotenv
# BEFORE:
RAZORPAY_WEBHOOK_SECRET="test_webhook_secret_local_testing"

# AFTER (paste your copied secret):
RAZORPAY_WEBHOOK_SECRET="test_ABC123XYZ789DEF123ABC456DEF789"
                         ^                                  ^
                         |-- Keep quotes, replace content --|
```

### Step 4: Save File
```bash
# If using nano:
Press: Ctrl + X
Press: Y (yes)
Press: Enter

# If using VS Code:
Press: Ctrl + S
```

### Step 5: Verify It's Correct
```bash
# View the line to confirm:
grep "RAZORPAY_WEBHOOK_SECRET" backend/.env

# Output should show:
RAZORPAY_WEBHOOK_SECRET="test_ABC123XYZ789DEF123ABC456DEF789"
```

---

## HOW TO TEST THE SECRET

### Test 1: Restart Backend and Check Logs
```bash
# Terminal 1: Stop current backend
Ctrl + C

# Terminal 1: Start backend again
npm run dev

# Look for this in logs:
[Startup] ✅ Server ready for requests
[Startup] 📌 Health check: GET /api/health
[Startup] 📌 Detailed health: GET /api/health/detailed (requires auth)
```

### Test 2: Use Razorpay Test Webhook
```
1. Go to: Razorpay Dashboard → Settings → Webhooks
2. Find your webhook in the list
3. Click "Test webhook" button
4. Select "payment.captured" event
5. Click "Send test event"
6. Check your backend logs - should show:
   ✓ [Webhook] Signature verification: OK
   ✓ [Webhook:Captured] ✓ Payment found: ...
```

### Test 3: Check Backend Logs
```bash
# If running locally:
# Terminal 1 shows logs directly

# If on Render:
# 1. Go to: https://dashboard.render.com
# 2. Click your backend service
# 3. Click "Logs" tab
# 4. Look for "[Webhook]" messages

# Expected SUCCESS log:
[Webhook] ════════════════════════════════════════════════
[Webhook] Webhook received at: 2026-02-04T10:30:45.123Z
[Webhook] ✓ Signature verification: OK
[Webhook] Event type: payment.captured
[Webhook:Captured] ✓ Payment found: paymentId: abc123
[Webhook:Captured] ✅ PAYMENT CONFIRMED SUCCESSFULLY

# Expected FAILURE log (if secret is wrong):
[Webhook] ❌ Signature verification FAILED
[Webhook] Expected: abc123def456...
[Webhook] Received: xyz789abc...
```

---

## ENVIRONMENT VARIABLE NAMES EXPLAINED

### What Each Variable Does

| Variable | Purpose | Source |
|----------|---------|--------|
| `RAZORPAY_KEY_ID` | API Key for creating orders | Razorpay → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Secret for orders & fallback | Razorpay → Settings → API Keys |
| `RAZORPAY_WEBHOOK_SECRET` | Secret for webhook signature | Razorpay → Settings → Webhooks |

### Why Separate Webhooks Secret?

```typescript
// In payment.controller.ts - webhook handler
const webhookSecret = 
  process.env.RAZORPAY_WEBHOOK_SECRET ||  // ← Try this first (specific)
  process.env.RAZORPAY_KEY_SECRET;        // ← Fall back to this (less secure)
```

**Why?**
- Webhook secret is used ONLY for incoming webhooks
- Key secret is used for outgoing API calls
- Separating them follows security best practices
- If one is compromised, the other is still safe

---

## DIFFERENT ENVIRONMENTS

### Local Development
```
File: backend/.env
Value: test_webhook_secret_from_local_razorpay_test_account
Backend URL: http://localhost:8000/api/payments/webhook
Razorpay: Dashboard (test mode)
```

### Staging
```
File: backend/.env (or CI/CD variables)
Value: staging_webhook_secret_from_razorpay_test_account
Backend URL: https://staging-backend.example.com/api/payments/webhook
Razorpay: Dashboard (test mode)
```

### Production
```
File: Render environment variables (NOT in .env)
Value: live_webhook_secret_from_razorpay_live_account
Backend URL: https://your-render-app.onrender.com/api/payments/webhook
Razorpay: Dashboard (live mode)

Steps to add to Render:
1. Go to: https://dashboard.render.com
2. Click your backend service
3. Click "Environment" tab
4. Add new variable:
   Name: RAZORPAY_WEBHOOK_SECRET
   Value: live_abc123xyz789...
5. Click "Save"
6. Service auto-redeploys
```

---

## COMMON MISTAKES & FIXES

### ❌ Mistake 1: Typo in Secret
```
RAZORPAY_WEBHOOK_SECRET="test_ABC123..." (WRONG - missing characters)
vs
RAZORPAY_WEBHOOK_SECRET="test_ABC123XYZ789DEF..." (CORRECT)

Error: [Webhook] ❌ Signature verification FAILED
Fix: Copy secret again from Razorpay, paste carefully
```

### ❌ Mistake 2: Extra Spaces or Quotes
```
❌ RAZORPAY_WEBHOOK_SECRET=" test_ABC123..."  (WRONG - space before)
❌ RAZORPAY_WEBHOOK_SECRET="test_ABC123..." " (WRONG - extra quote)
✅ RAZORPAY_WEBHOOK_SECRET="test_ABC123..."   (CORRECT)

Error: Signature mismatch
Fix: Check for extra spaces/quotes, copy again cleanly
```

### ❌ Mistake 3: Using OLD Secret
```
You regenerated the secret in Razorpay but forgot to update .env

Error: [Webhook] ❌ Signature verification FAILED
Fix: Copy NEW secret from Razorpay and update .env again
```

### ❌ Mistake 4: Forgot to Restart Server
```
Added secret to .env but didn't restart backend

Error: Still uses old secret (or no secret)
Fix: Stop and restart: npm run dev
```

### ❌ Mistake 5: Wrong Environment Variable Name
```
❌ RAZORPAY_WEBHOOK_SECRECT="..."  (WRONG - typo in name)
✅ RAZORPAY_WEBHOOK_SECRET="..."   (CORRECT)

Error: [Webhook] Webhook secret not configured
Fix: Check variable name spelling matches exactly
```

---

## VERIFICATION CHECKLIST

```
Setup Verification:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ ] Step 1: Logged into Razorpay Dashboard
    └─ URL: https://dashboard.razorpay.com

[ ] Step 2: Navigated to Settings → Webhooks
    └─ Found "Add webhook" button

[ ] Step 3: Added webhook with correct URL
    └─ Local: http://localhost:8000/api/payments/webhook
    └─ Production: https://your-render-app.onrender.com/api/payments/webhook

[ ] Step 4: Checked payment.captured and payment.failed
    └─ Both events selected

[ ] Step 5: Copied Signing Secret
    └─ Secret is in clipboard

[ ] Step 6: Opened backend/.env file
    └─ File: backend/.env

[ ] Step 7: Pasted secret into RAZORPAY_WEBHOOK_SECRET
    └─ RAZORPAY_WEBHOOK_SECRET="test_ABC123..."

[ ] Step 8: Saved the file
    └─ Ctrl+S (VS Code) or Ctrl+X → Y (nano)

[ ] Step 9: Restarted backend server
    └─ npm run dev

[ ] Step 10: Tested with Razorpay test webhook button
    └─ Checked logs for: ✓ Signature verification: OK

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All steps complete! Webhook is ready.
```

---

## FINAL VERIFICATION COMMAND

```bash
# Run this command to verify secret is in .env:
grep "RAZORPAY_WEBHOOK_SECRET" backend/.env

# You should see:
RAZORPAY_WEBHOOK_SECRET="test_ABC123XYZ789DEF..."

# If you see nothing, secret was not added
# If it's blank, you need to paste the value
```

---

## NEED HELP?

1. **Secret not found in Razorpay:**
   → Go to Dashboard → Settings → Webhooks
   → Click on your webhook → Scroll to "Signing Secret"

2. **Still getting signature verification errors:**
   → Copy the exact secret from Razorpay again
   → Paste into .env carefully (no extra spaces)
   → Restart backend server
   → Test again

3. **Can't restart backend:**
   → Press Ctrl+C to stop
   → Wait 2 seconds
   → Run: npm run dev

4. **Still stuck:**
   → Check .env file exists: `ls backend/.env`
   → Check env variable loaded: `echo $RAZORPAY_WEBHOOK_SECRET`
   → Check backend logs for errors
