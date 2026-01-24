# 🧪 QUICK TESTING REFERENCE - Copy/Paste Commands

## Backend Setup

### Install Dependencies
```bash
cd backend
npm install
# This will install the new @sendgrid/mail package
```

### Database Migration (if needed)
```bash
cd backend
npx prisma migrate dev --name add_coupon_code_to_order
npx prisma db push
```

### Create Test Coupons (Seed or Manual)
```sql
INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, valid_from, valid_until, is_active) 
VALUES 
  (uuid(), 'WELCOME10', '10% off on first order', 'PERCENTAGE', 10.00, 100.00, 500.00, 100, NOW(), NOW() + INTERVAL '90 days', true),
  (uuid(), 'SAVE500', 'Flat ₹500 off', 'FIXED', 500.00, 2000.00, 500.00, 50, NOW(), NOW() + INTERVAL '30 days', true),
  (uuid(), 'EXPIRED', 'This coupon is expired', 'PERCENTAGE', 5.00, 100.00, NULL, 10, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day', true);
```

---

## API Testing

### 1. Validate Coupon
```bash
curl -X POST http://localhost:5000/api/coupons/WELCOME10/validate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderAmount": 2500}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Coupon applied successfully",
  "data": {
    "couponCode": "WELCOME10",
    "discountAmount": 250,
    "discountType": "PERCENTAGE",
    "originalAmount": 2500,
    "finalAmount": 2250
  }
}
```

### 2. Create Order with Coupon
```bash
curl -X POST http://localhost:5000/api/orders/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "prod-123", "quantity": 2}],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001",
      "country": "India"
    },
    "couponCode": "WELCOME10"
  }'
```

### 3. Initiate Refund (Admin Only)
```bash
curl -X POST http://localhost:5000/api/payments/refund \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "pay-123",
    "refundAmount": 1000
  }'
```

### 4. Update Profile
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "phone": "9876543210"
  }'
```

### 5. Change Password
```bash
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldpass123",
    "newPassword": "newpass456",
    "confirmPassword": "newpass456"
  }'
```

### 6. Delete Account
```bash
curl -X DELETE http://localhost:5000/api/auth/account \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7. Cancel Order
```bash
curl -X PUT http://localhost:5000/api/orders/ORDER_ID/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Changed my mind"
  }'
```

### 8. Request Return
```bash
curl -X POST http://localhost:5000/api/orders/ORDER_ID/return \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "DEFECTIVE",
    "description": "Product arrived damaged"
  }'
```

---

## Frontend Testing

### Login Test
```javascript
// In browser console
localStorage.setItem('authToken', 'YOUR_JWT_TOKEN');
localStorage.setItem('user', JSON.stringify({id: 'user-123', email: 'user@example.com', fullName: 'John Doe'}));
window.location.href = '/checkout';
```

### Apply Coupon in Checkout
```javascript
// Open checkout page, then:
document.querySelector('input[placeholder="Enter coupon code"]').value = 'WELCOME10';
document.querySelector('button:contains("Apply")').click();
```

### Test Settings Page
```
Navigate to: http://localhost:3000/account/settings
- Try editing name and phone
- Try changing password
- Check "Delete Account" danger zone
```

---

## Environment Setup

### .env file (Backend)
```env
# Database
DATABASE_URL="your-database-url"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="24h"

# SendGrid Email
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@orashop.in"
FROM_NAME="ORA Jewellery"

# Razorpay
RAZORPAY_KEY_ID="your-razorpay-key"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"

# Frontend
FRONTEND_URL="http://localhost:3000"

# Server
PORT=5000
NODE_ENV="development"
```

---

## Debugging Tips

### Check Email Log (if SendGrid not available)
```bash
grep -r "sendEmail\|SendGrid" backend/src/controllers/*.ts
grep -r "Email sent\|Email error" backend/src/utils/*.ts
```

### Verify Routes
```bash
# Check if coupon routes are registered
grep -n "coupons" backend/src/server.ts

# Check if refund endpoint exists
grep -n "refund" backend/src/routes/payment.routes.ts
```

### Test Database Connection
```bash
cd backend
npx prisma db execute --stdin < <<EOF
SELECT name FROM sqlite_master WHERE type='table';
EOF
```

### Check Current User ID (Frontend)
```javascript
import { useAuthStore } from '@/store/authStore';
const { user } = useAuthStore();
console.log('Current User:', user);
```

---

## Common Issues & Solutions

### Issue: SendGrid API Key Not Working
**Solution:**
```bash
# Verify API key format
echo $SENDGRID_API_KEY
# Should start with: SG.

# Test manually
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"personalizations": [...], "from": {...}, "subject": "test"}'
```

### Issue: Coupon Not Applying
**Solution:**
```javascript
// Debug coupon validation
console.log('Coupon Code:', couponCode);
console.log('Order Amount:', totalPrice);
console.log('Valid Date Range:', validFrom, validUntil);
console.log('Usage:', usageCount, '/', usageLimit);
```

### Issue: Refund Fails with Razorpay
**Solution:**
```bash
# Check payment status
curl -X GET https://api.razorpay.com/v1/payments/PAY_ID \
  -H "Authorization: Basic BASE64_ENCODED_KEY_AND_SECRET"

# Verify amount is in paise (multiply by 100)
# ₹1000 = 100000 paise
```

### Issue: Auth Token Expired
**Solution:**
```bash
# Generate new token
# Login via API and get new token
curl -X POST http://localhost:5000/api/auth/login \
  -d '{"email": "user@example.com", "password": "password"}'

# Copy token and use in headers
```

---

## Quick Validation Checklist

- [ ] Coupon system accepts valid codes and rejects invalid ones
- [ ] Discount calculated correctly (percentage vs fixed)
- [ ] Order created with coupon code and discount amount
- [ ] Settings page loads without errors
- [ ] Profile update works with validation
- [ ] Password change requires current password
- [ ] Account deletion shows confirmation
- [ ] Cancel order updates inventory
- [ ] Return request submits successfully
- [ ] Refund endpoint accepts admin authorization
- [ ] Email templates render correctly

---

## Performance Notes

- Coupon validation: O(1) - Direct DB lookup by code
- Order checkout with coupon: O(n) - Linear through cart items
- Refund processing: O(n) - Restocks all order items
- Account deletion: O(m) - Cascading delete of m relations

---

## Security Checklist

- [ ] Coupon API requires authentication
- [ ] Refund endpoint requires admin role
- [ ] User can only delete own account
- [ ] Order cancellation checks user ownership
- [ ] Password change requires current password verification
- [ ] Delete operations use transactions

---

**Last Updated:** January 15, 2025  
**For:** ORA E-commerce Platform  
**Version:** 1.0
