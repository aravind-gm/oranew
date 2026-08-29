import { notifyPartnersNewOrder } from './whatsapp.service';
import { sendAdminNewOrderEmail } from './email.service';

export interface NewOrderNotificationData {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
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
}

/**
 * Send multi-channel external notifications to admin/owners when a new order is placed.
 * Dispatches asynchronously to Email, WhatsApp, Telegram, and Webhook (non-blocking).
 */
export async function notifyAdminNewOrder(data: NewOrderNotificationData): Promise<void> {
  console.log(`[NotificationService] 🔔 Dispatching external alerts for Order #${data.orderNumber}...`);

  // 1. Admin Email Notification
  try {
    sendAdminNewOrderEmail(data).catch((err) =>
      console.error('[NotificationService] Admin email alert failed:', err?.message || err)
    );
  } catch (err) {
    console.error('[NotificationService] Admin email trigger error:', err);
  }

  // 2. WhatsApp Notification to partners/owners
  try {
    notifyPartnersNewOrder({
      orderNumber: data.orderNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone || 'N/A',
      customerEmail: data.customerEmail,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
      items: data.items,
      shippingAddress: data.shippingAddress,
    }).catch((err) =>
      console.error('[NotificationService] WhatsApp partner alert failed:', err?.message || err)
    );
  } catch (err) {
    console.error('[NotificationService] WhatsApp trigger error:', err);
  }

  // 3. Telegram Bot Notification (if TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID are set)
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (telegramBotToken && telegramChatId) {
    try {
      const itemsText = data.items
        .map((i) => `• ${i.productName} x${i.quantity} (₹${(i.unitPrice * i.quantity).toLocaleString('en-IN')})`)
        .join('\n');

      const text = `🛍️ *NEW ORDER PLACED*

*Order #:* \`${data.orderNumber}\`
*Customer:* ${data.customerName}
*Phone:* ${data.customerPhone || 'N/A'}
*Email:* ${data.customerEmail}
*Payment:* ${data.paymentMethod === 'COD' ? '💵 Cash on Delivery (COD)' : '💳 Online Payment'}
*Total Amount:* ₹${data.totalAmount.toLocaleString('en-IN')}

*Items:*
${itemsText}

*Shipping Address:*
${data.shippingAddress.fullName}
${data.shippingAddress.addressLine1}${data.shippingAddress.addressLine2 ? ', ' + data.shippingAddress.addressLine2 : ''}
${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.pincode}`;

      fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text,
          parse_mode: 'Markdown',
        }),
        signal: AbortSignal.timeout(5000),
      })
        .then((res) => {
          if (!res.ok) console.error('[NotificationService] Telegram API response not ok:', res.statusText);
          else console.log(`[NotificationService] ✅ Telegram alert sent for #${data.orderNumber}`);
        })
        .catch((err) => console.error('[NotificationService] Telegram alert error:', err?.message || err));
    } catch (err) {
      console.error('[NotificationService] Telegram trigger error:', err);
    }
  }

  // 4. External Webhook Alert (Slack / Discord / Custom Webhook if ORDER_WEBHOOK_URL or SLACK_WEBHOOK_URL is set)
  const webhookUrl = process.env.ORDER_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const payload = {
        event: 'order.created',
        orderNumber: data.orderNumber,
        customer: {
          name: data.customerName,
          email: data.customerEmail,
          phone: data.customerPhone,
        },
        paymentMethod: data.paymentMethod,
        totalAmount: data.totalAmount,
        items: data.items,
        shippingAddress: data.shippingAddress,
        timestamp: new Date().toISOString(),
      };

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      })
        .then(() => console.log(`[NotificationService] ✅ External Webhook alert sent for #${data.orderNumber}`))
        .catch((err) => console.error('[NotificationService] Webhook alert error:', err?.message || err));
    } catch (err) {
      console.error('[NotificationService] Webhook trigger error:', err);
    }
  }
}
