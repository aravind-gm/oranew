import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load env from backend root
dotenv.config({ path: path.join(__dirname, '.env') });

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const API_URL = 'http://127.0.0.1:5000/api/payments/webhook';

// CHANGE THESE VALUES AS NEEDED
const ORDER_ID = 'order_S3SloBTKXx3ths'; // Captured from previous step
const PAYMENT_ID = 'pay_Simulated_' + Date.now();
const AMOUNT_PAISE = 5103; // 51.03 * 100

if (!WEBHOOK_SECRET) {
  console.error('❌ RAZORPAY_WEBHOOK_SECRET not foud in .env');
  process.exit(1);
}

const payload = {
  entity: 'event',
  account_id: 'acc_test_12345',
  event: 'payment.captured',
  contains: ['payment'],
  payload: {
    payment: {
      entity: {
        id: PAYMENT_ID,
        entity: 'payment',
        amount: AMOUNT_PAISE,
        currency: 'INR',
        status: 'captured',
        order_id: ORDER_ID,
        method: 'card',
        captured: true,
        description: 'Simulated Payment',
        card_id: 'card_Simulated',
        email: 'test@example.com',
        contact: '+919999999999',
      }
    }
  },
  created_at: Math.floor(Date.now() / 1000)
};

// Convert payload to string for signature
const payloadString = JSON.stringify(payload);

// Calculate signature
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(payloadString)
  .digest('hex');

console.log(`Sending Webhook to ${API_URL}`);
console.log(`Secret: ${WEBHOOK_SECRET}`);
console.log(`Order ID: ${ORDER_ID}`);
console.log(`Payment ID: ${PAYMENT_ID}`);
console.log(`Signature: ${signature}`);

async function sendWebhook() {
  try {
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': signature
      }
    });

    console.log('✅ Webhook sent successfully!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
  } catch (error: any) {
    console.error('❌ Webhook failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

sendWebhook();
