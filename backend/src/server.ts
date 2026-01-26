/// <reference types="express" />
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application, NextFunction, Request, Response } from 'express';
import path from 'path';

// Augment Express Request with custom user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: import('@prisma/client').UserRole;
      };
    }
  }
}

import { isStorageConfigured, testStorageConnection } from './config/supabase';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

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

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8000;

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
    },
  });
});

// Health check - basic
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Health check - detailed (for debugging)
app.get('/health/detailed', async (_req: Request, res: Response) => {
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
});

// API Routes
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
// START SERVER
// ============================================

app.listen(PORT, async () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   ORA Jewellery API Server Running    ║
  ║   own. radiate. adorn.                ║
  ╠════════════════════════════════════════╣
  ║   Port: ${PORT.toString().padEnd(30)}║
  ║   Env:  ${(process.env.NODE_ENV || 'development').padEnd(30)}║
  ╚════════════════════════════════════════╝
  `);
  
  // Test Supabase Storage connection at startup
  console.log('\n[Startup] 🔍 Checking Supabase Storage configuration...');
  
  if (isStorageConfigured()) {
    const storageTest = await testStorageConnection();
    if (storageTest.success) {
      console.log('[Startup] ✅ Supabase Storage: CONNECTED');
    } else {
      console.error('[Startup] ❌ Supabase Storage ERROR:', storageTest.error);
      console.log('[Startup] ⚠️  Image uploads will FAIL until this is fixed!');
    }
  } else {
    console.warn('[Startup] ⚠️  Supabase Storage: NOT CONFIGURED');
    console.log('         → Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
    console.log('         → Get values from: Supabase Dashboard > Project Settings > API');
  }
});

export default app;
