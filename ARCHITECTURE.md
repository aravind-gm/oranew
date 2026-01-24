# ORA - Premium Fashion Jewellery E-Commerce Platform
## Architecture Overview

### Brand Identity
- **Name**: ORA
- **Tagline**: own. radiate. adorn.
- **Category**: Premium Artificial Fashion Jewellery
- **Target**: Women (18-35)
- **Tone**: Minimal · Elegant · Modern · Luxury

---

## 1. Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom luxury design system
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Custom-built (NO Material UI)
- **Image Optimization**: Next.js Image + CloudinaryAnimations**: Framer Motion (subtle only)
- **SEO**: Next.js Metadata API

### Backend
- **Framework**: Node.js + Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (Relational data)
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer + Cloudinary
- **Payments**: Razorpay / Stripe
- **Emails**: Nodemailer + SendGrid
- **SMS/WhatsApp**: Twilio / MSG91

### DevOps & Infrastructure
- **Containerization**: Docker + Docker Compose
- **Hosting**: Vercel (Frontend) + Railway/Render (Backend)
- **Database**: Supabase / Railway PostgreSQL
- **CDN**: Cloudinary for images
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry (errors) + Vercel Analytics

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER STOREFRONT                        │
│  (Next.js - Luxury Design - Baby Pink Theme)                 │
│                                                               │
│  • Homepage (Hero, Collections)                              │
│  • Product Listing & Detail Pages                            │
│  • Cart & Wishlist                                           │
│  • Checkout & Payment                                        │
│  • User Profile & Orders                                     │
│  • Order Tracking & Returns                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ REST API (JWT Auth)
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    BACKEND API SERVER                         │
│            (Express.js + TypeScript)                          │
│                                                               │
│  • Authentication & Authorization                            │
│  • Product & Category Management                             │
│  • Cart & Order Processing                                   │
│  • Payment Gateway Integration                               │
│  • Inventory Management                                      │
│  • Notification Service                                      │
│  • Email & SMS Triggers                                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌────────────┐ ┌──────────────┐
│  PostgreSQL  │ │  Cloudinary │ │   Razorpay   │
│   Database   │ │   (Images)  │ │  (Payments)  │
└──────────────┘ └────────────┘ └──────────────┘
        │
        │
┌───────▼───────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                          │
│      (Next.js - Functional UI - Neutral Colors)             │
│                                                             │
│  • Product Management (CRUD)                                │
│  • Order Management & Fulfillment                           │
│  • Customer Management                                      │
│  • Inventory & Stock Control                                │
│  • Sales Analytics & Reports                                │
│  • Returns & Refunds                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### Users & Authentication
```sql
users
- id (uuid, PK)
- email (unique)
- password_hash
- full_name
- phone
- role (customer, admin, staff)
- is_verified
- created_at
- updated_at

addresses
- id (uuid, PK)
- user_id (FK)
- full_name
- phone
- address_line1
- address_line2
- city
- state
- pincode
- country
- is_default
- address_type (home, office)
```

### Products & Categories
```sql
categories
- id (uuid, PK)
- name
- slug
- description
- image_url
- parent_id (self-reference for subcategories)
- is_active
- sort_order

products
- id (uuid, PK)
- name
- slug
- description
- short_description
- price
- discount_percentage
- final_price (computed)
- sku
- category_id (FK)
- material (e.g., "Gold Plated Brass")
- care_instructions
- weight
- dimensions
- stock_quantity
- low_stock_threshold
- is_active
- is_featured
- meta_title (SEO)
- meta_description (SEO)
- created_at
- updated_at

product_images
- id (uuid, PK)
- product_id (FK)
- image_url
- alt_text
- sort_order
- is_primary

product_reviews
- id (uuid, PK)
- product_id (FK)
- user_id (FK)
- rating (1-5)
- title
- review_text
- is_verified_purchase
- is_approved
- created_at
```

### Cart & Wishlist
```sql
cart_items
- id (uuid, PK)
- user_id (FK)
- product_id (FK)
- quantity
- added_at

wishlists
- id (uuid, PK)
- user_id (FK)
- product_id (FK)
- added_at
```

