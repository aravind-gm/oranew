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
/**
 * Send order confirmation via WhatsApp (to customer).
 */
export declare function sendWhatsAppOrderConfirmation(data: {
    phone: string;
    customerName: string;
    orderNumber: string;
    totalAmount: number;
}): Promise<boolean>;
/**
 * Send shipping notification via WhatsApp.
 */
export declare function sendWhatsAppShippingUpdate(data: {
    phone: string;
    customerName: string;
    orderNumber: string;
    trackingNumber?: string;
    courierName?: string;
}): Promise<boolean>;
/**
 * Send delivery confirmation via WhatsApp.
 */
export declare function sendWhatsAppDeliveryConfirmation(data: {
    phone: string;
    customerName: string;
    orderNumber: string;
}): Promise<boolean>;
/**
 * Generic WhatsApp message (for custom notifications).
 */
export declare function sendWhatsAppMessage(phone: string, template: string, params: Record<string, string>): Promise<boolean>;
/**
 * Notify all partners about a new order via WhatsApp.
 * Partners are configured via PARTNER_PHONES env var.
 * For CallMeBot provider, also needs CALLMEBOT_PHONES with API keys.
 */
export declare function notifyPartnersNewOrder(data: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    totalAmount: number;
    paymentMethod: string;
    items: Array<{
        productName: string;
        quantity: number;
        unitPrice: number;
    }>;
    shippingAddress: {
        fullName: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        pincode: string;
    };
}): Promise<void>;
/**
 * Notify partners when an order status changes (shipped, delivered, etc.)
 */
export declare function notifyPartnersStatusUpdate(data: {
    orderNumber: string;
    status: string;
    trackingNumber?: string;
    courierName?: string;
}): Promise<void>;
declare const _default: {
    sendWhatsAppOrderConfirmation: typeof sendWhatsAppOrderConfirmation;
    sendWhatsAppShippingUpdate: typeof sendWhatsAppShippingUpdate;
    sendWhatsAppDeliveryConfirmation: typeof sendWhatsAppDeliveryConfirmation;
    sendWhatsAppMessage: typeof sendWhatsAppMessage;
    notifyPartnersNewOrder: typeof notifyPartnersNewOrder;
    notifyPartnersStatusUpdate: typeof notifyPartnersStatusUpdate;
};
export default _default;
//# sourceMappingURL=whatsapp.service.d.ts.map