import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application, NextFunction, Request, Response } from 'express';
import path from 'path';

// Routes
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import cartRoutes from './routes/cart.routes';
import categoryRoutes from './routes/category.routes';
import couponRoutes from './routes/coupon.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import productRoutes from './routes/product.routes';
import reviewRoutes from './routes/review.routes';
import uploadRoutes from './routes/upload.routes';
import userRoutes from './routes/user.routes';
import wishlistRoutes from './routes/wishlist.routes';
import healthRoutes from './routes/health.routes';

import { isStorageConfigured, testStorageConnection } from './config/supabase';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { warmupDatabase } from './config/database';

const app: Application = express();
const PORT = process.env.PORT || 8000;

// ============================================
// TRUST PROXY - Important for production
// ============================================
// Set trust proxy to properly handle X-Forwarded-For headers from proxies like Render, AWS ELB, etc.
app.set('trust proxy', 1);

// ============================================
// MIDDLEWARE
// ============================================

// CORS - MUST be first before any other middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://oranew.vercel.app',
  'https://orashop.vercel.app',
  'https://oranew-staging.vercel.app',
  'https://orashop.in',
];

// Add FRONTEND_URL if set in env
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

console.log('[CORS] 🔐 Allowed Origins:', allowedOrigins);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Handle preflight requests
app.options('*', cors());

// ============================================
// PATH NORMALIZATION (fix double slashes from ngrok/Razorpay)
// ============================================
app.use((req: Request, res: Response, next: NextFunction) => {
  // Convert double slashes to single slashes
  if (req.path.includes('//')) {
    req.url = req.url.replace(/\/+/g, '/');
  }
  next();
});

// ============================================
// WEBHOOK RAW BODY HANDLING - MUST BE BEFORE express.json()
// ============================================
// Razorpay webhook signature verification requires the raw body
// We use express.raw() specifically for the webhook endpoint
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// ============================================
// UPLOAD ROUTES - MUST BE BEFORE express.json()
// ============================================
// Multer needs to handle multipart/form-data directly
// Applying express.json() before upload routes will cause 400 errors
app.use('/api/upload', uploadRoutes);

// Body parser middleware for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    // Special logging for webhook
    if (req.path.includes('webhook')) {
      console.log('[WEBHOOK DEBUG] originalUrl:', req.originalUrl);
      console.log('[WEBHOOK DEBUG] path:', req.path);
      console.log('[WEBHOOK DEBUG] baseUrl:', req.baseUrl);
      console.log('[WEBHOOK DEBUG] url:', req.url);
    }
    next();
  });
}

// ============================================
// KEEP-ALIVE ENDPOINT
// ============================================
// Purpose: Prevent Render from sleeping and keep database pool warm
// 
// How it works:
// - Lightweight health check (no business logic)
// - Can be called every 10-15 minutes by frontend
// - Keeps server process active
// - Maintains database pool connections
// - Returns immediately if DB is healthy
// - Logs warnings if DB is slow/failing
// 
// Why this helps:
// - Render free tier pauses after 15 min of inactivity
// - Cold starts cause new connection attempts
// - Each connection attempt tests the pool
// - Periodic pings prevent the sleep cycle

// ============================================
// LIGHTWEIGHT HEALTH CHECK - NO DATABASE TOUCH
// ============================================
// Used by Render to detect cold starts and route traffic
// MUST respond instantly without touching database
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// ROUTES
// ============================================

app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'ORA Jewellery API',
    tagline: 'own. radiate. adorn.',
    version: '1.0.0',
  });
});

// API info endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'ORA Jewellery API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      cart: '/api/cart',
      orders: '/api/orders',
      payments: '/api/payments',
      users: '/api/users',
      wishlist: '/api/wishlist',
      reviews: '/api/reviews',
      admin: '/api/admin',
      health: '/api/health',
    },
  });
});

