# Admin Quick Login Integration

## Overview
Added an easy admin login option directly on the main customer login page at `/auth/login`.

## Features

✅ **Quick Admin Access**
- Click "Admin Access" button at bottom of login page
- Expandable form with email and password fields
- No need to navigate to separate admin page

✅ **Admin Login Flow**
1. User clicks "Admin Access" link
2. Admin login form expands
3. Enter email and password
4. System validates admin role
5. Redirects to `/admin` dashboard if authenticated

✅ **Security**
- Admin role verification required
- Regular password authentication (not OTP)
- Error messages for non-admin accounts
- Form disables during login

## Default Admin Credentials

The system seeds with default admin user:
- **Email**: `admin@example.com`
- **Password**: `admin123`

(See `backend/prisma/seed.ts` for seed configuration)

## UI Components

### Admin Access Button
- Positioned below OTP section
- Lock icon with "Admin Access" text
- Toggles admin login form visibility

### Admin Login Form (Collapsed by Default)
- Email input field
- Password input field
- Admin Login button
- Close button to collapse

## Files Modified

1. **frontend/src/app/auth/login/page.tsx**
   - Added admin login state management
   - Added `handleAdminLogin()` function
   - Added admin form UI with collapsible design
   - Integrated with existing auth store and API

2. **Imports Added**
   - `api` from `@/lib/api` (for admin login endpoint)
   - `Lock` icon from `lucide-react`

## API Endpoint Used

```
POST /api/auth/login
Body: { email, password }
Response: { success, data: { user, token } }
```

The endpoint validates:
- Email and password correctness
- User role is "ADMIN"
- Returns error if not admin

## Testing Steps

1. Navigate to `/auth/login`
2. Scroll to bottom
3. Click "Admin Access"
4. Enter admin credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
5. Click "Admin Login"
6. Should redirect to `/admin` dashboard

## Error Handling

- ✅ Invalid credentials → "Admin login failed"
- ✅ Non-admin account → "Admin access required. This account does not have admin privileges."
- ✅ Network error → Displayed in admin error section
- ✅ Missing fields → "Please enter email and password"

## UI/UX Features

- Small, discrete button (doesn't distract customers)
- Collapsible form (hidden by default)
- Matches existing design system
- Smooth transitions and animations
- Error messages clearly displayed
- Loading state during authentication
