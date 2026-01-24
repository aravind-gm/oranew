# 🚀 WEEK 4 STARTUP & TESTING GUIDE

**Quick Start Guide for Testing Week 4 Features**

---

## Prerequisites

- Backend server running on `http://localhost:5000`
- Frontend server running on `http://localhost:3000`
- PostgreSQL database configured
- Test user account created

---

## Quick Start Commands

### Terminal 1 - Backend
```bash
cd backend
npm install
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
```

### Terminal 3 - Database (if needed)
```bash
# Check if database is running
docker ps

# Start database if not running
docker-compose up -d
```

---

## Week 4 Features to Test

### 1. Order History Page

**URL**: `http://localhost:3000/account/orders`

**Test Steps**:
1. Login with test user credentials
2. Navigate to "My Account"
3. Click on "Orders" or go directly to `/account/orders`
4. **Verify**:
   - ✅ Orders list displays
   - ✅ Order number shows correctly
   - ✅ Order date formatted properly
   - ✅ Total amount displays
   - ✅ Order status badge shows with correct color
   - ✅ Payment status badge shows with correct color
   - ✅ "View Details" button works

**Expected Status Colors**:
- **DELIVERED**: Green
- **SHIPPED**: Blue
- **PROCESSING**: Orange
- **PENDING**: Yellow
- **CANCELLED**: Red
- **RETURNED**: Gray

---

### 2. Order Detail Page

**URL**: `http://localhost:3000/account/orders/[orderId]`

**Test Steps**:
1. From orders list, click "View Details" on any order
2. **Verify**:
   - ✅ Order number and date display
   - ✅ Order status and payment status badges show
   - ✅ Order items list with images (if available)
   - ✅ Subtotal, GST, shipping calculations
   - ✅ Total amount matches
   - ✅ Shipping address displays correctly
   - ✅ Payment information shows

---

### 3. Cancel Order Feature

**Test Steps**:

#### Setup (Create Cancellable Order)
1. Create a new order through checkout
2. DO NOT complete payment (leave status as PENDING)
   OR
3. Ask admin to set order status to PROCESSING

#### Testing Cancel Flow
1. Open order detail page
2. **Verify**: "Cancel Order" button appears (only for PENDING/PROCESSING)
3. Click "Cancel Order"
4. **Verify**:
   - ✅ Modal appears with title "Cancel Order"
   - ✅ Reason text area is present
5. Try submitting without reason
   - ✅ Should show validation error
6. Enter cancellation reason: "No longer needed"
7. Click "Cancel Order" button in modal
8. **Verify**:
   - ✅ Modal closes
   - ✅ Order status updates to "CANCELLED"
   - ✅ Cancellation details appear (date + reason)
   - ✅ "Cancel Order" button disappears
9. Refresh page
   - ✅ Cancelled status persists
   - ✅ "Cancel Order" button still hidden

**API Call**: `PUT /api/orders/:id/cancel`
```json
{
  "reason": "No longer needed"
}
```

---

### 4. Return Request Feature

**Test Steps**:

#### Setup (Create Returnable Order)
1. Need an order with status DELIVERED
2. Ask admin to update order status to DELIVERED
   OR
3. Use database tool to update order status:
   ```sql
   UPDATE orders SET status = 'DELIVERED' WHERE id = 'your-order-id';
   ```

#### Testing Return Flow
1. Open order detail page (must be DELIVERED status)
2. **Verify**: "Request Return" button appears
3. Click "Request Return"
4. **Verify**:
   - ✅ Modal appears with title "Request Return"
   - ✅ Reason dropdown is present
   - ✅ Description text area is present
5. Try submitting without selecting reason
   - ✅ Should show validation error
6. Select reason: "Product is defective"
7. Add description: "Item arrived damaged, box was crushed"
8. Click "Submit Request" button
9. **Verify**:
   - ✅ Modal closes
   - ✅ Order status updates to "RETURNED"
   - ✅ Success message appears
   - ✅ "Request Return" button disappears
10. Refresh page
    - ✅ Returned status persists
    - ✅ "Request Return" button still hidden

**Return Reason Options**:
- Product is defective
- Received wrong item
- Not as described
- Damaged in shipping
- Changed my mind
- Other

**API Call**: `POST /api/orders/:id/return`
```json
{
  "reason": "DEFECTIVE",
  "description": "Item arrived damaged"
}
```

---

### 5. Order Store Integration

**Test in Browser Console**:

```javascript
// Access order store (React DevTools)
// Or test the following in component

// Check if orders are loaded
console.log('Orders:', orders);

// Check loading state
console.log('Loading:', loading);

// Check errors
console.log('Error:', error);
```

**Verify Store Methods**:
- ✅ `fetchOrders()` - loads order list
- ✅ `fetchOrderById(id)` - loads single order
- ✅ `cancelOrder(id, reason)` - cancels order
- ✅ `requestReturn(id, reason, desc)` - requests return

---

## Testing Checklist

### ✅ Functional Tests

