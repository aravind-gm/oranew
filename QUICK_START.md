# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Razorpay account
- Git

### 1. Database Setup (1 min)

```bash
cd backend

# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 2. Environment Variables (1 min)

Create `.env` in backend folder:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ora"

# Razorpay (get from https://dashboard.razorpay.com/app/settings/api-keys)
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx_secret

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Build & Run (2 min)

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start server
npm start

# Or with watch mode
npm run dev
```

Expected output:
```
╔════════════════════════════════════════╗
║   ORA Jewellery API Server Running    ║
╠════════════════════════════════════════╣
║   Port: 5000                          ║
║   Env:  development                   ║
```

### 4. Test the API (1 min)

```bash
# Health check
curl http://localhost:5000/health

# Response:
# {"status":"ok","timestamp":"2024-01-xx..."}
```

## 🔄 Payment Flow (Step by Step)

### Frontend Experience

1. **User adds items to cart**
   ```javascript
   POST /api/cart
   ```

2. **User fills shipping address**
   ```javascript
   POST /api/orders/checkout
   Response: { orderId, totalAmount }
   ```

3. **Initiate payment**
   ```javascript
   POST /api/payments/create
   Response: { razorpayOrderId, amount }
   ```

4. **Open Razorpay modal**
   ```javascript
   Razorpay.open(options)
   ```

5. **After payment, verify signature**
   ```javascript
   POST /api/payments/verify
   { razorpayPaymentId, razorpaySignature }
   ```

6. **Poll for webhook confirmation**
   ```javascript
   GET /api/payments/:orderId
   // Check status: PENDING → PAID
   ```

### Backend Processing

```
ORDER CREATED (PENDING)
  ↓
INVENTORY LOCKED (15 min timeout)
  ↓
PAYMENT INITIATED
  ↓
PAYMENT SIGNATURE VERIFIED (Client)
  ↓
RAZORPAY SENDS WEBHOOK
  ↓
WEBHOOK SIGNATURE VERIFIED (Server)
  ↓
INVENTORY DEDUCTED (PERMANENT)
  ↓
ORDER STATUS → PROCESSING
  ↓
CART CLEARED
  ↓
NOTIFICATION SENT
```

## 💾 Database Schema Overview

### Key Tables

```
┌─────────────┐
│   USERS     │
└─────────────┘
      │
      ├─→ ORDERS ──→ ORDER_ITEMS ──→ PRODUCTS
      │       │
      │       ├─→ PAYMENTS (Razorpay)
      │       ├─→ RETURNS
      │       └─→ INVENTORY_LOCKS
      │
      ├─→ CART_ITEMS
      ├─→ WISHLISTS
      ├─→ REVIEWS
      ├─→ ADDRESSES
      ├─→ NOTIFICATIONS
      └─→ PASSWORD_RESETS
```

### Inventory Lock Flow

```
CART              CHECKOUT              PAYMENT
├─ item qty:2 ────→ LOCK qty:2      ────→ DEDUCT qty:2
│                    expires: 15min        (permanent)
└─ available: 10     available: 8         available: 8
```

## 📊 API Endpoints

### Public
```
GET  /                          # Welcome
GET  /health                    # Health check
```

### Authentication Required
```
POST /api/auth/register         # Sign up
POST /api/auth/login            # Sign in
POST /api/auth/logout           # Sign out
```

### Shopping
```
GET  /api/products              # List products
GET  /api/products/:id          # Product details
GET  /api/categories            # List categories
POST /api/cart                  # Add to cart
GET  /api/cart                  # View cart
DELETE /api/cart/:itemId        # Remove from cart
POST /api/wishlist              # Add to wishlist
```

### Checkout & Orders
```
POST /api/orders/checkout       # Create order
GET  /api/orders                # My orders
GET  /api/orders/:id            # Order details
POST /api/orders/:id/cancel     # Cancel order
POST /api/orders/:id/return     # Request return
```

### Payments
```
POST /api/payments/create       # Initialize payment
POST /api/payments/verify       # Verify signature
POST /api/payments/webhook      # Webhook (NO AUTH)
GET  /api/payments/:orderId     # Payment status
POST /api/payments/refund       # Request refund
```

### User Account
```
GET  /api/user/profile          # My profile
PUT  /api/user/profile          # Update profile
GET  /api/user/addresses        # My addresses
POST /api/user/addresses        # Add address
```

## 🐛 Debugging

### Check Server Logs
```bash
# Watch in real-time
npm run dev

# Look for these log patterns:
# [Inventory] - inventory operations
# [Webhook] - payment webhook processing
# [Payment] - payment endpoint calls
```

### Check Database
```bash
# Open Prisma Studio
npx prisma studio

# View:
# - Orders and their status
# - Payments and verification
# - Inventory locks and expiration
# - Cart items
```

### Common Issues

**Issue**: Build fails
```bash
# Clear and rebuild
rm -rf dist node_modules
npm install
npm run build
```

**Issue**: Database connection error
```bash
# Check DATABASE_URL in .env
# Verify PostgreSQL is running
npx prisma migrate deploy
```

**Issue**: Webhook not being called
```bash
# Check Razorpay dashboard:
# Settings → Webhooks → View Delivery
# Verify webhook URL is correct
```

**Issue**: Inventory not deducting
```bash
# Verify webhook was delivered
# Check payment status: GET /api/payments/:orderId
# Review server logs for errors
```

## 🧪 Quick Test

### Create a Test Order

```bash
# 1. Get auth token (use existing or create user)
TOKEN="your-jwt-token"

# 2. Create order
curl -X POST http://localhost:5000/api/orders/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddressId": "addr-uuid",
    "billingAddressId": "addr-uuid"
  }'

# Response includes orderId

# 3. Create payment
curl -X POST http://localhost:5000/api/payments/create \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"orderId": "order-uuid"}'

# Response includes razorpayOrderId
```

## 📖 Full Documentation

- **[PAYMENT_AND_INVENTORY_IMPLEMENTATION.md](PAYMENT_AND_INVENTORY_IMPLEMENTATION.md)** - Complete technical details
- **[CRON_JOBS_GUIDE.md](CRON_JOBS_GUIDE.md)** - Background task scheduling
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Unit and integration tests
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What was built and how

## 🎯 Next Steps

### Immediate (Day 1)
- [ ] Set up database and environment variables
- [ ] Start the server
- [ ] Test basic endpoints
- [ ] Review PAYMENT_AND_INVENTORY_IMPLEMENTATION.md

### Short-term (Week 1)
- [ ] Configure Razorpay webhook in dashboard
- [ ] Test complete payment flow
- [ ] Set up cron jobs for maintenance
- [ ] Configure email notifications

### Medium-term (Week 2-4)
- [ ] Deploy to staging environment
- [ ] Run full test suite
- [ ] Load test with production-like data
- [ ] Monitor webhook delivery
- [ ] Set up alerts for failures

## 🔐 Security Checklist

- [ ] Change default passwords
- [ ] Enable HTTPS in production
- [ ] Use strong Razorpay keys
- [ ] Configure CORS properly
- [ ] Enable database backups
- [ ] Set up rate limiting
- [ ] Monitor failed payments
- [ ] Regular security audits

## 📞 Support

For issues or questions:
1. Check the documentation files
2. Review server logs with `npm run dev`
3. Open Prisma Studio: `npx prisma studio`
4. Check webhook delivery in Razorpay dashboard

## 🎉 You're All Set!

Your payment and inventory management system is ready to go. 

**Happy coding!**
