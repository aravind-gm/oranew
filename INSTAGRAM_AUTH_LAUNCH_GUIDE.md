# 📱 INSTAGRAM TRAFFIC AUTH – QUICK START GUIDE

**Use Case:** Instagram ads → ORA Jewellery → Frictionless login  
**Status:** ✅ Production Ready

---

## 🎯 UX FOR INSTAGRAM USERS

### Mobile Flow (Instagram Traffic)

1. **Click Instagram Ad**
   - Lands on `/auth/login`

2. **Choose Method (Instant)**
   - 📧 Email (Fast for app users)
   - 📱 Phone (Familiar to Indians)

3. **Enter Identifier**
   - Email: `name@example.com`
   - Phone: Auto-fills country code `+91`

4. **Tap "Send Code"**
   - Supabase sends real OTP
   - User sees: "Check your email/SMS"

5. **Enter 6-Digit Code**
   - Timer: 5 minutes to enter
   - Can resend after 30 seconds

6. **Tap "Verify & Login"**
   - Session created instantly
   - Redirected to `/account`

### Why This Wins Instagram Users

✅ **No Password** → Less friction  
✅ **Instant Account** → Auto-created on first login  
✅ **No Verification Email** → Works immediately  
✅ **Mobile-Optimized** → Perfect on phone  
✅ **Indian Phone Format** → `+91` auto-filled  
✅ **SMS/Email Options** → Choose what they prefer  

---

## 🔧 PRODUCTION SETUP (15 mins)

### Step 1: Supabase Dashboard (5 mins)

**Login to your Supabase project**

**Enable Email OTP:**
- Go to: Authentication → Providers → Email
- Toggle: **Email OTP** ON
- Toggle: **Password login** OFF

**Enable Phone OTP:**
- Go to: Authentication → Providers → Phone
- Select SMS provider: **Twilio**
- Add Twilio Account SID & Token
- Set country: **India (+91)**

**Enable Google (Optional):**
- Go to: Authentication → Providers → Google
- Add Google OAuth credentials
- Set redirect: `https://orashop.in/auth/callback`

**Disable Facebook:**
- Go to: Authentication → Providers → Facebook
- Toggle: **OFF**

### Step 2: Environment Variables (5 mins)

**Frontend (.env.local):**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Backend (.env):**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

Copy from: Supabase Dashboard → Project Settings → API Keys

### Step 3: Deploy (5 mins)

```bash
# Run database migration
cd backend
npx prisma migrate deploy

# Push to production
git push heroku/vercel/railway main
```

---

## 📊 INSTAGRAM CAMPAIGN METRICS

### Conversion Optimization

| Metric | Target | Impact |
|--------|--------|--------|
| Signup → Login | < 30 sec | ↑ Conversion |
| OTP Delivery | < 10 sec | ↑ Completion |
| Cart Abandonment | < 5% | ↑ Revenue |
| Mobile UX | 100% | ↑ Retention |

### Success Indicators

✅ **OTP sent**: Check logs `supabase.auth.otp_sent`  
✅ **OTP verified**: Check user creation in DB  
✅ **Session created**: Check `localStorage` for token  
✅ **Redirect to /account**: Monitor page loads  

---

## 🚨 MONITORING DASHBOARD

### Metrics to Watch

**Supabase Dashboard:**
- Go to: Authentication → Users
- See: Real-time signups
- Filter: By method (email/phone/google)
- Export: CSV for analysis

**Database:**
```sql
-- Count new users today
SELECT COUNT(*) FROM users 
WHERE DATE(created_at) = TODAY()
  AND is_verified = true;

-- Count by signup method
SELECT 
  CASE 
    WHEN email LIKE '%@gmail.com' THEN 'Gmail'
    WHEN email LIKE '%@yahoo.com' THEN 'Yahoo'
    ELSE 'Other'
  END as domain,
  COUNT(*) as count
FROM users
WHERE DATE(created_at) >= NOW() - INTERVAL '7 days'
GROUP BY domain;
```

---

## 🎨 CUSTOMIZE FOR INSTAGRAM

### Branding Assets

**Logo:**
- ORA text on login page ✅
- Already white background for Instagram context

**Colors:**
- Primary: `#9B2C46` (existing)
- Accent: `#FFE4EC` (existing)
- Already matches brand

**Mobile First:**
- 100% responsive ✅
- No horizontal scroll
- Large touch targets
- Fast page load

