# Quick Start - Development & Testing

## Current Status
✅ **Backend:** Working (payment controller fixed)
✅ **Frontend:** Built successfully, ready for development
✅ **TypeScript:** 0 compilation errors
✅ **Dependencies:** All installed and verified

## Running Locally

### Terminal 1 - Start Backend
```bash
cd backend
npm install
npm run dev
# Should start on http://localhost:3001
```

### Terminal 2 - Start Frontend
```bash
cd frontend
npm run dev
# Should start on http://localhost:3000
```

## Testing Payment Flow

### Step-by-Step Test

**1. Access the Application**
```
Open: http://localhost:3000
Navigate: Home → Products → Add to Cart
```

**2. Proceed to Checkout**
```
Click: "Proceed to Checkout" button
Verify: Cart items displayed correctly
```

**3. Fill Checkout Details**
```
- Customer email
- Customer name  
- Customer phone
- Shipping address
```

**4. Initiate Payment**
```
Click: "Proceed to Payment" button
Expected: Razorpay modal opens
```

**5. Complete Test Payment**
```
Payment Gateway Opens:
- Select any test payment method
- Complete the payment
- Razorpay will simulate success
```

**6. Verify Order Status**
```
Expected Flow:
✓ Payment verified (verifyPayment endpoint)
✓ Webhook received payment event
✓ Order status → CONFIRMED
✓ Cart → CLEARED
✓ Inventory → DEDUCTED
✓ Redirect → Order confirmation page
```

## Database Verification

### Check Payment Status
```sql
-- Check payment record
SELECT id, order_id, status, amount, created_at 
FROM payments 
ORDER BY created_at DESC LIMIT 1;
-- Expected: status = "CONFIRMED"
```

### Check Order Status
```sql
-- Check order record
SELECT id, customer_email, status, total_amount, created_at 
FROM orders 
ORDER BY created_at DESC LIMIT 1;
-- Expected: status = "CONFIRMED"
```

### Check Cart
```sql
-- Check cart is empty after payment
SELECT COUNT(*) as cart_items
FROM cart_items 
WHERE user_email = 'test@example.com';
-- Expected: 0 items
```

### Check Inventory
```sql
-- Check inventory was deducted
SELECT product_id, quantity_available 
FROM products 
WHERE product_id = 'TEST_PRODUCT_ID';
-- Expected: quantity_available reduced
```

## Logs to Monitor

### Backend Logs (Terminal 1)
```
[Payment] Starting payment flow...
[Payment] Razorpay order created: order_xxxxx
[Payment] Payment verified successfully
[Webhook] Received payment.captured event
[Webhook] Order status updated: PENDING → CONFIRMED
[Webhook] Cart cleared for user
[Webhook] Inventory deducted
```

### Frontend Logs (Terminal 2 / Browser Console)
```
[Payment] Success callback received from Razorpay
[Payment] Verifying signature with backend...
[Payment] ✓ Payment verified successfully
[Payment] Redirecting to success page...
```

## Common Issues & Fixes

### Issue: Build Loop with react-hot-toast
**Fix:** Already resolved - dependencies cleared and reinstalled

### Issue: TypeScript Errors in razorpay-handler.ts
**Fix:** Already resolved - refactored to use context factory pattern

### Issue: Payment Modal Doesn't Open
**Solution:**
1. Check browser console for errors
2. Verify Razorpay script is loaded: `window.Razorpay`
3. Check backend is running on correct port
4. Verify API endpoint: `/payments/create`

### Issue: Payment Verified but Order Not Confirmed
**Solution:**
1. Check webhook is configured in Razorpay dashboard
2. Verify webhook endpoint: `http://your-api/webhooks/razorpay`
3. Check backend logs for webhook processing
4. Ensure `RAZORPAY_WEBHOOK_SECRET` is set

### Issue: Database Connection Error
**Solution:**
```bash
# Check PostgreSQL is running
# Verify .env has correct DATABASE_URL
# Run migrations if needed:
cd backend
npm run prisma:migrate
```

## Useful Commands

### Backend
```bash
# Development
npm run dev

# Build
npm run build

# Run compiled version
npm run start

# Database migrations
npm run prisma:migrate
npm run prisma:studio  # GUI for database

# Logs
npm run logs:webhook
npm run logs:payment
```

### Frontend
```bash
# Development server
npm run dev

# Production build
npm run build

# Start built app
npm start

# Type check
npm run type-check

# Lint
npm run lint
```

## Environment Variables Needed

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/orashop
JWT_SECRET=your-secret-key
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
NODE_ENV=development
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-key-id
```

## Webhook Testing

### Using ngrok (for local testing)
```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 3001

# Update Razorpay webhook URL to: https://xxxxx.ngrok.io/webhooks/razorpay

# Check webhook deliveries in Razorpay dashboard
```

### Manual Webhook Testing
```bash
curl -X POST http://localhost:3001/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: test" \
  -d '{
    "event": "payment.captured",
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_test123",
          "order_id": "order_test456",
          "status": "captured"
        }
      }
    }
  }'
```

## Performance Tips

1. **Development Mode**: Hot reload enabled, slower build time
2. **Production Build**: Run `npm run build` for optimized code
3. **Database**: Use `npm run prisma:studio` to visualize queries
4. **API Caching**: Verify caching headers in responses

## Support Resources

- Backend: [backend/README.md](./backend/README.md)
- Frontend: [frontend/README.md](./frontend/README.md)  
- Payment Docs: [PAYMENT_DOCUMENTATION_INDEX.md](./PAYMENT_DOCUMENTATION_INDEX.md)
- Webhook Guide: [WEBHOOK_FIX_COMPLETE_ANALYSIS.md](./WEBHOOK_FIX_COMPLETE_ANALYSIS.md)

---

**Ready to test?** Follow the "Running Locally" section above! 🚀