- [ ] **Order List**
  - [ ] Orders load on page mount
  - [ ] Loading spinner shows while fetching
  - [ ] Empty state shows when no orders
  - [ ] Orders display with correct information
  - [ ] Status badges have correct colors
  - [ ] Navigation to order detail works

- [ ] **Order Detail**
  - [ ] Order loads with full details
  - [ ] Items display with images
  - [ ] Address information complete
  - [ ] Payment information shows
  - [ ] Action buttons conditional based on status

- [ ] **Cancel Order**
  - [ ] Button only shows for PENDING/PROCESSING
  - [ ] Modal opens on click
  - [ ] Validation prevents empty reason
  - [ ] Cancellation updates order status
  - [ ] Button disappears after cancellation
  - [ ] Cancellation reason displays

- [ ] **Return Request**
  - [ ] Button only shows for DELIVERED
  - [ ] Modal opens on click
  - [ ] Dropdown has all reason options
  - [ ] Validation prevents empty reason
  - [ ] Return request updates order status
  - [ ] Button disappears after return
  - [ ] Return details can be viewed (admin)

### ✅ UI/UX Tests

- [ ] Responsive design works on mobile
- [ ] Modals are centered and accessible
- [ ] Loading states provide feedback
- [ ] Error messages are clear
- [ ] Success messages appear
- [ ] Buttons have hover effects
- [ ] Status badges are readable
- [ ] Typography is consistent

### ✅ Error Handling

- [ ] Network errors show message
- [ ] Invalid order ID shows error
- [ ] Unauthorized access redirects to login
- [ ] Form validation works
- [ ] API errors display to user

---

## Common Issues & Solutions

### Issue: Orders not loading
**Solution**: 
1. Check backend is running
2. Verify database connection
3. Check browser console for errors
4. Verify token is valid (check localStorage)

### Issue: "Cancel Order" button not appearing
**Solution**: 
- Button only shows for PENDING or PROCESSING status
- Check order status in database
- Update order status if needed for testing

### Issue: "Request Return" button not appearing
**Solution**: 
- Button only shows for DELIVERED status
- Update order status in database:
  ```sql
  UPDATE orders SET status = 'DELIVERED' WHERE id = 'order-id';
  ```

### Issue: Modal not closing after action
**Solution**: 
- Check browser console for errors
- Verify API endpoint is responding
- Check network tab for 200 response

### Issue: Order status not updating
**Solution**: 
1. Check API response in network tab
2. Verify backend controller logic
3. Check database for updated status
4. Try refreshing the page

---

## Backend API Verification

### Test with cURL or Postman

#### Get Orders
```bash
curl -X GET http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Order Detail
```bash
curl -X GET http://localhost:5000/api/orders/ORDER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Cancel Order
```bash
curl -X PUT http://localhost:5000/api/orders/ORDER_ID/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Testing cancellation"}'
```

#### Request Return
```bash
curl -X POST http://localhost:5000/api/orders/ORDER_ID/return \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "DEFECTIVE", "description": "Testing return"}'
```

---

## Database Verification

### Check Order Status
```sql
SELECT id, orderNumber, status, paymentStatus, totalAmount, createdAt 
FROM orders 
WHERE userId = 'USER_ID'
ORDER BY createdAt DESC;
```

### Check Return Requests
```sql
SELECT r.id, r.orderId, r.reason, r.description, r.status, r.createdAt,
       o.orderNumber, o.status as orderStatus
FROM returns r
JOIN orders o ON r.orderId = o.id
WHERE r.userId = 'USER_ID'
ORDER BY r.createdAt DESC;
```

### Update Order Status for Testing
```sql
-- Make order cancellable
UPDATE orders SET status = 'PENDING' WHERE id = 'ORDER_ID';

-- Make order returnable
UPDATE orders SET status = 'DELIVERED' WHERE id = 'ORDER_ID';
```

---

## Success Criteria

Week 4 is successful when:

✅ **Functionality**
- All order management features work end-to-end
- Cancel and return flows complete without errors
- Data persists correctly in database
- UI updates reflect backend changes

✅ **User Experience**
- Clear visual feedback for all actions
- Intuitive navigation between pages
- Helpful error messages
- Responsive design works

✅ **Code Quality**
- No TypeScript errors
- No console warnings
- Store properly manages state
- Components are well-structured

---

## Next Steps After Week 4

Once Week 4 testing is complete:

1. **Week 5**: Product Catalog Enhancement
   - Enhanced PLP with real filtering
   - Improved PDP with reviews
   - Better cart/wishlist functionality

2. **Week 6**: Admin Dashboard
   - Product management
   - Order management
   - Return approval workflow
   - Metrics and analytics

---

## Support & Resources

- **Documentation**: See `WEEK4_COMPLETION_REPORT.md`
- **Roadmap**: See `COMPLETION_ROADMAP.md`
- **Quick Reference**: See `QUICK_REFERENCE.md`
- **Backend Code**: `backend/src/controllers/order.controller.ts`
- **Frontend Code**: `frontend/src/store/orderStore.ts`

---

**Happy Testing! 🎉**
