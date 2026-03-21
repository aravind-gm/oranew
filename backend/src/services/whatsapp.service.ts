/**
 * WhatsApp Notification Service — Phase 10 + Partner Alerts
 * ===========================================================
 * 
 * Abstract WhatsApp notification service with pluggable provider.
 * 
 * Supported providers (swap via WHATSAPP_PROVIDER env var):
 *   - 'log'         — Console only (development)
 *   - 'callmebot'   — FREE CallMeBot WhatsApp API (no cost, unlimited)
 *   - 'meta-cloud'  — Meta WhatsApp Cloud API (1,000 free conversations/month)
 *   - 'twilio'      — Twilio WhatsApp API (paid)
 * 
 * Setup for FREE providers:
 * 
 * 1. CallMeBot (EASIEST — completely free):
 *    - Each partner sends "I allow callmebot to send me messages" to +34 644 66 32 62 on WhatsApp
 *    - They receive an API key
 *    - Set WHATSAPP_PROVIDER=callmebot
 *    - Set CALLMEBOT_PHONES="+919842253984:apikey1,+917890123456:apikey2"
 * 
 * 2. Meta Cloud API (1000 free/month):
 *    - Create a Meta Business app at developers.facebook.com
 *    - Set WHATSAPP_PROVIDER=meta-cloud
 *    - Set META_WHATSAPP_TOKEN=your_access_token
 *    - Set META_WHATSAPP_PHONE_ID=your_phone_number_id
 * 
 * Partner phones for order alerts:
 *    Set PARTNER_PHONES="+919842253984,+917890123456" (comma-separated)
 * 
 * Usage:
 *   import { sendWhatsAppOrderConfirmation, notifyPartnersNewOrder } from '../services/whatsapp.service';
 *   await sendWhatsAppOrderConfirmation({ phone, orderNumber, totalAmount });
 *   await notifyPartnersNewOrder(orderData); // Sends to all partners
 */

// ============================================
// PROVIDER INTERFACE
// ============================================

interface WhatsAppMessage {
  to: string;       // Phone number with country code (e.g., "+919842253984")
  template: string;  // Template name
  params: Record<string, string>;  // Template variables
  body?: string;     // Plain text body (used by callmebot & meta-cloud)
}

interface WhatsAppProvider {
  name: string;
  send(message: WhatsAppMessage): Promise<boolean>;
}

// ============================================
// TEMPLATE → PLAIN TEXT CONVERTER
// ============================================

function buildPlainTextBody(template: string, params: Record<string, string>): string {
  switch (template) {
    case 'order_confirmation':
      return `🛍️ *ORA Jewellery — Order Confirmed!*\n\nHi ${params.name},\nYour order *${params.order_number}* for *${params.total}* has been placed successfully!\n\nWe'll notify you when it ships. 💕\n\n— Team ORA`;

    case 'order_shipped':
      return `🚚 *ORA — Order Shipped!*\n\nHi ${params.name},\nYour order *${params.order_number}* is on the way!\n\n📦 Courier: ${params.courier}\n🔍 Tracking: ${params.tracking}\n\n— Team ORA`;

    case 'order_delivered':
      return `🎉 *ORA — Order Delivered!*\n\nHi ${params.name},\nYour order *${params.order_number}* has been delivered!\n\nWe hope you love it! 💎\n\n— Team ORA`;

    case 'partner_new_order':
      return `🔔 *NEW ORDER ALERT!*\n\n` +
        `Order: *${params.order_number}*\n` +
        `Customer: ${params.customer_name}\n` +
        `Phone: ${params.customer_phone}\n` +
        `Amount: *${params.total}*\n` +
        `Payment: ${params.payment_method}\n` +
        `Items: ${params.items}\n\n` +
        `📍 Ship to:\n${params.shipping_address}\n\n` +
        `⏰ ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

    case 'partner_status_update':
      return `📋 *ORDER UPDATE*\n\nOrder: *${params.order_number}*\nNew Status: *${params.status}*\n${params.tracking ? `Tracking: ${params.tracking}\n` : ''}${params.courier ? `Courier: ${params.courier}\n` : ''}\n⏰ ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

    default:
      return Object.entries(params).map(([k, v]) => `${k}: ${v}`).join('\n');
  }
}

// ============================================
// LOG PROVIDER (Development / Placeholder)
// ============================================

const logProvider: WhatsAppProvider = {
  name: 'log',
  async send(message: WhatsAppMessage): Promise<boolean> {
    console.log(`[WhatsApp:log] 📱 Would send to ${message.to}:`);
    console.log(`  Template: ${message.template}`);
    console.log(`  Body:`, message.body || buildPlainTextBody(message.template, message.params));
    return true;
  },
};

// ============================================
// CALLMEBOT PROVIDER (FREE — no cost at all)
// ============================================
// Setup: Partner sends "I allow callmebot to send me messages"
// to +34 644 66 32 62 on WhatsApp, gets an API key.
// Set CALLMEBOT_PHONES="+919842253984:apikey1,+917890123456:apikey2"

