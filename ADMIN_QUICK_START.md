# 🎯 ADMIN QUICK START GUIDE
**Manual Order Management System**

---

## 📧 FIRST: Set Up Email

1. Open `backend/.env` file
2. Add these lines (replace with your details):

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourstore@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=yourstore@gmail.com
```

**For Gmail:**
- Go to: https://myaccount.google.com/apppasswords
- Create an App Password
- Use that in `SMTP_PASS`

3. Restart backend server

---

## 📦 DAILY ORDER WORKFLOW

### Morning Routine (10 minutes)

1. **Check New Orders**
   ```
   → Go to /admin/orders
   → Click "PENDING" filter
   → See all new orders
   ```

2. **Verify Payments**
   ```
   → Open Razorpay Dashboard
   → Match order numbers with payments
   → Note which payments are successful
   ```

3. **Confirm Orders**
   ```
   For each verified payment:
   → Click "View Details" on order
   → Change status dropdown to "CONFIRMED"
   → Click "✓ Update Order"
   → ✉️ Customer gets "Order Confirmed" email
   ```

---

### When Ready to Ship

4. **Prepare Shipment**
   ```
   → Filter by "CONFIRMED" orders
   → Pack items
   → Generate shipping label (your courier)
   → Note tracking number
   ```

5. **Update System**
   ```
   → Open order detail page
   → Change status to "SHIPPED"
   → Enter courier name (e.g., "Delhivery")
   → Enter tracking number
   → Click "✓ Update Order"
   → ✉️ Customer gets "Order Shipped" email with tracking
   ```

---

### After Delivery

6. **Mark as Delivered**
   ```
   When customer confirms delivery:
   → Open order detail
   → Change status to "DELIVERED"
   → Click "✓ Update Order"
   → ✉️ Customer gets "Delivered" email
   ```

---

## 🚫 IF CUSTOMER WANTS TO CANCEL

```
→ Open order detail page
→ Change status to "CANCELLED"
→ Enter cancellation reason
→ Click "✓ Update Order"
→ Inventory will be restored automatically
```

---

## 📊 ORDER STATUSES EXPLAINED

| Status | Meaning | What to Do |
|--------|---------|------------|
| **PENDING** | Order placed, payment not verified | Check Razorpay, then confirm |
| **CONFIRMED** | Payment verified | Pack items, prepare shipping |
| **PROCESSING** | Optional status | Use if you want to mark "packing in progress" |
| **SHIPPED** | Sent to courier | Update tracking when available |
| **DELIVERED** | Customer received | Mark after confirmation |
| **CANCELLED** | Order cancelled | System auto-restores inventory |

---

## 🎯 QUICK ACTIONS

### Find Specific Order
```
→ /admin/orders
→ Use browser search (Ctrl+F)
→ Search by order number or customer email
```

### Filter by Status
```
→ Click status buttons at top
→ ALL | PENDING | CONFIRMED | SHIPPED | DELIVERED | CANCELLED
```

### Check Payment
```
→ Order detail page
→ Look for "Payment History" section
→ See transaction ID and status
```

---

## ⚠️ IMPORTANT NOTES

1. **Always verify payment before confirming**
   - Check Razorpay dashboard
   - Match order number exactly
   - Verify amount matches

2. **Add tracking number when shipping**
   - Customers will receive it via email
   - Helps reduce "where is my order?" queries

3. **Inventory is locked, not deducted**
   - Stock is "held" for 15 minutes on order
   - NOT permanently removed until you enable webhook
   - Be aware of actual stock levels

4. **Emails send automatically**
   - When you change status
   - Check console if emails don't send
   - Non-blocking (won't stop order update)

---

## 🆘 COMMON PROBLEMS

### "Update Order" button not working?
- Check if status is actually different
- Hard refresh page (Ctrl+Shift+R)
- Check backend console for errors

### Emails not sending?
- Check `.env` has SMTP settings
- Verify Gmail App Password
- Look at backend console for errors
- Test email settings

### Can't see new orders?
- Refresh the page
- Check filter isn't hiding them
- Verify database connection

---

## 📱 CUSTOMER COMMUNICATION

Customers will automatically receive emails for:
- ✉️ Order placed (immediately)
- ✉️ Order confirmed (when you confirm)
- ✉️ Order shipped (with tracking number)
- ✉️ Order delivered (final email)

**No manual emails needed!**

---

## 🔐 PAYMENT SECURITY

**Current Setup (Manual Mode):**
- ✅ Razorpay captures payment
- ✅ Money is in your account
- ⏳ You verify manually
- ✅ Then you confirm order

**Why manual?**
- Extra verification layer
- Prevents webhook issues
- Full control over each order

**When ready for automation:**
- Enable webhook processing
- Orders auto-confirm
- Inventory auto-deducts
- Cart auto-clears

---

## 📞 SUPPORT CONTACTS

**Technical Issues:**
- Check backend logs
- Check browser console (F12)
- Review error messages

**Payment Issues:**
- Razorpay Dashboard
- Razorpay Support

**Email Issues:**
- SMTP provider support
- Check email spam folders

---

## ✅ END OF DAY CHECKLIST

- [ ] All PENDING orders verified/confirmed
- [ ] All CONFIRMED orders shipped (or scheduled)
- [ ] Tracking numbers added to shipped orders
- [ ] No customer queries left unanswered
- [ ] Check tomorrow's shipping schedule

---

**Remember:** This system gives you FULL CONTROL. Nothing happens automatically until you decide. Take your time, verify everything, and enjoy stress-free order management! 🎉