### Orders & Payments
```sql
orders
- id (uuid, PK)
- order_number (unique, auto-generated)
- user_id (FK)
- status (pending, paid, processing, shipped, delivered, cancelled, returned)
- subtotal
- discount_amount
- gst_amount
- shipping_fee
- total_amount
- shipping_address_id (FK)
- billing_address_id (FK)
- payment_method
- payment_status (pending, paid, failed, refunded)
- tracking_number
- shipped_at
- delivered_at
- cancelled_at
- cancel_reason
- created_at
- updated_at

order_items
- id (uuid, PK)
- order_id (FK)
- product_id (FK)
- product_name (snapshot)
- product_image (snapshot)
- quantity
- unit_price
- discount
- gst_rate
- total_price

payments
- id (uuid, PK)
- order_id (FK)
- payment_gateway (razorpay, stripe)
- transaction_id
- amount
- currency
- status (pending, success, failed)
- payment_method
- gateway_response (json)
- created_at

returns
- id (uuid, PK)
- order_id (FK)
- user_id (FK)
- reason
- description
- status (requested, approved, rejected, refunded)
- refund_amount
- restocked
- created_at
- resolved_at
```

### Coupons & Promotions
```sql
coupons
- id (uuid, PK)
- code (unique)
- description
- discount_type (percentage, fixed)
- discount_value
- min_order_amount
- max_discount
- usage_limit
- usage_count
- valid_from
- valid_until
- is_active
```

### Notifications
```sql
notifications
- id (uuid, PK)
- user_id (FK, nullable for admin notifications)
- type (order_placed, order_shipped, low_stock, etc.)
- title
- message
- is_read
- metadata (json)
- created_at
```

---

## 4. API Design

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
PUT    /api/auth/profile
```

### Products
```
GET    /api/products
GET    /api/products/:slug
GET    /api/products/category/:category
GET    /api/products/search?q=necklace
GET    /api/products/featured
POST   /api/products (admin)
PUT    /api/products/:id (admin)
DELETE /api/products/:id (admin)
```

### Categories
```
GET    /api/categories
GET    /api/categories/:slug
POST   /api/categories (admin)
PUT    /api/categories/:id (admin)
DELETE /api/categories/:id (admin)
```

### Cart
```
GET    /api/cart
POST   /api/cart
PUT    /api/cart/:id
DELETE /api/cart/:id
DELETE /api/cart/clear
```

### Wishlist
```
GET    /api/wishlist
POST   /api/wishlist
DELETE /api/wishlist/:id
```

### Orders
```
POST   /api/orders/checkout
GET    /api/orders
GET    /api/orders/:id
PUT    /api/orders/:id/cancel
POST   /api/orders/:id/return
GET    /api/admin/orders (admin)
PUT    /api/admin/orders/:id/status (admin)
```

### Payments
```
POST   /api/payments/create
POST   /api/payments/verify
POST   /api/payments/webhook
```

### Reviews
```
GET    /api/products/:id/reviews
POST   /api/reviews
PUT    /api/reviews/:id
DELETE /api/reviews/:id
```

### Admin
```
GET    /api/admin/dashboard/stats
GET    /api/admin/analytics/sales
GET    /api/admin/customers
GET    /api/admin/inventory/low-stock
POST   /api/admin/products/bulk-upload
```

---

## 5. Design System (STRICT)

### Color Palette
```css
--primary: #FFD6E8      /* Baby Pink */
--primary-dark: #FFC0DB
--primary-light: #FFE8F0

--background: #FDFBF7   /* Ivory / Off-white */
--surface: #FFFFFF

--text-primary: #2D2D2D /* Charcoal */
--text-secondary: #6B6B6B
--text-muted: #A0A0A0

--accent: #D4AF77       /* Muted Gold - minimal use */
--border: #E8E8E8
--error: #D88B8B
--success: #A8D5BA
```

### Typography
```css
/* Headings - Elegant Serif */
font-family: 'Cormorant Garamond', 'Playfair Display', serif;

/* Body - Clean Sans-Serif */
font-family: 'Inter', 'Montserrat', sans-serif;