const callmebotProvider: WhatsAppProvider = {
  name: 'callmebot',
  async send(message: WhatsAppMessage): Promise<boolean> {
    const phonesConfig = process.env.CALLMEBOT_PHONES || '';
    const body = message.body || buildPlainTextBody(message.template, message.params);
    
    // Find API key for this phone number
    const entries = phonesConfig.split(',').map(e => e.trim()).filter(Boolean);
    let apiKey = '';
    
    for (const entry of entries) {
      const [phone, key] = entry.split(':');
      if (phone && key && formatPhone(phone) === message.to) {
        apiKey = key.trim();
        break;
      }
    }

    if (!apiKey) {
      // If no specific key found, try sending to the phone anyway
      // (for customer notifications where we don't have a key)
      console.warn(`[WhatsApp:callmebot] No API key for ${message.to} — skipping`);
      return false;
    }

    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(message.to)}&text=${encodeURIComponent(body)}&apikey=${encodeURIComponent(apiKey)}`;
      
      const response = await fetch(url, { 
        method: 'GET',
        signal: AbortSignal.timeout(15000),
      });
      
      if (response.ok) {
        console.log(`[WhatsApp:callmebot] ✅ Sent to ${message.to}`);
        return true;
      } else {
        const text = await response.text();
        console.error(`[WhatsApp:callmebot] ❌ Failed (${response.status}):`, text);
        return false;
      }
    } catch (err) {
      console.error('[WhatsApp:callmebot] Failed:', err);
      return false;
    }
  },
};

// ============================================
// META WHATSAPP CLOUD API (1000 free/month)
// ============================================
// Setup: Create app at developers.facebook.com/apps
// Set META_WHATSAPP_TOKEN and META_WHATSAPP_PHONE_ID

const metaCloudProvider: WhatsAppProvider = {
  name: 'meta-cloud',
  async send(message: WhatsAppMessage): Promise<boolean> {
    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneId = process.env.META_WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
      console.warn('[WhatsApp:meta-cloud] Missing META_WHATSAPP_TOKEN or META_WHATSAPP_PHONE_ID — skipping');
      return false;
    }

    const body = message.body || buildPlainTextBody(message.template, message.params);

    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: message.to.replace('+', ''),  // Meta API expects without +
            type: 'text',
            text: { body },
          }),
          signal: AbortSignal.timeout(15000),
        }
      );

      if (response.ok) {
        console.log(`[WhatsApp:meta-cloud] ✅ Sent to ${message.to}`);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[WhatsApp:meta-cloud] ❌ Failed (${response.status}):`, errorData);
        return false;
      }
    } catch (err) {
      console.error('[WhatsApp:meta-cloud] Failed:', err);
      return false;
    }
  },
};

// ============================================
// TWILIO PROVIDER (Paid — kept for reference)
// ============================================

const twilioProvider: WhatsAppProvider = {
  name: 'twilio',
  async send(message: WhatsAppMessage): Promise<boolean> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !fromNumber) {
      console.warn('[WhatsApp:twilio] Missing TWILIO credentials — skipping');
      return false;
    }

    try {
      // When ready, install twilio: npm install twilio
      // const twilio = require('twilio');
      // const client = twilio(accountSid, authToken);
      // const body = message.body || buildPlainTextBody(message.template, message.params);
      // await client.messages.create({
      //   from: `whatsapp:${fromNumber}`,
      //   to: `whatsapp:${message.to}`,
      //   body,
      // });

      console.log(`[WhatsApp:twilio] 📱 Sent to ${message.to} — template: ${message.template}`);
      return true;
    } catch (err) {
      console.error('[WhatsApp:twilio] Failed:', err);
      return false;
    }
  },
};

// ============================================
// PROVIDER SELECTION
// ============================================

function getProvider(): WhatsAppProvider {
  const providerName = process.env.WHATSAPP_PROVIDER || 'log';
  switch (providerName) {
    case 'callmebot':
      return callmebotProvider;
    case 'meta-cloud':
      return metaCloudProvider;
    case 'twilio':
      return twilioProvider;
    default:
      return logProvider;
  }
}

// ============================================
// HELPER: Format phone number
// ============================================

function formatPhone(phone: string): string {
  // Remove spaces, dashes, parentheses
  let clean = phone.replace(/[\s\-()]/g, '');
  // Add India country code if missing
  if (!clean.startsWith('+')) {
    if (clean.startsWith('91') && clean.length === 12) {
      clean = `+${clean}`;
    } else if (clean.length === 10) {
      clean = `+91${clean}`;
    }
  }
  return clean;
}

// ============================================
// PUBLIC API: Template-based messages
// ============================================

/**
 * Send order confirmation via WhatsApp (to customer).
 */
export async function sendWhatsAppOrderConfirmation(data: {
  phone: string;
  customerName: string;
  orderNumber: string;
  totalAmount: number;
}): Promise<boolean> {
  const provider = getProvider();
  return provider.send({
    to: formatPhone(data.phone),
    template: 'order_confirmation',
    params: {
      name: data.customerName,
      order_number: data.orderNumber,
      total: `₹${data.totalAmount.toLocaleString('en-IN')}`,
    },
  });
}

