# ORA - Premium Fashion Jewellery

> **own. radiate. adorn.**

A luxury e-commerce platform for artificial fashion jewellery, built with elegance and modern technology.

## 🌸 Brand Identity

- **Category**: Premium Artificial Fashion Jewellery
- **Target Audience**: Women (18-35)
- **Design Philosophy**: Minimal · Elegant · Modern · Luxurious
- **Primary Color**: Baby Pink

## 🛠️ Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- Framer Motion (Animations)

### Backend
- Node.js + Express.js
- TypeScript
- PostgreSQL + Prisma ORM
- JWT Authentication
- Razorpay Payment Gateway

### Infrastructure
- Docker & Docker Compose
- Vercel (Frontend)
- Railway/Render (Backend)
- Cloudinary (Image CDN)

## 📁 Project Structure

```
ora-jewellery/
├── frontend/              # Next.js customer storefront + admin
├── backend/               # Express.js REST API
├── shared/                # Shared types & utilities
├── docker-compose.yml     # Local development setup
└── ARCHITECTURE.md        # Detailed system design
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd oranew
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Setup environment variables**
   
   Backend (.env in /backend):
   ```env
   # Supabase Database Connection
   # Get from: Supabase Dashboard > Project Settings > Database > Connection string
   DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   
   # Supabase API Keys (Optional)
   SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
   SUPABASE_ANON_KEY="your-supabase-anon-key"
   
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRES_IN="24h"
   
   CLOUDINARY_NAME="your-cloudinary-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   
   RAZORPAY_KEY_ID="your-razorpay-key"
   RAZORPAY_KEY_SECRET="your-razorpay-secret"
   
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   
   FRONTEND_URL="http://localhost:3000"
   PORT="5000"
   ```
   
   Frontend (.env.local in /frontend):
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000/api"
   NEXT_PUBLIC_RAZORPAY_KEY="your-razorpay-key"
   ```

4. **Run database migrations**
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Prisma Studio: `npm run prisma:studio`

### Using Docker (Alternative)

```bash
docker-compose up --build
```

## 📦 Available Scripts

```bash
npm run dev              # Start both frontend & backend
npm run dev:frontend     # Start Next.js only
npm run dev:backend      # Start Express API only
npm run build            # Build for production
npm run prisma:studio    # Open database GUI
npm run lint             # Lint all code
```

## 🎨 Design System

### Color Palette
- **Primary**: Baby Pink (#FFD6E8)
- **Background**: Ivory (#FDFBF7)
- **Text**: Charcoal (#2D2D2D)
- **Accent**: Muted Gold (#D4AF77)

### Typography
- **Headings**: Cormorant Garamond (Serif)
- **Body**: Inter (Sans-serif)

### Design Principles
- ✨ Image-first layouts
- 🤍 Generous white space
- 🎯 Subtle interactions
- 📱 Mobile-first responsive
- ⚡ Skeleton loaders (no spinners)

## 🔒 Security Features

- JWT authentication with 24h expiry
- bcrypt password hashing
- Role-based access control (Admin/Staff/Customer)
- Rate limiting on sensitive endpoints
- Input validation with Zod
- SQL injection prevention (Prisma)
- CORS configuration
- HTTPS in production

## 📱 Features

### Customer Portal
- ✅ Product browsing with filters & search
- ✅ Product detail with image zoom
- ✅ Cart & wishlist management
- ✅ Secure checkout with Razorpay
- ✅ Order tracking
- ✅ Profile & address management
- ✅ Reviews & ratings
- ✅ Order cancellation & returns

### Admin Dashboard
- ✅ Product management (CRUD)
- ✅ Category management
- ✅ Order fulfillment & tracking
- ✅ Customer management
- ✅ Inventory control
- ✅ Sales analytics
- ✅ Return & refund processing
- ✅ Invoice generation

## 🌐 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel deploy --prod
```

### Backend (Railway)
```bash
cd backend
railway up
```

### Database (Supabase/Railway)
- Create PostgreSQL instance
- Update DATABASE_URL in production env
- Run migrations: `npx prisma migrate deploy`

## 📊 Database Schema

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete schema documentation.

Key tables:
- users, addresses
- products, categories, product_images
- cart_items, wishlists
- orders, order_items, payments
- returns, reviews, notifications

## 🔗 API Documentation

### Base URL (Development)
```
http://localhost:5000/api
```

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Products
- `GET /products` - List products
- `GET /products/:slug` - Product detail
- `POST /products` - Create (admin)

### Orders
- `POST /orders/checkout` - Place order
- `GET /orders` - User orders
- `PUT /admin/orders/:id/status` - Update status (admin)

See full API documentation in [ARCHITECTURE.md](./ARCHITECTURE.md).

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

Private & Proprietary - © 2026 ORA Jewellery

---

**Built with elegance and precision for ORA**

*own. radiate. adorn.*
