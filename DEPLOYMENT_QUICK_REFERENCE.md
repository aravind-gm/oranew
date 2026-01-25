# Production Deployment Quick Reference Card
## ORA Jewellery — One-Page Cheat Sheet

---

## 🎯 THE 5-STEP DEPLOYMENT PROCESS

```
STEP 1: SUPABASE
  └─ Enable RLS policies (1 hour)
  └─ Copy project URL, keys

STEP 2: BACKEND
  └─ Choose platform: Render/Railway/Vercel
  └─ Set environment variables
  └─ Deploy and verify API responding

STEP 3: FRONTEND
  └─ Deploy to Vercel
  └─ Set environment variables
  └─ Verify collections page loads

STEP 4: DNS
  └─ Point domains to deployed services
  └─ Wait for propagation (5-30 min)

STEP 5: TEST
  └─ Run smoke tests
  └─ Verify all endpoints working
  └─ Go live!
```

---

## 🔑 CRITICAL ENVIRONMENT VARIABLES

### Backend (.env)
```
DATABASE_URL=postgresql://...@pooler.supabase.com:6543/...
DIRECT_URL=postgresql://...@db.supabase.co:5432/...
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=[GET FROM SUPABASE DASHBOARD]
SUPABASE_SERVICE_ROLE_KEY=[GET FROM SUPABASE DASHBOARD]
JWT_SECRET=[GENERATE: openssl rand -base64 32]
RAZORPAY_KEY_ID=rzp_live_[YOUR_KEY]
RAZORPAY_KEY_SECRET=[YOUR_SECRET]
FRONTEND_URL=https://orashop.com
NODE_ENV=production
```

### Frontend (.env)
```
NEXT_PUBLIC_API_URL=https://api.orashop.com
NEXT_PUBLIC_RAZORPAY_KEY=rzp_live_[KEY]
NEXT_PUBLIC_SITE_URL=https://orashop.com
```

---

## 🚀 DEPLOYMENT COMMANDS

### Backend (Render.com - Recommended)
```bash
# 1. Create render.yaml in repo
# 2. Push to GitHub
# 3. Visit render.com/dashboard > New > Web Service
# 4. Connect GitHub repo
# 5. Set environment variables
# 6. Click "Create Web Service"

# Verify:
curl https://ora-backend.onrender.com/api/health
```

### Frontend (Vercel)
```bash
# Option A: Via CLI
npm i -g vercel
cd frontend
vercel --prod

# Option B: Via Dashboard
# 1. Visit vercel.com/new
# 2. Import GitHub repo
# 3. Select root: ./frontend
# 4. Add environment variables
# 5. Click "Deploy"

# Verify:
curl https://[your-vercel-domain].vercel.app/
```

### Database Migrations
```bash
npx prisma migrate deploy
# Runs automatically on backend deploy
```

---

## ✅ CRITICAL SUPABASE RLS POLICIES

```sql
-- Copy-paste into Supabase SQL Editor

-- PRODUCTS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "admin_all" ON products FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');

-- PRODUCT_IMAGES
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON product_images FOR SELECT USING (true);
CREATE POLICY "admin_write" ON product_images FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');

-- CATEGORIES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "admin_all" ON categories FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
```

---

## 🔗 DNS CONFIGURATION

### For Vercel Frontend
```
Type: CNAME
Name: orashop.com (or @)
Value: cname.vercel-dns.com
```

### For Render Backend
```
Type: CNAME
Name: api
Value: [render-domain].onrender.com
```

### Verify DNS
```bash
nslookup orashop.com
nslookup api.orashop.com
# Should show CNAME records pointing to correct services
```

---

## 🧪 SMOKE TEST COMMANDS

```bash
# API Health
curl https://api.orashop.com/api/health

# Products (should show ALL active products)
curl https://api.orashop.com/api/products?limit=10

# Categories
curl https://api.orashop.com/api/categories

# Frontend
curl https://orashop.com/

# Collections Page
curl https://orashop.com/collections

# Image Loading (should return HTTP 200)
curl "https://[project].supabase.co/storage/v1/object/public/product-images/[filename]"

# Admin Requires Auth
curl https://api.orashop.com/api/admin/products
# Should return HTTP 401

# With Valid Token
curl -H "Authorization: Bearer [token]" \
  https://api.orashop.com/api/admin/products
# Should return HTTP 200
```

---

## 🚨 TROUBLESHOOTING

### API Not Responding
```bash
# Check backend logs
# 1. Vercel: vercel logs
# 2. Render: Dashboard > Logs
# 3. Check environment variables are set
# 4. Verify database connection string is valid
```

