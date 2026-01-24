# Copy-Paste Testing Commands

Save this file and run commands in order to test the entire payment flow.

---

## 1. Login and Get Token

```bash
#!/bin/bash

# Login
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo "Login Response:"
echo $RESPONSE | jq '.'

# Extract token
export TOKEN=$(echo $RESPONSE | jq -r '.token')
export USER_ID=$(echo $RESPONSE | jq -r '.user.id')

echo ""
echo "✅ Token: $TOKEN"
echo "✅ User ID: $USER_ID"
```

---

## 2. Get a Product ID

```bash
# List products
curl -s http://localhost:5000/api/products | jq '.data[0]'

# Or if you know the product ID:
export PRODUCT_ID="YOUR_PRODUCT_ID"

echo "Product ID: $PRODUCT_ID"
```

---

## 3. Create Order

```bash
#!/bin/bash

RESPONSE=$(curl -s -X POST http://localhost:5000/api/orders/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "'$PRODUCT_ID'", "quantity": 1}],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Delhi",
      "state": "Delhi",
      "zipCode": "110001",
      "country": "India"
    }
  }')

echo "Order Response:"
echo $RESPONSE | jq '.'

# Extract order ID
export ORDER_ID=$(echo $RESPONSE | jq -r '.order.id')
export TOTAL_AMOUNT=$(echo $RESPONSE | jq -r '.order.totalAmount')

echo ""
echo "✅ Order ID: $ORDER_ID"
echo "✅ Total Amount: $TOTAL_AMOUNT"
```

---

## 4. Create Payment (Razorpay Order)

```bash
#!/bin/bash

RESPONSE=$(curl -s -X POST http://localhost:5000/api/payments/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "'$ORDER_ID'"}')

echo "Payment Creation Response:"
echo $RESPONSE | jq '.'

# Extract payment details
export RAZORPAY_ORDER_ID=$(echo $RESPONSE | jq -r '.razorpayOrderId')
export PAYMENT_ID=$(echo $RESPONSE | jq -r '.paymentId')
export RAZORPAY_KEY=$(echo $RESPONSE | jq -r '.key')

echo ""
echo "✅ Razorpay Order ID: $RAZORPAY_ORDER_ID"
echo "✅ Payment ID: $PAYMENT_ID"
echo "✅ Key: $RAZORPAY_KEY"
```

---

## 5. Generate Valid Signature (For Testing)

This simulates what Razorpay returns after payment.

```bash
#!/bin/bash

# Install jq if not present (for JSON parsing)
# For Windows: choco install jq OR use WSL

# Use Python to calculate signature (cross-platform)
python3 << 'EOF'
import hmac
import hashlib

razorpay_order_id = "$RAZORPAY_ORDER_ID"
razorpay_key_secret = "kI22GwAy1HUpEYbrXnOp0hfA"

# For testing, generate fake payment ID
razorpay_payment_id = "pay_" + "0" * 16  # Fake payment ID for testing

body = f"{razorpay_order_id}|{razorpay_payment_id}"
signature = hmac.new(
    razorpay_key_secret.encode(),
    body.encode(),
    hashlib.sha256
).hexdigest()

print(f"Order ID: {razorpay_order_id}")
print(f"Payment ID: {razorpay_payment_id}")
print(f"Signature: {signature}")
EOF
```

**For Windows (PowerShell)**:
```powershell
$razorpay_order_id = $env:RAZORPAY_ORDER_ID
$razorpay_key_secret = "kI22GwAy1HUpEYbrXnOp0hfA"
$razorpay_payment_id = "pay_" + "0" * 16

# Use WSL or Python
python3 -c "
import hmac, hashlib
order_id = '$razorpay_order_id'
payment_id = '$razorpay_payment_id'
secret = '$razorpay_key_secret'
body = f'{order_id}|{payment_id}'
sig = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
print(f'Payment ID: {payment_id}')
print(f'Signature: {sig}')
"
```

---

## 6. Verify Payment Signature

After you have signature, payment ID:

