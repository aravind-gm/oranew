# ORA Jewellery - Complete Routes & Pages Guide

## 🚀 Live Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api

---

## 📍 PUBLIC ROUTES (No Authentication Required)

### Store Pages
- **Home**: `/` - Hero section, featured collections, new arrivals, testimonials
- **Products**: `/products` - Full product catalog with search and filtering
- **Product Detail**: `/products/[slug]` - Individual product page with reviews and wishlist
- **Cart**: `/cart` - Shopping cart with item management
- **Wishlist**: `/wishlist` - Saved items for later
- **Checkout**: `/checkout` - Order review and shipping info
- **Checkout Payment**: `/checkout/payment` - Razorpay payment gateway

### Information Pages
- **About**: `/about` - About the company
- **Contact**: `/contact` - Contact form
- **Search**: `/search` - Product search

### Error Pages
- **404 Not Found**: `/not-found` - Page not found
- **Error**: `/error` - General error boundary
- **Loading**: `/loading` - Global loading state

---

## 🔐 AUTHENTICATION ROUTES (Login Required)

### Auth Pages (No Account Needed)
- **Login**: `/auth/login` - User login with email/password
- **Register**: `/auth/register` - New user registration
- **Forgot Password**: `/auth/forgot-password` - Request password reset
- **Reset Password**: `/auth/reset-password` - Reset password with token

### Customer Account Pages
- **Dashboard**: `/account` - User profile and quick stats
- **Orders**: `/account/orders` - View all orders
- **Order Detail**: `/account/orders/[id]` - Individual order details
- **Addresses**: `/account/addresses` - Manage shipping addresses
- **Profile**: `/profile` - Profile management

---

## 👨‍💼 ADMIN ROUTES (Admin Role Required)

### Admin Authentication
- **Admin Login**: `/admin/login` - Admin-specific login page

### Admin Dashboard
- **Dashboard**: `/admin` - Admin dashboard with statistics and navigation
  - Total products count
  - Total orders count
  - Revenue stats
  - User count

### Admin Product Management
- **Products List**: `/admin/products` - View all products with edit/delete
- **Create Product**: `/admin/products/new` - Add new product with:
  - Product name
  - Slug (auto-generated)
  - Price and discount
  - Stock quantity
  - Description
  - Category selection
- **Edit Product**: `/admin/products/[id]/edit` - Edit existing product

### Admin Category Management
- **Categories**: `/admin/categories` - Manage product categories
  - List all categories
  - Add new category
  - Delete category

### Admin Order Management
- **Orders List**: `/admin/orders` - View all customer orders with:
  - Order ID
  - Customer email
  - Total amount
  - Status badge
  - Order date
- **Order Detail**: `/admin/orders/[id]` - View order details and update status
  - Order items list
  - Shipping address
  - Order summary
  - Status update dropdown (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)

---

## 🔗 NAVIGATION COMPONENTS

### Header (Global)
- Logo with home link
- Navigation menu (Collections, About, Contact, Admin)
- Search icon
- Wishlist icon
- Cart icon (with item count)
- User menu (Account, Orders, Logout)
- Login/Register buttons (when not logged in)
- Mobile hamburger menu

### Footer (Global)
- Brand info
- Shop links (All Products, Cart, Wishlist)
- Account links (Login, Register, Account, Orders)
- Company links (About, Contact, Admin)
- Copyright notice

---

## 🔄 API ENDPOINTS USED