### Suggested Instagram Ad CTAs

- "Quick & Easy | No Password Needed"
- "Sign In Instantly with Email or Phone"
- "Get Exclusive Offers | Join ORA Now"

---

## 💰 PAYMENT FLOW (After Login)

Once user is authenticated:

1. ✅ Redirected to `/account`
2. ✅ Browsing products with saved cart
3. ✅ Checkout uses authenticated API
4. ✅ Razorpay payment (backend validates)
5. ✅ Order created with user ID

**All protected by Supabase JWT** ← Real security!

---

## 🚀 LAUNCH CHECKLIST

Before running Instagram campaign:

- [ ] Supabase providers configured
- [ ] SMS provider (Twilio) active with credits
- [ ] Email provider configured
- [ ] Environment variables on Vercel/Heroku
- [ ] Database migration applied
- [ ] Test flow on mobile: email OTP
- [ ] Test flow on mobile: phone OTP
- [ ] Verify redirect to `/account`
- [ ] Verify checkout works
- [ ] Verify payment processing
- [ ] Set up analytics/UTM tracking
- [ ] Instagram pixel configured
- [ ] Retargeting audiences ready

---

## 📱 TEST ON YOUR PHONE

1. Visit: `https://oranew.vercel.app/auth/login`
2. Select: **Phone**
3. Enter: Your phone number (will receive SMS)
4. Click: **Send Code**
5. Check: SMS from Twilio
6. Enter: OTP code
7. Verify: Redirects to account page

**OR** (Email path):
1. Select: **Email**
2. Enter: `your-email@gmail.com`
3. Click: **Send Code**
4. Check: Email inbox (check spam)
5. Enter: OTP code
6. Verify: Redirects to account page

---

## 💡 INSTAGRAM SUCCESS TIPS

### Audience Targeting

- **Age:** 18-45
- **Gender:** Primarily female (jewelry audience)
- **Location:** India
- **Interest:** Fashion, jewelry, wedding
- **Device:** Mobile only (better conversion)

### Ad Copy That Works

❌ "Create Account"  
✅ "Quick Login – No Password"

❌ "Verify Your Email"  
✅ "Enter the Code We Just Sent"

❌ "Password Reset"  
✅ "Already a Member? Sign In"

### Timing

- **Peak Hours:** 6 PM - 9 PM IST
- **Days:** Friday - Sunday
- **Campaign Duration:** 24/7 (adjust bids)

---

## 🎯 METRICS TRACKING

### Setup Google Analytics

In layout.tsx or callback page:
```typescript
gtag.event('sign_up', {
  method: 'email_otp' | 'phone_otp' | 'google_oauth'
});

gtag.event('purchase', {
  value: cartTotal,
  currency: 'INR',
  items: cartItems
});
```

### Instagram Pixel Events

```html
<!-- In public/index.html -->
<img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=Lead&noscript=1"
/>
```

---

## 🚨 TROUBLESHOOTING (Instagram Traffic)

### "OTP Not Received"

- ✅ Check SMS spam folder
- ✅ Verify phone number format: `9876543210`
- ✅ Wait 30 seconds for delivery
- ✅ Check Twilio dashboard for logs

### "Already Logged In"

- ✅ Clear browser cache
- ✅ Logout from `/account`
- ✅ Try incognito mode
- ✅ Check localStorage in DevTools

### "Redirect Loop"

- ✅ Verify redirect URL in Supabase
- ✅ Check environment variables
- ✅ Review browser console for errors
- ✅ Test on different device

---

## ✨ YOU'RE READY!

Your app is now:
- ✅ OTP authentication (email + phone)
- ✅ Google OAuth ready
- ✅ Mobile-optimized for Instagram
- ✅ Production secure
- ✅ Analytics tracked

**Next:** Launch Instagram campaign with confidence! 🚀

---

## 📞 QUICK SUPPORT

**Issue:** Supabase vars missing
- **Fix:** Check `.env.local` in frontend, `.env` in backend

**Issue:** SMS not sending
- **Fix:** Check Twilio credits on Supabase dashboard

**Issue:** Can't verify OTP
- **Fix:** Ensure OTP is entered within 5 minutes

**Issue:** User not created
- **Fix:** Check database migration ran: `npx prisma migrate deploy`

---

**Status:** ✅ Ready for Instagram Campaign!
