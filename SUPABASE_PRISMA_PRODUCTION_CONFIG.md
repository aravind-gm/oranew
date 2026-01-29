# 🚀 Supabase + Prisma Database Configuration Guide

This guide covers production-grade database configuration using Supabase Connection Pooler (pgbouncer) for reliable connectivity.

## ❌ Problem We're Solving

- **Random 500 errors** during Supabase restarts
- **Connection pool exhaustion** on serverless platforms
- **Backend crashes** on first database disconnect
- **Frontend breaks completely** when APIs fail
- **No automatic recovery** from temporary outages

## ✅ Solution Overview

We use **3 key components**:

1. **Supabase Connection Pooler (pgbouncer)** - Connection pooling on port 6543
2. **Prisma Client Singleton** - Single reusable connection instance
3. **Automatic 503 Retry Logic** - Frontend retries gracefully

---

## 📋 Backend Environment Variables

### For Local Development

```dotenv
# Node environment
NODE_ENV=development

# Local PostgreSQL (your machine)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ora_db"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/ora_db"
```

### For Production (Render / Vercel)

Set these in your deployment platform's environment variables dashboard:

```dotenv
# ============================================
# DATABASE - SUPABASE WITH PGBOUNCER
# ============================================

# CONNECTION POOLER (pgbouncer) - USE THIS FOR ALL QUERIES
# Port: 6543 (not 5432!)
# This prevents connection pool exhaustion on serverless
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?schema=public&pgbouncer=true"

# DIRECT CONNECTION - USE ONLY FOR MIGRATIONS
# Port: 5432 (direct to database)
# Prisma uses this for schema migrations
DIRECT_URL="postgresql://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres?schema=public"

# Node environment
NODE_ENV=production
PORT=8000
```

### How to Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **"Settings"** → **"Database"**
4. Under **"Connection pooling"**, copy the **URI** (port 6543)
5. Under **"Direct connection"**, copy the full connection string (port 5432)
6. Replace `YOUR_PROJECT_ID` and `YOUR_PASSWORD` placeholders

### Important Notes

- **DATABASE_URL**: Uses port **6543** (pgbouncer pooler) - for all queries
- **DIRECT_URL**: Uses port **5432** (direct DB) - Prisma migrations only
- Never use direct connection (5432) for runtime queries in serverless
- Always set `pgbouncer=true` in DATABASE_URL

---

## 🔌 Prisma Schema Configuration

Your `prisma/schema.prisma` should have:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      # Uses pgbouncer pooler (port 6543)
  directUrl = env("DIRECT_URL")        # Direct connection for migrations (port 5432)
}
```

This configuration allows:
- **Runtime**: Prisma uses `DATABASE_URL` (pooler, resilient)
- **Migrations**: Prisma uses `DIRECT_URL` (direct, reliable for schema changes)

---

## 📝 Frontend Environment Variables

### `.env.local` (Frontend)

```dotenv
# API endpoint (your backend URL)
NEXT_PUBLIC_API_URL=http://localhost:5000/api          # Development
NEXT_PUBLIC_API_URL=https://api.yourserver.com/api     # Production
```

No database secrets needed in frontend (they're backend-only).

---

## 🛠️ Implementation Checklist

### Backend Setup

- [ ] Update `DATABASE_URL` to use Supabase pooler (port 6543)
- [ ] Update `DIRECT_URL` to use direct connection (port 5432)
- [ ] Ensure Prisma Client Singleton is in `src/config/database.ts`
- [ ] Import `withRetry` from `src/utils/retry.ts` in your controllers
- [ ] Wrap Prisma queries with `withRetry()`:
  ```typescript
  const products = await withRetry(() =>
    prisma.product.findMany({ where, take, skip })
  );
  ```
- [ ] Error handler middleware catches `PrismaClientInitializationError` and returns 503

### Frontend Setup

- [ ] Update API client (`src/lib/api.ts`) with 503 retry logic
- [ ] Verify `NEXT_PUBLIC_API_URL` points to correct backend
- [ ] Test frontend retries on 503 responses

### Testing

- [ ] Test local development with PostgreSQL
- [ ] Deploy to Render/Vercel
- [ ] Manually restart Supabase database
- [ ] Verify frontend doesn't break
- [ ] Check logs for successful retries

---

## 🧪 Testing the Setup

### Test Database Connection

```bash
# In backend directory
npm run dev
# Watch for "[Keep-Alive] Database connected" in logs
```

### Test Retry Logic

```typescript
// In a backend route
import { withRetry } from './utils/retry';

router.get('/test-retry', async (req, res) => {
  try {
    const count = await withRetry(() =>
      prisma.product.count()
    );
    res.json({ success: true, count });
  } catch (error) {
    console.error('Retry exhausted:', error);
    res.status(503).json({ success: false, message: 'Database unavailable' });
  }
});
```

### Simulate Database Down

```typescript
// Temporarily in database.ts for testing
export const checkDatabaseHealth = async (): Promise<boolean> => {
  throw new Error("Simulated database failure");
};
```

Then:
1. Call backend API - should get 503
2. Watch frontend retry automatically
3. Fix the test error
4. Next API call succeeds

---

## 📊 Environment Variables Summary

| Variable | Development | Production | Where |
|----------|-------------|-----------|-------|
| `DATABASE_URL` | `localhost:5432` | Supabase pooler `:6543` | Backend .env |
| `DIRECT_URL` | `localhost:5432` | Supabase direct `:5432` | Backend .env |
| `NODE_ENV` | `development` | `production` | Backend .env |
| `NEXT_PUBLIC_API_URL` | `localhost:5000/api` | `api.yourserver.com/api` | Frontend .env.local |

---

## 🚨 Troubleshooting

### "Can't reach database server at db.xxx.supabase.co:5432"

**Problem**: Using direct connection (port 5432) for runtime queries

**Solution**: 
- Check `DATABASE_URL` uses port **6543**
- Add `pgbouncer=true` to URL
- Restart backend

### "Connection pool size exceeded"

**Problem**: Creating multiple Prisma instances instead of singleton

**Solution**:
- Verify `src/config/database.ts` creates only one instance
- Check no hot-reload creates new instances
- Import from config file, don't instantiate directly

### API returns 500 instead of 503

**Problem**: Error handler doesn't catch Prisma initialization error

**Solution**:
- Check `src/middleware/errorHandler.ts` imports `isPrismaInitError`
- Verify error handler is registered AFTER all routes
- Test with simple route that forces DB error

### Frontend doesn't retry

**Problem**: API client doesn't have 503 retry logic

**Solution**:
- Verify `src/lib/api.ts` has response interceptor
- Check `_retryCount` tracking in originalRequest
- Ensure retry count < 3 before retrying

---

## 📚 Additional Resources

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connection-pooling)
- [Prisma Direct URLs](https://www.prisma.io/docs/concepts/components/prisma-client/deployment#set-the-datasource-url)
- [Exponential Backoff Pattern](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)

---

## 🎯 Expected Results

After implementing these fixes:

✅ **No more 500 errors** during Supabase maintenance  
✅ **Automatic recovery** from temporary connection failures  
✅ **Frontend stays responsive** (shows loader, retries silently)  
✅ **Production-grade reliability** like major e-commerce platforms  
✅ **Graceful degradation** (503 instead of crashes)  

---

**Last Updated**: January 29, 2026  
**Status**: Production-Ready
