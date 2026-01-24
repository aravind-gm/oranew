# ORA Jewellery - Complete Setup Guide

> **own. radiate. adorn.**

This guide will walk you through setting up the complete ORA e-commerce platform from scratch.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Database Setup](#database-setup)
6. [Environment Configuration](#environment-configuration)
7. [Running the Application](#running-the-application)
8. [Admin Access](#admin-access)
9. [Payment Integration](#payment-integration)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** (comes with Node.js)
- **Git** (optional, for version control)

### Check Installations

```bash
node --version   # Should be v18+
npm --version    # Should be v9+
psql --version   # Should be 14+
```

---

## 📁 Project Structure

```
oranew/
├── backend/               # Express.js API
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   ├── src/
│   │   ├── controllers/  # Business logic
│   │   ├── middleware/   # Auth, error handling
│   │   ├── routes/       # API endpoints
│   │   ├── utils/        # Helper functions
│   │   └── server.ts     # Entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/              # Next.js customer & admin UI
│   ├── src/
│   │   ├── app/          # Pages (App Router)
│   │   ├── components/   # Reusable UI components
│   │   ├── store/        # Zustand state management
│   │   └── lib/          # API client
│   ├── .env.local.example
│   └── package.json
│
├── docker-compose.yml     # Local development setup
├── README.md
└── ARCHITECTURE.md
```

---

## 🚀 Backend Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

Create `.env` file in `backend/` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Database
DATABASE_URL="postgresql://ora_user:ora_password@localhost:5432/ora_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-CHANGE-THIS"
JWT_EXPIRES_IN="24h"

# Server
PORT=5000
NODE_ENV="development"

# Cloudinary (Image Storage)
CLOUDINARY_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Razorpay (Payment Gateway)
RAZORPAY_KEY_ID="rzp_test_xxxxx"
RAZORPAY_KEY_SECRET="your-secret"

# Email (Gmail SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@orashop.in"

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

### Step 3: Setup PostgreSQL Database

#### Option A: Local PostgreSQL

```bash
# Open PostgreSQL CLI
psql -U postgres

# Create database and user
CREATE DATABASE ora_db;
CREATE USER ora_user WITH PASSWORD 'ora_password';
GRANT ALL PRIVILEGES ON DATABASE ora_db TO ora_user;

# Exit
\q
```

#### Option B: Use Docker

```bash
# Start PostgreSQL container
docker run --name ora-postgres \
  -e POSTGRES_USER=ora_user \
  -e POSTGRES_PASSWORD=ora_password \
  -e POSTGRES_DB=ora_db \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### Step 4: Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed sample data
npm run prisma:seed
```

### Step 5: Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Production build
npm run build
npm start
```

Backend should now be running at **http://localhost:5000**

---

## 🎨 Frontend Setup

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Configure Environment

Create `.env.local` file in `frontend/` directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_xxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-name
```

### Step 3: Move Logo to Public Folder

```bash
# Copy the logo to frontend public directory
cp ../oralogo.png public/oralogo.png
```

### Step 4: Start Frontend Server

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Frontend should now be running at **http://localhost:3000**

---

## 🗄️ Database Setup

### Creating an Admin User

Since there's no admin signup, you need to create an admin manually:

```bash
cd backend

# Open Prisma Studio (Database GUI)
npx prisma studio
```

Or using PostgreSQL CLI:

```sql
-- Connect to database
psql -U ora_user -d ora_db

-- Create admin user (password: admin123)
INSERT INTO users (id, email, password_hash, full_name, role, is_verified)
VALUES (
  gen_random_uuid(),
  'admin@orashop.in',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5/dBjNT0kM9Vi',
  'Admin User',
  'ADMIN',
  true
);
```

**Default Admin Credentials:**
- Email: `admin@orashop.in`
- Password: `admin123`

---

## 🔧 Environment Configuration

### Cloudinary Setup (Image Storage)

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy Cloud Name, API Key, API Secret
4. Add to `.env` files

### Razorpay Setup (Payment Gateway)

1. Sign up at [razorpay.com](https://razorpay.com)
2. Go to Settings → API Keys
3. Generate Test Keys
4. Add `Key ID` and `Key Secret` to `.env` files

### Gmail SMTP Setup (Emails)

1. Enable 2-Factor Authentication in Gmail
2. Generate App Password:
   - Google Account → Security → App Passwords
3. Add credentials to `.env`

---

## ▶️ Running the Application

### Option 1: Separate Terminals

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Using Docker Compose

```bash
# From project root
docker-compose up --build
```

This starts:
- PostgreSQL (port 5432)
- Backend API (port 5000)
- Frontend (port 3000)

### Option 3: Using Root Package Script

```bash
# From project root
npm run install:all  # Install all dependencies
npm run dev          # Run both servers concurrently
```

---

## 🛡️ Admin Access

### Accessing Admin Dashboard

1. Go to **http://localhost:3000/admin/login**
2. Login with admin credentials
3. Access admin features:
   - Product Management: `/admin/products`
   - Orders: `/admin/orders`
   - Customers: `/admin/customers`
   - Analytics: `/admin/dashboard`

---

## 💳 Payment Integration

### Razorpay Test Mode

For testing, use these test card details:

**Credit Card:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

**UPI:**
- UPI ID: `success@razorpay`

### Going Live

1. Complete KYC verification on Razorpay
2. Switch to Live API keys
3. Update `.env` with live keys
4. Test thoroughly before launch

---

## 🚢 Deployment

### Frontend (Vercel)

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Backend (Railway/Render)

**Railway:**
```bash
cd backend

# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Render:**
1. Connect GitHub repo
2. Select backend directory
3. Add environment variables
4. Deploy

### Database (Supabase/Railway)

1. Create PostgreSQL instance
2. Copy connection string
3. Update `DATABASE_URL` in production
4. Run migrations: `npx prisma migrate deploy`

---

## 🔍 Troubleshooting

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### Database Connection Error

```bash
# Check PostgreSQL is running
# Windows
services.msc (look for postgresql)

# Mac
brew services list

# Linux
sudo systemctl status postgresql
```

### Prisma Client Not Found

```bash
cd backend
npx prisma generate
```

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors

Check that `FRONTEND_URL` in backend `.env` matches your frontend URL.

---

## 📝 Sample Data

To populate the database with sample products:

```bash
cd backend
npm run prisma:seed
```

---

## 🎯 Next Steps

1. **Add Products**: Use admin panel to add your jewellery products
2. **Configure Shipping**: Set shipping fees in the database
3. **Create Categories**: Organize products into categories
4. **Test Checkout**: Place test orders to verify flow
5. **Customize Design**: Adjust colors in `tailwind.config.js`
6. **Setup Analytics**: Integrate Google Analytics
7. **Configure SEO**: Add meta tags for products

---

## 📞 Support

For issues or questions:
- Check `ARCHITECTURE.md` for system design
- Review error logs in terminal
- Check browser console for frontend issues

---

**Built with elegance for ORA — own. radiate. adorn.**
