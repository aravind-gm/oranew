# 🔐 Razorpay Webhook Secret Setup Guide

## Step 1: Get Your Webhook Secret from Razorpay Dashboard

### For LIVE/Production:
1. Go to **Razorpay Dashboard** → [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Click **Settings** (⚙️ icon) in the top right
3. Select **Webhooks** from the left menu
4. Click **Add webhook**
5. Enter webhook URL: `https://razorpay-webhook-zm3s.onrender.com/webhook/razorpay`
6. Select events:
   - ✅ `payment.captured` (payment success)
   - ✅ `payment.failed` (payment failed)
7. Copy the **Signing Secret** that's generated
8. Keep this secret safe - it's used for signature verification

### For TEST/Development:
1. Same process but use your local/test backend URL:
   - Local: `http://localhost:8000/api/payments/webhook`
   - Staging: `https://staging-backend.com/api/payments/webhook`
   - Render (Webhook Service): `https://razorpay-webhook-zm3s.onrender.com/webhook/razorpay`

---

## Step 2: Add to Backend Environment File

### Location: `backend/.env`

```dotenv
# Payment Gateway
RAZORPAY_KEY_ID="rzp_test_YOUR_KEY_ID"
RAZORPAY_KEY_SECRET="YOUR_KEY_SECRET"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret_here"  # ← Copy from Razorpay
```

### If using both TEST and LIVE:
```dotenv
# TEST/Development
RAZORPAY_WEBHOOK_SECRET="test_webhook_secret_from_razorpay"

# LIVE/Production (Render env vars)
# Override in production deployment:
RAZORPAY_WEBHOOK_SECRET="live_webhook_secret_from_razorpay"
```

---

## Step 3: Verify Setup is Working

### Test locally with ngrok (for local development):

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Expose local server to internet
ngrok http 8000
# Copy the https URL from ngrok output
# Example: https://abc123def.ngrok.io

# Terminal 3: Update Razorpay webhook URL
# Go to Razorpay dashboard and set webhook to:
# https://abc123def.ngrok.io/api/payments/webhook
```

### Test webhook signature verification:

```bash
# Use Razorpay's webhook test feature in dashboard
# OR manually test with curl:

curl -X POST http://localhost:8000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: test_signature" \
  -d '{
    "event": "payment.captured",
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_test123",
          "order_id": "order_test123",
          "amount": 50000,
          "notes": {"orderId": "order-uuid-here"}
        }
      }
    }
  }'
```

Expected response: `{"success": false, "reason": "Invalid signature"}` (because test signature is invalid)

---

## Step 4: Verify Webhook is Receiving Events

### Check logs in production (Render):
```bash
# From Render dashboard → Logs
# Look for these log lines:

[Webhook] ════════════════════════════════════════════════
[Webhook] Webhook received at: 2026-02-04T10:30:45.123Z
[Webhook] ✓ Signature verification: OK
[Webhook] Event type: payment.captured
[Webhook:Captured] ✓ Payment found: paymentId: ...
[Webhook:Captured] ════════════════════════════════════════
[Webhook:Captured] ✅ PAYMENT CONFIRMED SUCCESSFULLY
```

### On failure, you'd see:
```
[Webhook] ❌ Signature verification FAILED
[Webhook] Expected: abc123def...
[Webhook] Received: xyz789...
```

---

## Step 5: Deploy to Production

### For Render.com:
1. Go to your **Render Dashboard** → Select your backend service
2. Click **Environment** tab
3. Add/Update variable:
   ```
   Key: RAZORPAY_WEBHOOK_SECRET
   Value: your_live_webhook_secret_from_razorpay
   ```
4. Redeploy the service

### For Vercel (frontend only):
```bash
# No changes needed - webhook is on backend
# Just ensure FRONTEND_URL in backend .env matches your Vercel URL
FRONTEND_URL="https://your-frontend.vercel.app"
```

### For other platforms (AWS, Heroku, etc.):
Add to your platform's environment variable settings:
```
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