/* Sizes */
h1: 3.5rem / 56px (mobile: 2rem)
h2: 2.5rem / 40px (mobile: 1.75rem)
h3: 2rem / 32px (mobile: 1.5rem)
body: 1rem / 16px
small: 0.875rem / 14px
```

### Spacing
```
2xs: 0.25rem / 4px
xs:  0.5rem / 8px
sm:  1rem / 16px
md:  1.5rem / 24px
lg:  2rem / 32px
xl:  3rem / 48px
2xl: 4rem / 64px
3xl: 6rem / 96px
```

### Component Patterns
- **Buttons**: Soft rounded (8px), outline or subtle fill
- **Cards**: NO heavy borders, minimal shadow, generous padding
- **Images**: Large, high-quality, aspect ratio preserved
- **Forms**: Clean inputs with subtle borders
- **Animations**: Fade, slide, scale only (200-300ms ease)
- **Loaders**: Skeleton screens (NO spinners)

---

## 6. Customer UI Pages

### Homepage
- Hero section with brand tagline
- Featured collections (3-4 cards)
- New arrivals grid
- Category showcase
- Testimonials
- Instagram feed
- Newsletter signup
- Footer with brand story

### Product Listing Page
- Filter sidebar (price, category, rating)
- Sort options
- Product grid (masonry or equal height)
- Pagination
- Empty state (elegant illustration)

### Product Detail Page
- Image gallery with zoom
- Product name & price
- Discount badge (subtle)
- Material & care info
- Size/variant selector (if applicable)
- Add to cart & wishlist
- Reviews & ratings
- Related products

### Cart
- Line items with image, price, quantity
- Subtotal & GST breakdown
- Coupon input
- Proceed to checkout button
- Continue shopping link
- Empty cart state

### Checkout
- Step indicator (Address → Payment → Confirm)
- Address selection/addition
- Payment method selection
- Order summary
- Secure checkout badge

### User Profile
- Personal info editing
- Address book
- Order history with tracking
- Wishlist
- Logout

---

## 7. Admin Panel

### Dashboard
- Sales overview (charts)
- Recent orders
- Low stock alerts
- Customer stats
- Quick actions

### Products
- Product list table (search, filter, paginate)
- Add/edit product form
- Image upload (multiple)
- Stock management
- Bulk actions

### Orders
- Order list with filters
- Order detail view
- Status update dropdown
- Print invoice button
- Refund processing

### Customers
- Customer list
- View order history
- Block/unblock user

### Analytics
- Sales charts
- Top products
- Revenue breakdown
- Export reports

---

## 8. Payment Flow

1. User initiates checkout
2. Inventory locked for items
3. Order created with status "pending"
4. Payment gateway integration (Razorpay)
5. User redirected to payment page
6. On success: Webhook triggers
7. Order status → "paid"
8. Inventory decremented
9. Confirmation email sent
10. Admin notified

---

## 9. Order Status Flow

```
PENDING → PAID → PROCESSING → SHIPPED → DELIVERED
           ↓                     ↓
       FAILED              CANCELLED
                                ↓
                            RETURNED → REFUNDED
```

---

## 10. Security Measures

- JWT tokens with 24h expiry
- Password hashing with bcrypt (12 rounds)
- Role-based middleware (customer, admin, staff)
- Rate limiting on auth endpoints
- Input validation with Zod
- SQL injection prevention (Prisma ORM)
- XSS protection (Content Security Policy)
- CORS configuration
- HTTPS only in production
- Environment variables for secrets
- Payment webhook signature verification

---

## 11. SEO Strategy

- Dynamic meta tags per page
- Open Graph tags for social sharing
- Structured data (JSON-LD) for products
- Sitemap.xml generation
- Robots.txt
- Canonical URLs
- Image alt tags
- Fast loading (< 2s FCP)
- Mobile-first responsive

---

## 12. Performance Optimization

- Next.js Image component for lazy loading
- CDN for static assets
- Database indexing on frequently queried fields
- Redis caching (optional for scaling)
- Code splitting
- Tree shaking
- Gzip/Brotli compression
- PostgreSQL connection pooling

---

## 13. Deployment Strategy

### Development
```bash
npm run dev # Frontend & Backend concurrently
```

### Production
```bash
# Frontend (Vercel)
npm run build
vercel deploy --prod

# Backend (Railway/Render)
docker build -t ora-api .
docker push
railway up
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=...
JWT_EXPIRES_IN=24h

# Cloudinary
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Razorpay
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

# Email
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...

# Frontend URL (for redirects)
FRONTEND_URL=https://orashop.in
```

---

## 14. Future Enhancements

- AI-powered product recommendations
- Virtual try-on with AR
- Multi-language support
- Subscription model (jewellery box)
- Loyalty program
- Gift cards
- Social login (Google, Facebook)
- Live chat support
- Progressive Web App (PWA)

---

**Built with elegance for ORA — own. radiate. adorn.**