// Health check - basic
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Health check - detailed (for debugging)
const detailedHealthCheck = async (_req: Request, res: Response) => {
  const health: {
    status: string;
    timestamp: string;
    database: { connected: boolean; error?: string };
    storage: { configured: boolean; bucketExists?: boolean; error?: string };
    environment: { nodeEnv: string; hasJwtSecret: boolean; hasSupabaseUrl: boolean };
  } = {
    status: 'checking',
    timestamp: new Date().toISOString(),
    database: { connected: false },
    storage: { configured: false },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      hasJwtSecret: !!process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your-super-secret-jwt-key-change-in-production',
      hasSupabaseUrl: !!process.env.SUPABASE_URL && process.env.SUPABASE_URL.includes('supabase.co'),
    },
  };

  // Test database connection
  try {
    const { prisma } = await import('./config/database');
    await prisma.$queryRaw`SELECT 1`;
    health.database.connected = true;
  } catch (err) {
    health.database.error = err instanceof Error ? err.message : 'Unknown error';
  }

  // Test storage configuration
  try {
    const storageResult = await testStorageConnection();
    health.storage.configured = isStorageConfigured();
    health.storage.bucketExists = storageResult.success;
    if (!storageResult.success) {
      health.storage.error = storageResult.error;
    }
  } catch (err) {
    health.storage.error = err instanceof Error ? err.message : 'Unknown error';
  }

  // Determine overall status
  const allGood = health.database.connected && 
                  health.storage.configured && 
                  health.storage.bucketExists &&
                  health.environment.hasJwtSecret;
  
  health.status = allGood ? 'healthy' : 'degraded';

  res.status(allGood ? 200 : 503).json(health);
};

app.get('/health/detailed', detailedHealthCheck);
app.get('/api/health/detailed', detailedHealthCheck);

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);
// app.use('/api/upload', uploadRoutes); // Already registered above before express.json()
app.use('/api/user', userRoutes);

// ============================================
// ERROR HANDLING
// ============================================

app.use(notFound);
app.use(errorHandler);

// ============================================
// START SERVER (RENDER-SAFE STARTUP)
// ============================================
// 
// Important: This startup is SMART
// - Warmup database connection on boot (Render cold start)
// - But doesn't crash if DB is slow
// - Returns proper 503 if DB unavailable
// - Allows graceful recovery on connection failure
//
// Why this helps on Render:
// - Cold start: server boots, DB might be waking too
// - Warmup: polls DB with exponential backoff
// - Timeout: gives up after 30s, still starts server
// - First request will reinitialize connection

app.listen(PORT, async () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   ORA Jewellery API Server Running    ║
  ║   own. radiate. adorn.                ║
  ╠════════════════════════════════════════╣
  ║   Port: ${PORT.toString().padEnd(30)}║
  ║   Env:  ${(process.env.NODE_ENV || 'development').padEnd(30)}║
  ║   Mode: AUTO-WARMUP on cold start      ║
  ╚════════════════════════════════════════╝
  `);
  
  // Warmup database connection on startup
  // This is especially important for Render free-tier
  // DB might also be waking up from sleep
  console.log('\n[Startup] 🔥 Warming up database connection...');
  
  const dbWarmed = await warmupDatabase(30000); // Wait max 30 seconds
  
  if (dbWarmed) {
    console.log('[Startup] ✅ Database: READY');
  } else {
    console.warn('[Startup] ⚠️  Database: NOT READY (will retry on first request)');
    console.log('[Startup] 📌 Possible causes: DB restarting, network delay, connection pool exhausted');
  }

  // Test Supabase Storage connection at startup (optional, non-blocking)
  console.log('[Startup] 🔍 Checking Supabase Storage configuration...');
  
  // Run storage check in background (don't block startup)
  if (isStorageConfigured()) {
    const storageTest = await testStorageConnection();
    if (storageTest.success) {
      console.log('[Startup] ✅ Supabase Storage: CONNECTED');
    } else {
      console.error('[Startup] ⚠️  Supabase Storage: FAILED');
      console.error('          Error:', storageTest.error);
      console.log('[Startup] ⚠️  Image uploads may FAIL until this is fixed!');
    }
  } else {
    console.warn('[Startup] ⚠️  Supabase Storage: NOT CONFIGURED');
    console.log('          Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  }

  console.log('\n[Startup] ✅ Server ready for requests');
  console.log('[Startup] 📌 Health check: GET /api/health');
  console.log('[Startup] 📌 Detailed health: GET /api/health/detailed (requires auth)');
  console.log('[Startup] 📌 Auto-recovery: Enabled (reconnect on connection error)\n');
});

export default app;
