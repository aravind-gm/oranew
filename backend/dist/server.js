"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const supabase_1 = require("./config/supabase");
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
// Routes
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const coupon_routes_1 = __importDefault(require("./routes/coupon.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const wishlist_routes_1 = __importDefault(require("./routes/wishlist.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
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
];
// Add FRONTEND_URL if set in env
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}
console.log('[CORS] 🔐 Allowed Origins:', allowedOrigins);
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Handle preflight requests
app.options('*', (0, cors_1.default)());
// ============================================
// PATH NORMALIZATION (fix double slashes from ngrok/Razorpay)
// ============================================
app.use((req, res, next) => {
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
app.use('/api/payments/webhook', express_1.default.raw({ type: 'application/json' }));
app.use('/api/payments/webhook', express_1.default.raw({ type: 'application/json' }));
// ============================================
// UPLOAD ROUTES - MUST BE BEFORE express.json()
// ============================================
// Multer needs to handle multipart/form-data directly
// Applying express.json() before upload routes will cause 400 errors
app.use('/api/upload', upload_routes_1.default);
// Body parser middleware for all other routes
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Static files (uploads)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Request logging (development)
if (process.env.NODE_ENV === 'development') {
    app.use((req, _res, next) => {
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
app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'ORA Jewellery API',
        tagline: 'own. radiate. adorn.',
        version: '1.0.0',
    });
});
// API info endpoint
app.get('/api', (_req, res) => {
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
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Health check - detailed (for debugging)
app.get('/health/detailed', async (_req, res) => {
    const health = {
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
        const { prisma } = await Promise.resolve().then(() => __importStar(require('./config/database')));
        await prisma.$queryRaw `SELECT 1`;
        health.database.connected = true;
    }
    catch (err) {
        health.database.error = err instanceof Error ? err.message : 'Unknown error';
    }
    // Test storage configuration
    try {
        const storageResult = await (0, supabase_1.testStorageConnection)();
        health.storage.configured = (0, supabase_1.isStorageConfigured)();
        health.storage.bucketExists = storageResult.success;
        if (!storageResult.success) {
            health.storage.error = storageResult.error;
        }
    }
    catch (err) {
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
app.use('/api/auth', auth_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/categories', category_routes_1.default);
app.use('/api/cart', cart_routes_1.default);
app.use('/api/wishlist', wishlist_routes_1.default);
app.use('/api/orders', order_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/reviews', review_routes_1.default);
app.use('/api/coupons', coupon_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
// app.use('/api/upload', uploadRoutes); // Already registered above before express.json()
app.use('/api/user', user_routes_1.default);
// ============================================
// ERROR HANDLING
// ============================================
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
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
    if ((0, supabase_1.isStorageConfigured)()) {
        const storageTest = await (0, supabase_1.testStorageConnection)();
        if (storageTest.success) {
            console.log('[Startup] ✅ Supabase Storage: CONNECTED');
        }
        else {
            console.error('[Startup] ❌ Supabase Storage ERROR:', storageTest.error);
            console.log('[Startup] ⚠️  Image uploads will FAIL until this is fixed!');
        }
    }
    else {
        console.warn('[Startup] ⚠️  Supabase Storage: NOT CONFIGURED');
        console.log('         → Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
        console.log('         → Get values from: Supabase Dashboard > Project Settings > API');
    }
});
exports.default = app;
//# sourceMappingURL=server.js.map