### Images Not Loading
```bash
# 1. Check image URL format:
#    https://[project].supabase.co/storage/v1/object/public/product-images/...
# 2. Verify bucket is public
# 3. Check CORS allowed in Supabase
# 4. Open DevTools > Network > Check HTTP status
```

### CORS Errors
```bash
# Check backend CORS configuration
# Should be: origin: ['https://orashop.com']
# NOT: origin: '*'

# Test CORS:
curl -H "Origin: https://orashop.com" \
  https://api.orashop.com/api/products -v
# Should see: Access-Control-Allow-Origin: https://orashop.com
```

### Database Connection Issues
```bash
# Verify connection string format:
postgresql://user:password@host:6543/database?pgbouncer=true

# Test locally:
psql "postgresql://..."

# For migrations, use DIRECT_URL (not DATABASE_URL)
```

---

## 📊 KEY ENDPOINTS

### Public (No Auth)
```
GET  /api/products              → All active products
GET  /api/products?category=... → Filtered by category
GET  /api/products/:slug        → Single product by slug
GET  /api/categories            → All active categories
GET  /api/categories/:slug      → Single category
```

### Admin (Auth Required)
```
POST   /api/admin/products      → Create product
PUT    /api/admin/products/:id  → Update product
DELETE /api/admin/products/:id  → Delete product
POST   /api/upload              → Upload image to Supabase
```

### Payment
```
POST /api/payments/webhook      → Razorpay webhook
```

---

## 💾 BACKUP COMMANDS

### Database Backup
```bash
# Manual backup
pg_dump [CONNECTION_STRING] > backup-$(date +%Y%m%d).sql

# Restore
psql [CONNECTION_STRING] < backup-20260125.sql

# Supabase handles daily backups automatically
# View at: Dashboard > Database > Backups
```

---

## 🔄 ROLLBACK PROCEDURE

### Frontend (Vercel)
```bash
# View deployments
vercel list

# Rollback to previous
vercel rollback [project-url]

# Or manually: Dashboard > Deployments > Select previous > Promote
```

### Backend (Render)
```bash
# Dashboard > Deployments > Select previous > Deploy
```

### Database
```bash
# Supabase Dashboard > Backups > Restore
# Select backup date and confirm
# This will overwrite current database
```

---

## 📈 MONITORING CHECKLIST

- [ ] Set up Sentry for error tracking: https://sentry.io
- [ ] Enable Vercel Analytics: Dashboard > Analytics
- [ ] Set up Uptime Robot: https://uptimerobot.com
- [ ] Configure email alerts for errors
- [ ] Monitor database performance
- [ ] Track API response times
- [ ] Monitor error rates (should be < 1%)

---

## 🔐 SECURITY QUICK CHECKLIST

- [ ] No secrets in git history
- [ ] .env files in .gitignore
- [ ] RLS policies enabled
- [ ] CORS configured (not *)
- [ ] HTTPS enforced
- [ ] JWT tokens validated
- [ ] Rate limiting enabled
- [ ] Errors don't leak sensitive info

---

## 📚 DETAILED GUIDES (When You Need Them)

```
PRODUCTION_DEPLOYMENT_GUIDE.md      ← Start here
VERCEL_DEPLOYMENT_SETUP.md          ← For Vercel setup
SUPABASE_INTEGRATION_GUIDE.md       ← For Supabase/RLS
COMPLETE_IMPLEMENTATION_ROADMAP.md  ← Week-by-week plan
PRE_DEPLOYMENT_VERIFICATION.md      ← Security checklist
```

---

## ⏱️ TIME ESTIMATES

| Task | Time |
|------|------|
| Read guides | 2 hours |
| Supabase setup | 1 hour |
| Backend deploy | 1 hour |
| Frontend deploy | 1 hour |
| DNS setup | 30 min |
| Testing | 1 hour |
| **Total** | **~6.5 hours** |

---

## 🎯 SUCCESS CRITERIA

✅ Collections page loads with all active products  
✅ Images display correctly from Supabase  
✅ Category filtering works  
✅ Admin can create/edit/delete products  
✅ Payment processing works  
✅ API responds in < 500ms  
✅ Error rate < 1%  
✅ Uptime > 99%  

---

## 🆘 EMERGENCY CONTACTS

- **Vercel Support:** https://vercel.com/support
- **Supabase Support:** https://supabase.com/support
- **Render Support:** https://render.com/docs
- **GitHub Issues:** Your repo issues

---

**Print This Card & Keep It Handy During Deployment!**

Status: ✅ READY FOR PRODUCTION  
Last Updated: January 25, 2026