### Products
- `GET /api/products` - List all products
- `GET /api/products/[slug]` - Get single product

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/[id]` - Get order details
- `POST /api/orders` - Create new order

### Cart
- `POST /api/cart` - Add to cart
- `DELETE /api/cart/[id]` - Remove from cart
- `PUT /api/cart/[id]` - Update cart item

### Wishlist
- `GET /api/wishlist` - Get wishlist
- `POST /api/wishlist` - Add to wishlist
- `DELETE /api/wishlist/[id]` - Remove from wishlist

### Payments
- `POST /api/payments/verify` - Verify Razorpay payment
- `POST /api/payments/webhook` - Payment webhook

### Admin
- `GET /api/admin/products` - List products for admin
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Delete product
- `GET /api/admin/categories` - List categories
- `POST /api/admin/categories` - Create category
- `DELETE /api/admin/categories/[id]` - Delete category
- `GET /api/admin/orders` - List all orders
- `GET /api/admin/orders/[id]` - Get order details
- `PUT /api/admin/orders/[id]` - Update order status

---

## 🎨 UI/UX FEATURES

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized layouts
- Touch-friendly buttons and spacing

### Color Scheme
- Primary: Orange (#F97316)
- Dark backgrounds for admin pages
- Light backgrounds for customer pages
- Proper contrast ratios for accessibility

### Interactive Elements
- Dropdown menus for user account
- Mobile hamburger navigation
- Loading states
- Error messages with styling
- Success notifications with toast
- Hover effects on links and buttons

### Forms
- Email validation
- Password confirmation
- Required field indicators
- Error messages below inputs
- Submit button states (loading, disabled)

### Product Display
- Product grid with 4 columns (desktop), 2 (tablet), 1 (mobile)
- Product images with placeholder
- Price and discount display
- Stock status badges
- Add to cart buttons
- Product links to detail pages

### Admin Interface
- Dark theme for admin pages
- Table views for product/order lists
- Edit/Delete action buttons
- Status badges (PENDING, SHIPPED, DELIVERED, etc.)
- Form inputs for product creation
- Search and filter capabilities

---

## 🔐 AUTHENTICATION FLOW

1. User visits `/auth/register` to create account
2. User logs in at `/auth/login`
3. JWT token stored in localStorage
4. Token included in all API requests (Authorization header)
5. Protected routes check for token and redirect to login if missing
6. Admin routes check for `user.role === 'ADMIN'`
7. Logout clears token and redirects to home

---

## 📦 STATE MANAGEMENT (Zustand)

### Auth Store
- `useAuthStore`
- State: user, token, isAuthenticated
- Methods: login, logout, updateUser

### Cart Store
- `useCartStore`
- State: items array
- Methods: addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount

### Wishlist Store
- `useWishlistStore`
- State: items array
- Methods: addItem, removeItem, getItems

---

## ✅ TESTING CHECKLIST

- [ ] Home page loads with header and footer
- [ ] Navigation menu links work
- [ ] Products page loads and displays products
- [ ] Product detail page loads with correct product
- [ ] Add to cart works
- [ ] Cart page displays items
- [ ] Wishlist page works
- [ ] Login page works
- [ ] Register page works
- [ ] Checkout process works
- [ ] Admin login works
- [ ] Admin dashboard displays
- [ ] Admin can create products
- [ ] Admin can view orders
- [ ] All 404 errors are gone
- [ ] Mobile navigation works
- [ ] Cart count updates in header

---

## 🚀 DEPLOYMENT

### Docker Containers
- `ora-postgres` - PostgreSQL database (port 5432)
- `ora-backend` - Express API server (port 5000)
- `ora-frontend` - Next.js application (port 3000)

### Environment Variables
**Backend (.env)**:
- DATABASE_URL: PostgreSQL connection string
- JWT_SECRET: Secret key for JWT tokens
- JWT_EXPIRES_IN: Token expiration time (24h)
- PORT: Server port (5000)
- NODE_ENV: Environment (development/production)
- FRONTEND_URL: Frontend URL for CORS
- RAZORPAY_KEY_ID: Razorpay API key
- RAZORPAY_KEY_SECRET: Razorpay secret

**Frontend (.env.local)**:
- NEXT_PUBLIC_API_URL: Backend API URL (http://localhost:5000/api)
- NEXT_PUBLIC_RAZORPAY_KEY_ID: Razorpay key for checkout

### Commands
```bash
# Start all services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose up -d --build
```

---

## 📊 DATABASE SCHEMA

### Users
- id (UUID)
- email (unique)
- firstName, lastName
- password (hashed)
- role (USER, ADMIN)
- createdAt, updatedAt

### Products
- id (UUID)
- name, slug (unique)
- description, shortDescription
- price, discountPercent, finalPrice
- sku
- categoryId (foreign key)
- stockQuantity, lowStockThreshold
- images array
- isFeatured, isActive
- metadata (title, description, keywords)
- createdAt, updatedAt

### Categories
- id (UUID)
- name
- slug (unique)
- createdAt, updatedAt

### Orders
- id (UUID)
- userId (foreign key)
- items array (with productId, quantity, price)
- subtotal, tax, total
- status (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- shippingAddress object
- paymentStatus (PENDING, COMPLETED, FAILED)
- razorpayOrderId
- createdAt, updatedAt

### Reviews
- id (UUID)
- userId, productId (foreign keys)
- rating (1-5)
- comment
- createdAt, updatedAt

### Cart Items
- productId
- quantity
- addedAt

### Wishlist Items
- productId
- addedAt

---

**Last Updated**: January 10, 2026
**Status**: ✅ All pages implemented and routed
**Next Steps**: Test all routes and deploy to production
