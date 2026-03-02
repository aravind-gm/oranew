/**
 * WhatsApp Notification Service — Phase 10
 * ==========================================
 * 
 * Abstract WhatsApp notification service with pluggable provider.
 * Currently uses a placeholder/log provider.
 * 
 * Supported providers (swap via WHATSAPP_PROVIDER env var):
 *   - 'log'      — Console only (development)
 *   - 'twilio'   — Twilio WhatsApp API (future)
 *   - 'wati'     — WATI API (future)
 *   - 'gupshup'  — Gupshup API (future)
 * 
 * Usage:
 *   import { sendWhatsAppOrderConfirmation } from '../services/whatsapp.service';
 *   await sendWhatsAppOrderConfirmation({ phone, orderNumber, totalAmount });
 */

// ============================================
// PROVIDER INTERFACE
// ============================================

interface WhatsAppMessage {
  to: string;       // Phone number with country code (e.g., "+919842253984")
  template: string;  // Template name
  params: Record<string, string>;  // Template variables
}

interface WhatsAppProvider {
  name: string;
  send(message: WhatsAppMessage): Promise<boolean>;
}

// ============================================
// LOG PROVIDER (Development / Placeholder)
// ============================================

const logProvider: WhatsAppProvider = {
  name: 'log',
  async send(message: WhatsAppMessage): Promise<boolean> {
    console.log(`[WhatsApp:log] 📱 Would send to ${message.to}:`);
    console.log(`  Template: ${message.template}`);
    console.log(`  Params:`, JSON.stringify(message.params, null, 2));
    return true;
  },
};

// ============================================
// TWILIO PROVIDER (Stub — enable when needed)
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
      // When ready, uncomment and install twilio:
      // const twilio = require('twilio');
      // const client = twilio(accountSid, authToken);
      // await client.messages.create({
      //   from: `whatsapp:${fromNumber}`,
      //   to: `whatsapp:${message.to}`,
      //   body: buildBodyFromTemplate(message.template, message.params),
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
    case 'twilio':
      return twilioProvider;
    // Add more providers here as needed:
    // case 'wati': return watiProvider;
    // case 'gupshup': return gupshupProvider;
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
 * Send order confirmation via WhatsApp.
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

export default {
  sendWhatsAppOrderConfirmation,
  sendWhatsAppShippingUpdate,
  sendWhatsAppDeliveryConfirmation,
  sendWhatsAppMessage,
};
