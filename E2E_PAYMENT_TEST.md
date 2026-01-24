# End-to-End Payment Flow Testing Guide

## Complete Payment Flow Test

This guide walks you through testing the entire payment flow from user registration to successful payment confirmation.

---

## Prerequisites

- ✅ Backend running on `http://localhost:5000`
- ✅ Frontend running on `http://localhost:3000`
- ✅ PostgreSQL database connected
- ✅ Razorpay test account (free)

---

## Step 1: Browse and Add Products to Cart

### 1.1 Open Frontend
```
http://localhost:3000
```

### 1.2 Navigate to Products
Click **"Products"** or **"Shop"** in the navigation menu.

### 1.3 Add Items to Cart
- Click on any product
- Click **"Add to Cart"** button
- Select quantity if available
- You should see cart icon update with item count

### 1.4 Verify Cart
- Click cart icon
- See items in cart with prices
- Confirm total price is correct

✅ **Expected Result**: Items appear in cart with correct quantities and prices.

---

## Step 2: Register/Login User

### 2.1 Click Checkout Button
From the cart page, click **"Proceed to Checkout"**

### 2.2 If Not Logged In
You'll be redirected to login page.

**New User - Sign Up**:
```
Email: test@orashop.in
Password: Test@12345
First Name: John
Last Name: Doe
```

**Existing User - Login**:
```
Email: test@orashop.in
Password: Test@12345
```

### 2.3 Backend Verification
Check backend logs:
```
POST /api/auth/register
POST /api/auth/login
```

You should see successful responses with JWT token.

✅ **Expected Result**: User authenticated and redirected to checkout.

---

## Step 3: Fill Shipping Address

### 3.1 Enter Shipping Details
```
Street Address: 123 Jewelry Lane
City: Mumbai
State: MH
Zip Code: 400001
Country: India
```

### 3.2 Verify Form Validation
Try submitting without filling fields - should show error.

### 3.3 Submit Order
Click **"Proceed to Payment"** button.

### Backend Check
```
POST /api/orders/checkout
```

You should see order created in logs.

✅ **Expected Result**: Order created, inventory locked for 15 minutes, page shows "Processing Payment..."

---

## Step 4: Complete Razorpay Payment

### 4.1 Razorpay Modal Opens
A payment dialog should appear with:
- Order amount (₹ amount from your cart)
- ORA Jewellery branding
- Payment form

### 4.2 Enter Test Card Details
```
Card Number: 4111 1111 1111 1111
Expiry: 12/25
CVV: 123
```

### 4.3 Complete Payment
- Click **"Pay"** button
- Enter OTP: **123456** (if prompted)
- Payment should process

### Backend Check
```
POST /api/payments/create
POST /api/payments/verify
POST /api/payments/webhook
```

You should see all three endpoints called in logs.

✅ **Expected Result**: Payment processed and verified.

---

## Step 5: Verify Payment Success

### 5.1 Success Page
You should see:
- ✅ Green success checkmark
- "Payment Successful!" message
- Order ID displayed
- Confirmation email info

### 5.2 Click "View Order Status"
Should redirect to `/profile` with your order visible.

### 5.3 Check Backend Logs
```
✓ Payment verified
✓ Inventory deducted
✓ Cart cleared
✓ Order marked PAID
✓ Notification sent
```

### 5.4 Database Verification
Check PostgreSQL:
```sql
-- Check order status
SELECT id, status, totalAmount FROM "Order" 
ORDER BY createdAt DESC LIMIT 1;

-- Should show: PAID status

-- Check inventory locks released
SELECT * FROM "InventoryLock" 
WHERE orderId = 'YOUR_ORDER_ID';

-- Should show: empty (locks cleaned up)

-- Check inventory deducted
SELECT sku, stockQuantity FROM "Product" 
WHERE id = 'product_id_from_order';

-- Should show: reduced quantity
```

✅ **Expected Result**: All data correctly updated in database.

---

## Step 6: Test Error Scenarios

### 6.1 Payment Failure
Repeat the flow but use an invalid card:
```
Card Number: 4000 0000 0000 0002 (Declined card)
Expiry: 12/25
CVV: 123
```

**Expected**: Payment fails, inventory locks released, order stays PENDING.

### 6.2 Webhook Failure Simulation
If webhook fails, the backend should:
- Retry webhook 3 times automatically
- Log the failure
- Send you an alert email
- Order stays PROCESSING until webhook succeeds

### 6.3 Race Condition Test
Try placing 2 orders simultaneously for low-stock items:
```
Product A: 5 items in stock
Order 1: Quantity 3
Order 2: Quantity 3 (simultaneously)
```