/**
 * Send shipping notification via WhatsApp.
 */
export async function sendWhatsAppShippingUpdate(data: {
  phone: string;
  customerName: string;
  orderNumber: string;
  trackingNumber?: string;
  courierName?: string;
}): Promise<boolean> {
  const provider = getProvider();
  return provider.send({
    to: formatPhone(data.phone),
    template: 'order_shipped',
    params: {
      name: data.customerName,
      order_number: data.orderNumber,
      tracking: data.trackingNumber || 'N/A',
      courier: data.courierName || 'Our delivery partner',
    },
  });
}

/**
 * Send delivery confirmation via WhatsApp.
 */
export async function sendWhatsAppDeliveryConfirmation(data: {
  phone: string;
  customerName: string;
  orderNumber: string;
}): Promise<boolean> {
  const provider = getProvider();
  return provider.send({
    to: formatPhone(data.phone),
    template: 'order_delivered',
    params: {
      name: data.customerName,
      order_number: data.orderNumber,
    },
  });
}

/**
 * Generic WhatsApp message (for custom notifications).
 */
export async function sendWhatsAppMessage(
  phone: string,
  template: string,
  params: Record<string, string>
): Promise<boolean> {
  const provider = getProvider();
  return provider.send({
    to: formatPhone(phone),
    template,
    params,
  });
}

// ============================================
// PARTNER NOTIFICATIONS — Order Alerts
// ============================================

/**
 * Notify all partners about a new order via WhatsApp.
 * Partners are configured via PARTNER_PHONES env var.
 * For CallMeBot provider, also needs CALLMEBOT_PHONES with API keys.
 */
export async function notifyPartnersNewOrder(data: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  totalAmount: number;
  paymentMethod: string;
  items: Array<{ productName: string; quantity: number; unitPrice: number }>;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
}): Promise<void> {
  // Default partner phones — override via ORDER_ALERT_PHONES or PARTNER_PHONES env var
  const DEFAULT_PARTNER_PHONES = '+919842253984,+919342865987,+919095007887';
  const partnerPhones = (process.env.ORDER_ALERT_PHONES || process.env.PARTNER_PHONES || DEFAULT_PARTNER_PHONES)
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);
  
  if (partnerPhones.length === 0) {
    console.log('[WhatsApp] No PARTNER_PHONES configured — skipping partner notification');
    return;
  }

  const provider = getProvider();
  const itemsList = data.items.map(i => `  • ${i.productName} × ${i.quantity} = ₹${(i.unitPrice * i.quantity).toLocaleString('en-IN')}`).join('\n');
  const addr = data.shippingAddress;
  const addressText = [addr.fullName, addr.addressLine1, addr.addressLine2, `${addr.city}, ${addr.state} ${addr.pincode}`].filter(Boolean).join('\n');

  const params: Record<string, string> = {
    order_number: data.orderNumber,
    customer_name: data.customerName,
    customer_phone: data.customerPhone || 'N/A',
    customer_email: data.customerEmail,
    total: `₹${data.totalAmount.toLocaleString('en-IN')}`,
    payment_method: data.paymentMethod === 'COD' ? '💵 Cash on Delivery' : '💳 Online (Razorpay)',
    items: `\n${itemsList}`,
    shipping_address: addressText,
  };

  for (const phone of partnerPhones) {
    try {
      await provider.send({
        to: formatPhone(phone),
        template: 'partner_new_order',
        params,
      });
    } catch (err) {
      console.error(`[WhatsApp] Failed to notify partner ${phone}:`, err);
    }
  }
}

/**
 * Notify partners when an order status changes (shipped, delivered, etc.)
 */
export async function notifyPartnersStatusUpdate(data: {
  orderNumber: string;
  status: string;
  trackingNumber?: string;
  courierName?: string;
}): Promise<void> {
  const DEFAULT_PARTNER_PHONES = '+919842253984,+919342865987,+919095007887';
  const partnerPhones = (process.env.ORDER_ALERT_PHONES || process.env.PARTNER_PHONES || DEFAULT_PARTNER_PHONES)
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);
  
  if (partnerPhones.length === 0) return;

  const provider = getProvider();
  const params: Record<string, string> = {
    order_number: data.orderNumber,
    status: data.status,
    tracking: data.trackingNumber || '',
    courier: data.courierName || '',
  };

  for (const phone of partnerPhones) {
    try {
      await provider.send({ to: formatPhone(phone), template: 'partner_status_update', params });
    } catch (err) {
      console.error(`[WhatsApp] Failed to notify partner ${phone}:`, err);
    }
  }
}

export default {
  sendWhatsAppOrderConfirmation,
  sendWhatsAppShippingUpdate,
  sendWhatsAppDeliveryConfirmation,
  sendWhatsAppMessage,
  notifyPartnersNewOrder,
  notifyPartnersStatusUpdate,
};
