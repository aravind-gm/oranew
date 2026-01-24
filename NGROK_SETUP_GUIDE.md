# ngrok Setup for Razorpay Webhook Testing - Step by Step

## What is ngrok?
ngrok creates a secure tunnel to your local backend so Razorpay servers (which cannot access localhost:5000) can reach your webhook endpoint.

---

## Step 1: Download and Install ngrok

### Option A: Download from Website (Easiest)
1. Go to https://ngrok.com/download
2. Click **Download** for Windows
3. Extract the `ngrok.exe` file to a folder
4. Open Command Prompt and navigate to that folder

### Option B: Install with Chocolatey (If you have it)
```bash
choco install ngrok
```

---

## Step 2: Verify Backend is Running

Make sure your Docker containers are running:

```bash
cd c:\Users\selvi\Downloads\orashop.in\oranew
docker-compose ps
```

You should see:
```
ora-backend    ... Healthy ... 0.0.0.0:5000->5000/tcp
ora-frontend   ... Up      ... 0.0.0.0:3000->3000/tcp
ora-postgres   ... Healthy ... 0.0.0.0:5432->5432/tcp
```

Test the backend is reachable:
```bash
curl http://localhost:5000/health
```

You should see:
```json
{"status":"ok","timestamp":"2026-01-13T13:30:53.195Z"}
```

✅ **If you see this, your backend is ready!**

---

## Step 3: Start ngrok Tunnel

### On Windows (Command Prompt)

**Option 1: If you extracted ngrok.exe to a folder**
```bash
cd C:\path\to\ngrok\folder
ngrok http 5000
```

**Option 2: If ngrok is in your PATH**
Just run:
```bash
ngrok http 5000
```

### You should see something like:

```
ngrok by @inconshiftdéng                                (Ctrl+C to quit)

Session Status                online
Account                       your-email@example.com
Version                        3.x.x
Region                         us (United States)
Forwarding                     https://abcd1234.ngrok.io -> http://localhost:5000
Forwarding                     http://abcd1234.ngrok.io -> http://localhost:5000

Web Interface                   http://127.0.0.1:4040

Connections                    ttl    opn    rt1    rt5    p50    p95
                                0      0      0.00   0.00   0.00   0.00
```

✅ **Copy the HTTPS URL**: `https://abcd1234.ngrok.io`

⚠️ **Keep this terminal open!** ngrok must stay running for your webhook to work.

---

## Step 4: Update Razorpay Dashboard

### 4a. Log in to Razorpay Dashboard

1. Go to https://dashboard.razorpay.com/
2. Log in with your credentials
3. Click **Settings** (bottom left)

### 4b. Configure Webhook URL

1. In Settings, find **Webhooks**
2. Click **+ Create Webhook** (or edit existing)
3. In the **Webhook URL** field, paste your ngrok URL:
   ```
   https://abcd1234.ngrok.io/api/payments/webhook
   ```
4. Select these **Events**:
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ payment.authorized

5. Click **Save** or **Create**

✅ **Razorpay will now send webhooks to your local backend!**

---

## Step 5: Test the Payment Flow

### 5a. Open Frontend

1. Go to http://localhost:3000
2. Sign up / Log in
3. Add items to cart
4. Go to checkout
5. Select an address
6. Click **Continue to Payment**

### 5b. Complete Payment

1. Razorpay popup opens
2. Enter test card details:
   ```
   Card Number: 4111111111111111
   Expiry: 12/25
   CVV: 123
   Name: Test User
   ```
3. Click **Pay**

### 5c. Watch the Logs

Open a **new terminal** and run:
```bash
docker-compose logs -f backend
```

### 5d. Look for Success Logs