```bash
#!/bin/bash

export RAZORPAY_PAYMENT_ID="pay_0000000000000000"
export RAZORPAY_SIGNATURE="xxxxx..."  # From step 5

RESPONSE=$(curl -s -X POST http://localhost:5000/api/payments/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "'$ORDER_ID'",
    "razorpayPaymentId": "'$RAZORPAY_PAYMENT_ID'",
    "razorpayOrderId": "'$RAZORPAY_ORDER_ID'",
    "razorpaySignature": "'$RAZORPAY_SIGNATURE'"
  }')

echo "Payment Verification Response:"
echo $RESPONSE | jq '.'
```

---

## 7. Check Payment Status (Before Webhook)

```bash
#!/bin/bash

# Should return status: VERIFIED (or PENDING)
curl -s -X GET "http://localhost:5000/api/payments/$ORDER_ID/status" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## 8. Simulate Webhook (Optional - For Testing)

This is what Razorpay would send. Only test if your webhook endpoint needs debugging.

```bash
#!/bin/bash

# Generate webhook signature
WEBHOOK_BODY='{"event":"payment.captured","payload":{"payment":{"entity":{"id":"'$RAZORPAY_PAYMENT_ID'","order_id":"'$RAZORPAY_ORDER_ID'","amount":'$(echo "$TOTAL_AMOUNT * 100" | bc)',"currency":"INR","status":"captured","method":"netbanking"}}}}'

