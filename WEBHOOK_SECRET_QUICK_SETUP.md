# ⚡ QUICK: Razorpay Webhook Secret Setup

## 5-Minute Setup

### 1️⃣ Get Secret (2 min)
```
→ Go to: https://dashboard.razorpay.com
→ Click: Settings (⚙️)
→ Click: Webhooks
→ Click: Add webhook
→ Enter URL: https://razorpay-webhook-zm3s.onrender.com/webhook/razorpay
→ Select: ✓ payment.captured, ✓ payment.failed
→ Copy: Signing Secret
```

### 2️⃣ Add to `.env` (1 min)
```bash
# File: backend/.env
RAZORPAY_WEBHOOK_SECRET="paste_copied_secret_here"
```

### 3️⃣ Restart Server (1 min)
```bash
cd backend
npm run dev    # Local
# OR redeploy on Render/production
```

### 4️⃣ Verify (1 min)
```
→ Razorpay dashboard → Webhooks → Click "Test webhook"
→ Check backend logs for: ✓ Signature verification: OK
```

---

## Current Status

| Component | Status |
|-----------|--------|
| Backend webhook endpoint | ✅ Ready |
| Payment.captured handling | ✅ Ready |
| Payment.failed handling | ✅ Ready |
| Frontend success page | ✅ Ready |
| Frontend failed page | ✅ Ready |
| Signature verification | ✅ Ready |
| **Webhook Secret** | ⏳ **Needs Setup** |

---

## Next Steps

1. **Now:** Add webhook secret to `backend/.env`
2. **Then:** Restart backend server
3. **Test:** Use Razorpay "Test webhook" feature
4. **Production:** Add same secret to Render environment vars

---

## Secret Location Reference

### Local Development
```
File: /home/aravind/Downloads/oranew/backend/.env
Line: RAZORPAY_WEBHOOK_SECRET="..."
```

### Production (Render)
```
Dashboard → Backend Service → Environment → Add RAZORPAY_WEBHOOK_SECRET
```

### Environment Fallback
```
Code tries: RAZORPAY_WEBHOOK_SECRET → falls back to → RAZORPAY_KEY_SECRET
```
**Use RAZORPAY_WEBHOOK_SECRET explicitly for security!**

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Signature verification FAILED" | Secret doesn't match Razorpay → Copy again |
| "Webhook secret not configured" | Not in .env or typo in name → Check .env |
| Webhook not being called | URL wrong or firewall blocking → Test in Razorpay |
| "Already CONFIRMED" logs | NORMAL - webhook received twice → Check logs |

---

## Commands Reference

```bash
# View current webhook secret (development only)
grep RAZORPAY_WEBHOOK_SECRET backend/.env

# Restart backend to apply new secret
cd backend && npm run dev

# Check if webhook is being received
tail -f logs.txt | grep "Webhook"

# Test webhook locally with ngrok
ngrok http 8000
# Then update Razorpay URL to ngrok HTTPS URL
```

---

## Done? Checklist

- [ ] Copied webhook secret from Razorpay
- [ ] Pasted into `backend/.env`
- [ ] Restarted backend
- [ ] Tested with Razorpay test button
- [ ] Saw ✓ Signature verification: OK in logs
- [ ] Ready for production deployment

✅ **All set! Payment webhook is now active.**
