# 🚀 Password Auth Migration - Quick Reference

## What Changed?

**OTP/Supabase Auth → Password-Based Auth (Self-Contained)**

---

## ✅ What Works Now

### 1. **User Registration**
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fullName": "John Doe",
  "phone": "+91 9876543210"  // Optional
}
```
Response: `{ token, user }`

### 2. **User Login**
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```
Response: `{ token, user }`

### 3. **Forgot Password**
```bash
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}
```
Email contains reset link with token

### 4. **Reset Password**
```bash
POST /api/auth/reset-password
{
  "token": "from_email_link",
  "password": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

### 5. **Admin Login**
```bash
POST /api/auth/admin-login
{
  "email": "admin@example.com",
  "password": "AdminPass123"
}
```
**Only works for ADMIN role users**

### 6. **Protected Routes**
```bash
GET /api/auth/me
Authorization: Bearer <token>
```

---

## ❌ What No Longer Works

- ❌ Supabase OTP (`/api/auth/otp-login`)
- ❌ Supabase auth client calls
- ❌ Magic links from Supabase
- ❌ `supabaseId` column in users table
- ❌ Supabase profile lookups

---

## 🔑 Key Features

| Feature | Details |
|---------|---------|
| **Password Hashing** | bcryptjs with 12 salt rounds |
| **Reset Token Expiry** | 15 minutes |
| **JWT Lifetime** | Configurable (in jwt.ts) |
| **Rate Limiting** | authLimiter on all auth endpoints |
| **User Enumeration** | Protected (same response for existing/non-existing users) |
| **Password Min Length** | 6 characters |

---

## 📁 File Changes

### Backend
```
backend/
├── src/
│   ├── controllers/auth.controller.ts ✨ REWRITTEN
│   └── routes/auth.routes.ts ✨ UPDATED
├── prisma/
│   ├── schema.prisma ✨ UPDATED
│   └── migrations/
│       └── PASSWORD_AUTH_MIGRATION.sql ✨ NEW
```

### Frontend
```
frontend/src/app/auth/
├── login/page.tsx ✨ REWRITTEN (password form)
├── register/page.tsx ✨ REWRITTEN (password form)
├── forgot-password/page.tsx ✨ UPDATED
├── reset-password/page.tsx ✨ UPDATED
└── account/page.tsx ✨ UPDATED (removed Supabase)
```

---

## 🚀 To Deploy

### 1. Database
```bash
# Run manual SQL migration from PASSWORD_AUTH_MIGRATION.sql
# OR use Prisma:
cd backend
npx prisma db push
```

### 2. Backend
```bash
cd backend
npm install
npm run build
git push origin main  # Deploy to Render
```

### 3. Frontend
```bash
cd frontend
npm install
npm run build
git push origin main  # Deploy to Vercel
```

### 4. Test
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "fullName": "Test User"
  }'
```

---

## 🐛 Debug Checklist

If something doesn't work:

- ✅ Check backend is running
- ✅ Check `.env` has correct DATABASE_URL and DIRECT_URL
- ✅ Check password is >= 6 characters
- ✅ Check email is lowercase
- ✅ Check rate limiting (wait a minute if too many requests)
- ✅ Check console logs for error messages
- ✅ Check email service configured for forgot password

---

## 📞 Common Issues

### "Invalid credentials"
- Wrong email or password
- User not found in database
- Password doesn't match hash

### "Too many requests"
- Rate limiter active
- Wait 1-5 minutes before retrying

### "Invalid or expired token"
- Token older than 15 minutes
- Token already used
- Request new reset

### "Email not received"
- Check spam folder
- Check SMTP configuration
- Check FRONTEND_URL is correct

---

## ✨ Environment Variables

```env
# Backend
DATABASE_URL=postgresql://...  # Pooled connection
DIRECT_URL=postgresql://...    # Direct connection
JWT_SECRET=your_secret_here
FRONTEND_URL=https://yourdomain.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

---

## 🎓 Architecture

```
User Entry
    ↓
    ├─→ /register → Create user with hashed password
    ├─→ /login → Validate password, return JWT token
    ├─→ /forgot-password → Email reset link with token
    ├─→ /reset-password → Validate token, update password
    └─→ Protected routes → Verify JWT token
         ├─→ /me → Get user profile
         ├─→ /profile → Update profile
         ├─→ /change-password → Change password
         └─→ /account → Delete account
```

---

## ✅ Status

**Migration:** COMPLETE  
**Testing:** Ready  
**Documentation:** Complete  
**Production:** Ready to deploy  

**Created:** 3 February 2026  
**Author:** Senior Full-Stack Engineer  
**Type:** Production-Safe Authentication System