**Expected**: One succeeds, one fails with "insufficient inventory" error.

---

## Step 7: Advanced Testing

### 7.1 Refund Testing
After successful payment, test refund:
```bash
# Request refund via API
POST /api/payments/refund
{
  "paymentId": "pay_xxxxx"
}
```

**Expected**:
- Refund processed
- Inventory restocked
- Order status: REFUNDED
- Customer notified

### 7.2 Multiple Payments
Try paying for multiple orders:
- Same user, different items
- Check each payment in dashboard
- Verify separate order IDs for each

### 7.3 Cart Persistence
After successful payment:
- Cart should be empty
- Refresh page - cart stays empty
- Add new items - new cart session created

---

## Troubleshooting

### Issue: "Route not found" errors
**Solution**: Ensure backend is running and all routes are registered.
```bash
cd backend
npm start
```

### Issue: Payment modal doesn't open
**Solution**: 
1. Check browser console for errors
2. Verify Razorpay key in .env is correct
3. Ensure script loads: `https://checkout.razorpay.com/v1/checkout.js`

### Issue: "Connection refused" to database
**Solution**: Start PostgreSQL and verify DATABASE_URL in .env

### Issue: Inventory Lock not being removed
**Solution**: Run cleanup cron job manually:
```bash
# In backend
npm run cleanup-locks
```

### Issue: Webhook not being called
**Solution**: 
1. Check Razorpay webhook configuration
2. Ensure webhook URL is publicly accessible
3. Check webhook logs in Razorpay dashboard
4. Verify HMAC signature verification

---

## Manual API Testing (Postman)

### 1. Register User
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test@12345",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Save the returned `token`** for next requests.

### 2. Create Order
```
POST http://localhost:5000/api/orders/checkout
Authorization: Bearer TOKEN_HERE
Content-Type: application/json

{
  "items": [
    {
      "productId": "prod_id",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "MH",
    "zipCode": "400001",
    "country": "India"
  }
}
```

**Save the returned `orderId`**.

### 3. Create Payment
```
POST http://localhost:5000/api/payments/create
Authorization: Bearer TOKEN_HERE
Content-Type: application/json

{
  "orderId": "ORDER_ID",
  "amount": 5000
}
```

**Save the `razorpayOrderId`**.

### 4. Verify Payment (After Paying)
```
POST http://localhost:5000/api/payments/verify
Authorization: Bearer TOKEN_HERE
Content-Type: application/json

{
  "razorpayPaymentId": "pay_xxxxx",
  "razorpayOrderId": "order_xxxxx",
  "razorpaySignature": "signature_from_razorpay"
}
```

---

## Performance Testing

### Load Testing - Multiple Concurrent Orders

Use Apache Bench or Artillery:

```bash
# Install Apache Bench (comes with Apache)
ab -n 100 -c 10 http://localhost:5000/health

# Or use Artillery
npm install -g artillery
artillery quick --count 100 --num 10 http://localhost:5000/api/products
```

**Expected Performance**:
- Health check: < 100ms
- Product listing: < 500ms
- Order creation: < 1000ms
- Payment processing: < 2000ms

---

## Success Checklist

- [ ] User registration successful
- [ ] Products loaded and displayed
- [ ] Items added to cart
- [ ] Shipping address accepted
- [ ] Order created with inventory locked
- [ ] Razorpay modal opened
- [ ] Payment processed with test card
- [ ] Webhook received and processed
- [ ] Order status updated to PAID
- [ ] Inventory deducted
- [ ] Cart cleared
- [ ] Success page displayed
- [ ] Confirmation email sent
- [ ] Order visible in user profile
- [ ] Database records correct
- [ ] Inventory locks cleaned up

---

## What's Being Tested

| Component | Test | Expected |
|-----------|------|----------|
| **Backend** | All APIs responding | ✅ |
| **Database** | Migrations applied | ✅ |
| **Auth** | JWT token generation | ✅ |
| **Inventory** | Stock locking & deduction | ✅ |
| **Orders** | Order creation & status | ✅ |
| **Payments** | Razorpay integration | ✅ |
| **Webhooks** | Payment confirmation | ✅ |
| **Emails** | Notifications sent | ✅ |

---

## Next Steps After Testing

1. **Fix Issues**: Address any failures found
2. **Performance Tuning**: Optimize slow endpoints
3. **Security Hardening**: Add rate limiting, WAF rules
4. **Production Setup**: Deploy to real servers
5. **Monitor**: Set up alerts and monitoring
6. **Support**: Create FAQ and support processes

---

**🎉 Congratulations!** You have successfully tested the complete payment and inventory management system!