---

## 🛠️ Environment Variable Hierarchy

The code uses this fallback:
```typescript
const webhookSecret = 
  process.env.RAZORPAY_WEBHOOK_SECRET || 
  process.env.RAZORPAY_KEY_SECRET;
```

**Priority:**
1. `RAZORPAY_WEBHOOK_SECRET` (preferred, specific for webhooks)
2. `RAZORPAY_KEY_SECRET` (fallback, less secure)

**Recommendation:** Always set `RAZORPAY_WEBHOOK_SECRET` explicitly for better security.

---

## ⚠️ Common Issues & Fixes

### Issue: "Webhook secret not configured"
**Fix:** 
- Ensure `RAZORPAY_WEBHOOK_SECRET` is set in `backend/.env`
- Restart backend server after adding
- Check `.env` file is not in `.gitignore` exclusions

### Issue: "Signature verification FAILED"
**Fix:**
- Verify webhook secret in `.env` matches **exactly** what's in Razorpay dashboard
- Check for extra spaces, quotes, or special characters
- Razorpay dashboard → Settings → Webhooks → Copy secret again

### Issue: Webhook not being called
**Fix:**
- Verify webhook URL in Razorpay dashboard is correct
- For local testing, use ngrok and update URL
- Check backend server is running and accessible
- Ensure firewall allows incoming requests
- Try "Test webhook" button in Razorpay dashboard

### Issue: "Payment already CONFIRMED" errors
**Fix:**
- This is NORMAL - webhook can be received multiple times
- System is idempotent - safe to ignore
- Check logs for `[Webhook:Captured] ✓ Payment already CONFIRMED (idempotent)`

---

## 📋 Webhook Events Handled

| Event | Action | Status |
|-------|--------|--------|
| `payment.captured` | Payment successful → Order confirmed | ✅ Implemented |
| `payment.failed` | Payment failed → Order cancelled | ✅ Implemented |
| Others | Ignored (safe) | ✅ Handled |

---

## 🔒 Security Best Practices

1. **Never commit secrets:**
   ```bash
   # Make sure .env is in .gitignore
   echo ".env" >> .gitignore
   ```

2. **Use different secrets for TEST and LIVE:**
   - Test secret: `test_webhook_secret_...`
   - Live secret: `live_webhook_secret_...`

3. **Rotate secrets regularly:**
   - Razorpay → Settings → Webhooks → Regenerate secret

4. **Log webhook events:**
   - Backend logs all webhook details for debugging
   - Check production logs for signature mismatches

---

## ✅ Verification Checklist

- [ ] `RAZORPAY_WEBHOOK_SECRET` added to `backend/.env`
- [ ] Webhook URL configured in Razorpay dashboard
- [ ] Backend server restarted after adding environment variable
- [ ] Tested with "Test webhook" button in Razorpay
- [ ] Signature verification passes (no "Invalid signature" errors)
- [ ] Webhook logs show `✓ Signature verification: OK`
- [ ] Payment events trigger order confirmation
- [ ] Failed payments are handled correctly
- [ ] Environment variables deployed to production

---

## 📞 Support

**If webhook still not working:**

1. Check backend logs for errors:
   ```bash
   # Render logs
   # AWS CloudWatch logs
   # GCP Cloud Logging
   ```

2. Verify secret matches exactly:
   ```bash
   # In backend/.env
   echo $RAZORPAY_WEBHOOK_SECRET
   
   # Compare with Razorpay dashboard character by character
   ```

3. Test signature manually:
   ```typescript
   // In Node.js
   const crypto = require('crypto');
   const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
   const body = '{"event":"payment.captured",...}';
   
   const expectedSig = crypto
     .createHmac('sha256', secret)
     .update(body)
     .digest('hex');
   console.log(expectedSig);
   ```

4. Contact Razorpay support with:
   - Webhook URL from dashboard
   - Backend service URL
   - Error message from logs
   - Timestamp of failed webhook