WEBHOOK_SIGNATURE=$(python3 -c "
import hmac, hashlib
body = '''$WEBHOOK_BODY'''
secret = 'kI22GwAy1HUpEYbrXnOp0hfA'
sig = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
print(sig)
")

echo "Webhook Signature: $WEBHOOK_SIGNATURE"

# Send webhook
curl -s -X POST http://localhost:5000/api/payments/webhook \
  -H "X-Razorpay-Signature: $WEBHOOK_SIGNATURE" \
  -H "Content-Type: application/json" \
  -d "$WEBHOOK_BODY" | jq '.'
```

---

## 9. Check Payment Status (After Webhook)

Should now return `isConfirmed: true`:

```bash
#!/bin/bash

curl -s -X GET "http://localhost:5000/api/payments/$ORDER_ID/status" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## 10. Verify Database State

```bash
#!/bin/bash

echo "=== Payment Status ==="
docker-compose exec postgres psql -U ora_user -d ora_db -c \
  "SELECT id, status, amount FROM payments WHERE order_id = '$ORDER_ID';"

echo ""
echo "=== Order Status ==="
docker-compose exec postgres psql -U ora_user -d ora_db -c \
  "SELECT id, status FROM orders WHERE id = '$ORDER_ID';"

echo ""
echo "=== Cart Items ==="
docker-compose exec postgres psql -U ora_user -d ora_db -c \
  "SELECT COUNT(*) as cart_count FROM cart_items WHERE user_id = '$USER_ID';"
```

---

## All-In-One Script

Save as `test-payment.sh` and run:

```bash
#!/bin/bash

set -e  # Exit on error

echo "🔐 Step 1: Login"
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}')

TOKEN=$(echo $RESPONSE | jq -r '.token')
USER_ID=$(echo $RESPONSE | jq -r '.user.id')
echo "✅ Token obtained: ${TOKEN:0:20}..."

echo ""
echo "📦 Step 2: Get Product"
PRODUCT_ID=$(curl -s http://localhost:5000/api/products | jq -r '.data[0].id')
echo "✅ Product: $PRODUCT_ID"

echo ""
echo "📋 Step 3: Create Order"
ORDER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/orders/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items": [{"productId": "'$PRODUCT_ID'", "quantity": 1}], "shippingAddress": {"street": "123 Main St", "city": "Delhi", "state": "Delhi", "zipCode": "110001", "country": "India"}}')

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.order.id')
TOTAL_AMOUNT=$(echo $ORDER_RESPONSE | jq -r '.order.totalAmount')
echo "✅ Order: $ORDER_ID (Amount: $TOTAL_AMOUNT)"

echo ""
echo "💳 Step 4: Create Payment"
PAYMENT_RESPONSE=$(curl -s -X POST http://localhost:5000/api/payments/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "'$ORDER_ID'"}')

RAZORPAY_ORDER_ID=$(echo $PAYMENT_RESPONSE | jq -r '.razorpayOrderId')
PAYMENT_ID=$(echo $PAYMENT_RESPONSE | jq -r '.paymentId')
echo "✅ Razorpay Order: $RAZORPAY_ORDER_ID"

echo ""
echo "🔐 Step 5: Generate Signature"
PAYMENT_ID_FAKE="pay_0000000000000000"
SIGNATURE=$(python3 -c "
import hmac, hashlib
order = '$RAZORPAY_ORDER_ID'
payment = '$PAYMENT_ID_FAKE'
secret = 'kI22GwAy1HUpEYbrXnOp0hfA'
body = f'{order}|{payment}'
sig = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
print(sig)
")
echo "✅ Signature generated"

echo ""
echo "✔️ Step 6: Verify Signature"
VERIFY_RESPONSE=$(curl -s -X POST http://localhost:5000/api/payments/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "'$ORDER_ID'", "razorpayPaymentId": "'$PAYMENT_ID_FAKE'", "razorpayOrderId": "'$RAZORPAY_ORDER_ID'", "razorpaySignature": "'$SIGNATURE'"}')

VERIFY_STATUS=$(echo $VERIFY_RESPONSE | jq -r '.status')
echo "✅ Payment Status: $VERIFY_STATUS"

echo ""
echo "📊 Step 7: Check Database"
docker-compose exec postgres psql -U ora_user -d ora_db -c \
  "SELECT 'Payment Status:', status FROM payments WHERE id = '$PAYMENT_ID' UNION ALL SELECT 'Order Status:', status FROM orders WHERE id = '$ORDER_ID';"

echo ""
echo "✨ Test complete!"
echo ""
echo "NOTE: For actual webhook confirmation, use Netbanking:"
echo "1. Open http://localhost:3000/checkout"
echo "2. Add product → Checkout → Fill address"
echo "3. Payment page → Click Netbanking → Select bank"
echo "4. Success page will show confirmation in 5-30 seconds"
```

---

## Running the Script

### On Linux/Mac:
```bash
chmod +x test-payment.sh
./test-payment.sh
```

### On Windows (PowerShell):
```powershell
# Copy the script content into a .ps1 file
# Or use WSL:
wsl bash ./test-payment.sh

# Or run commands individually in Command Prompt
```

### On Windows (CMD):
Convert the script to batch format:
```batch
@echo off
REM Step 1: Login
curl -s -X POST http://localhost:5000/api/auth/login ...
REM ... etc
```

---

## Expected Outputs

### ✅ Success Flow
```
🔐 Step 1: Login
✅ Token obtained: eyJhbGciOiJIUzI1NiIs...

📦 Step 2: Get Product
✅ Product: product-uuid

📋 Step 3: Create Order
✅ Order: order-uuid (Amount: 52.06)

💳 Step 4: Create Payment
✅ Razorpay Order: order_XXXXX

🔐 Step 5: Generate Signature
✅ Signature generated

✔️ Step 6: Verify Signature
✅ Payment Status: VERIFIED

📊 Step 7: Check Database
 Payment Status | status
 Order Status   | CONFIRMED (after webhook)

✨ Test complete!
```

### ❌ Error: Invalid Signature
```
Payment signature verification failed
```
**Fix**: Ensure signature matches formula: `orderId|paymentId` with secret

### ❌ Error: Order not found
```
Order not found
```
**Fix**: Ensure ORDER_ID is correct and user owns it

### ❌ Error: Unauthorized
```
Unauthorized
```
**Fix**: Ensure TOKEN is current and hasn't expired

---

## Debugging Tips

### See all variables:
```bash
echo "TOKEN: $TOKEN"
echo "USER_ID: $USER_ID"
echo "ORDER_ID: $ORDER_ID"
echo "RAZORPAY_ORDER_ID: $RAZORPAY_ORDER_ID"
echo "RAZORPAY_PAYMENT_ID: $RAZORPAY_PAYMENT_ID"
echo "RAZORPAY_SIGNATURE: $RAZORPAY_SIGNATURE"
```

### See full response:
```bash
curl -s -X GET "http://localhost:5000/api/payments/$ORDER_ID/status" \
  -H "Authorization: Bearer $TOKEN"
```

### Check logs:
```bash
docker-compose logs backend --tail 50
```

### Check database:
```bash
docker-compose exec postgres psql -U ora_user -d ora_db -c "
SELECT * FROM payments ORDER BY created_at DESC LIMIT 1;"
```

