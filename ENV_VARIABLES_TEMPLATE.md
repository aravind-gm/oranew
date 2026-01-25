# ============================================================================
# BACKEND ENVIRONMENT VARIABLES - PRODUCTION
# ============================================================================
# File: backend/.env.production
# Copy these to Vercel/Render/Railway Dashboard
# Replace [...] with actual values from Supabase/Razorpay
# ============================================================================

# DATABASE CONNECTIONS
# Get from Supabase Dashboard > Project Settings > Database
DATABASE_URL="postgresql://postgres.[PROJECT]:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:PASSWORD@db.[PROJECT].supabase.co:5432/postgres"

# SUPABASE CONFIGURATION
# Get from Supabase Dashboard > Project Settings > API
SUPABASE_URL="https://[PROJECT].supabase.co"
SUPABASE_ANON_KEY="[Copy from: API > anon (public) key]"
SUPABASE_SERVICE_ROLE_KEY="[Copy from: API > service_role (secret) key]"

# JWT AUTHENTICATION
# Generate: openssl rand -base64 32
JWT_SECRET="[Generate strong 32+ character secret]"
JWT_EXPIRES_IN="7d"

# RAZORPAY PAYMENT GATEWAY
# Get from Razorpay Dashboard > Settings > API Keys
RAZORPAY_KEY_ID="rzp_live_[production_key]"
RAZORPAY_KEY_SECRET="[production_secret_key]"
RAZORPAY_WEBHOOK_SECRET="[webhook_secret_from_razorpay]"

# CORS & FRONTEND CONFIGURATION
FRONTEND_URL="https://orashop.com"
ALLOWED_ORIGINS="https://orashop.com,https://www.orashop.com,https://app.orashop.com"

# SERVER CONFIGURATION
NODE_ENV="production"
PORT="3001"

# EMAIL CONFIGURATION (Optional)
# For SendGrid or SMTP
EMAIL_HOST="smtp.titan.email"
EMAIL_PORT="587"
EMAIL_USER="admin@orashop.in"
EMAIL_PASS="[email_password]"
EMAIL_FROM="ORA Jewellery <admin@orashop.in>"

# ============================================================================
# FRONTEND ENVIRONMENT VARIABLES - PRODUCTION
# ============================================================================
# File: frontend/.env.production
# Set in Vercel Dashboard > Project > Settings > Environment Variables
# ============================================================================

# API CONFIGURATION
NEXT_PUBLIC_API_URL="https://api.orashop.com"
NEXT_PUBLIC_API_TIMEOUT="30000"

# RAZORPAY PAYMENT GATEWAY
NEXT_PUBLIC_RAZORPAY_KEY="rzp_live_[production_key]"

# SITE CONFIGURATION
NEXT_PUBLIC_SITE_URL="https://orashop.com"
NEXT_PUBLIC_SITE_NAME="ORA Jewellery"

# SUPABASE (Optional - if using client-side, not recommended)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon_key]"

# FEATURE FLAGS
NEXT_PUBLIC_ENABLE_ANALYTICS="true"
NEXT_PUBLIC_ENABLE_CHAT="false"

# ============================================================================
# STEP-BY-STEP: How to Set Environment Variables
# ============================================================================

# FOR VERCEL:
# 1. Go to https://vercel.com/dashboard
# 2. Select your project (ora-jewellery-frontend)
# 3. Settings > Environment Variables
# 4. Add each variable one by one:
#    - Variable name: NEXT_PUBLIC_API_URL
#    - Value: https://api.orashop.com
#    - Select: Production
#    - Click "Add"
# 5. Repeat for all variables
# 6. Redeploy for changes to take effect

# FOR BACKEND (Render.com / Railway / Vercel):
# 1. Go to service dashboard (Render/Railway/Vercel)
# 2. Settings > Environment Variables
# 3. Paste all backend variables
# 4. Click "Save" or "Deploy"
# 5. Service will redeploy with new environment

# FOR LOCAL DEVELOPMENT:
# 1. Create backend/.env (not .env.production)
# 2. Copy values from backend/.env.example
# 3. Replace with local/development values:
#    DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres"
#    FRONTEND_URL="http://localhost:3000"
#    NODE_ENV="development"

# ============================================================================
# IMPORTANT SECURITY NOTES
# ============================================================================

# ⚠️ NEVER commit .env files to git
# ⚠️ NEVER expose DIRECT_URL publicly (migrations only)
# ⚠️ NEVER hardcode secrets in source code
# ⚠️ Use platform secrets dashboard (Vercel/Render) for production
# ⚠️ Rotate JWT_SECRET every 6 months
# ⚠️ Use different secrets per environment (dev/staging/prod)

# ============================================================================
# HOW TO GENERATE JWT_SECRET
# ============================================================================

# Run this command in terminal:
# openssl rand -base64 32

# Example output:
# aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890+/=

# Use this output as JWT_SECRET value

# ============================================================================
# SUPABASE API KEYS - WHERE TO FIND THEM
# ============================================================================

# 1. Go to https://app.supabase.com
# 2. Select your project
# 3. Click "Settings" (bottom left)
# 4. Go to "API"
# 5. You'll see:
#    - Project URL (SUPABASE_URL)
#    - anon (public) key (SUPABASE_ANON_KEY)
#    - service_role (secret) key (SUPABASE_SERVICE_ROLE_KEY)

# ⚠️ Keep service_role key SECRET - never expose to frontend!

# ============================================================================
# RAZORPAY API KEYS - WHERE TO FIND THEM
# ============================================================================

# 1. Go to https://dashboard.razorpay.com
# 2. Settings > API Keys
# 3. You'll see:
#    - Key ID (RAZORPAY_KEY_ID)
#    - Key Secret (RAZORPAY_KEY_SECRET)
# 4. For webhooks:
#    - Accounts & Billing > Webhooks
#    - Create webhook for payment.authorized and payment.failed
#    - Copy webhook secret (RAZORPAY_WEBHOOK_SECRET)

# ============================================================================
# VERIFICATION CHECKLIST
# ============================================================================

# Before going to production, verify:
# 
# ☐ DATABASE_URL points to pooler (pgbouncer=true)
# ☐ DIRECT_URL uses db.*.supabase.co (for migrations only)
# ☐ JWT_SECRET is strong (32+ characters, unique)
# ☐ RAZORPAY keys are PRODUCTION (rzp_live_*), not test
# ☐ FRONTEND_URL matches your production domain
# ☐ SUPABASE_ANON_KEY matches Supabase dashboard
# ☐ EMAIL credentials are correct (if using email)
# ☐ All required variables are set (no empty values)
# ☐ No secrets in .env files in git
# ☐ Vercel/Render has all variables configured

# ============================================================================