You should see:
```
[Verify] ════════════════════════════════════════════
[Verify] Starting signature verification
[Verify] Request body: { orderId: '...', razorpayPaymentId: '...', ... }
[Verify] ✓ All input fields present
[Verify] ✓ Order found
[Verify] ✓ Payment record found
[Verify] ✓ Signature verified successfully
[Verify] ════════════════════════════════════════════

[Webhook] ════════════════════════════════════════════
[Webhook] Webhook received from Razorpay
[Webhook] ✓ Signature verified successfully
[Webhook] Received event type: payment.captured
[Webhook] Processing payment.captured event
[Webhook] Details:
[Webhook]   Razorpay Payment ID: pay_xxxxx
[Webhook]   Razorpay Order ID: order_xxxxx
[Webhook]   Amount (paise): 50000
[Webhook]   Status: captured
[Webhook] ✓ Payment found
[Webhook] ✓ Order found
[Webhook] [TX] Starting transaction...
[Webhook] [TX] Step 1 complete: Payment.status = CONFIRMED
[Webhook] [TX] Step 2 complete: Order.paymentStatus = CONFIRMED
[Webhook] [TX] Step 3 complete: Inventory deducted
[Webhook] [TX] Step 4 complete: Cart cleared
[Webhook] [TX] Step 5 complete: Notification created
[Webhook] ALL OPERATIONS COMPLETED SUCCESSFULLY
[Webhook] Order #ORA-xxxxx is now CONFIRMED with payment
[Webhook] ════════════════════════════════════════════
```

✅ **If you see this, your webhook worked!**

---

## Step 6: Verify Order Status

In the frontend, you should see:
- ✅ Order status changed to "Confirmed"
- ✅ Payment confirmed
- ✅ Cart emptied
- ✅ Notification received

---

## Troubleshooting

### Problem: "Connection refused" when starting ngrok
**Solution**: Make sure Docker backend is running:
```bash
docker-compose up -d
```

### Problem: Webhook shows "Signature verification FAILED"
**Check in Razorpay dashboard:**
1. Are you using TEST keys (rzp_test_...) in your .env?
2. Make sure RAZORPAY_KEY_SECRET matches exactly
3. Restart backend:
```bash
docker-compose restart backend
```

### Problem: "Payment record not found"
**This means:**
- /api/payments/create was not called
- Or /api/payments/create failed
- Check frontend console for errors

### Problem: ngrok URL keeps changing
**Issue**: Free ngrok account changes URL every 8 hours

**Solution A**: Get a paid ngrok account for static URLs
**Solution B**: Restart ngrok and update Razorpay webhook URL each time

To get new URL:
```
ngrok http 5000
# Copy new HTTPS URL
# Go to Razorpay dashboard
# Update webhook URL
```

### Problem: Frontend shows "Order Pending" after payment
**Check logs:**
```bash
docker-compose logs backend | findstr webhook
```

If no webhook logs appear:
- ngrok URL might be wrong
- Razorpay webhook URL not saved
- Webhook not configured in Razorpay dashboard

---

## ngrok Web Interface (Bonus)

While ngrok is running, you can view requests at:
```
http://127.0.0.1:4040
```

This shows all webhook requests from Razorpay!

### What you'll see:
- **REQUEST**: Full payload from Razorpay
- **RESPONSE**: Your backend's response (should be `200 { "received": true }`)
- **HEADERS**: Signature verification info

---

## Next Steps

1. ✅ Download ngrok
2. ✅ Start ngrok tunnel → Get HTTPS URL
3. ✅ Update Razorpay webhook URL
4. ✅ Test payment flow
5. ✅ Watch logs for success
6. ✅ Verify order confirmed

## Summary

| Step | Command | Expected Output |
|------|---------|-----------------|
| 1 | `ngrok http 5000` | `Forwarding https://xxxx.ngrok.io -> http://localhost:5000` |
| 2 | Update Razorpay | Webhook URL saved |
| 3 | `docker-compose logs -f backend` | Payment and webhook logs appear |
| 4 | Complete test payment | Order status = CONFIRMED |

---

## Quick Command Reference

```bash
# Start ngrok
ngrok http 5000

# View backend logs (new terminal)
docker-compose logs -f backend

# View webhook logs specifically
docker-compose logs backend | findstr webhook

# Test backend health
curl http://localhost:5000/health

# View ngrok web interface
http://127.0.0.1:4040

# Restart backend after changes
docker-compose restart backend
```

---

**All set! Your local webhook is now exposed and ready for testing. 🚀**
