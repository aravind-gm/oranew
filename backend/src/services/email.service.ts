import nodemailer from 'nodemailer';

// Email configuration — supports both EMAIL_* and SMTP_* env vars for compatibility
const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
const emailHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
const emailPort = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587');
const emailSecure = (process.env.EMAIL_SECURE === 'true') || emailPort === 465;

// Gmail uses 'service' which auto-configures host/port.
// For all other providers (GoDaddy, etc.), use explicit host/port.
const isGmail = emailHost.includes('gmail');

const transportConfig = isGmail
  ? {
      service: 'gmail',
      auth: emailUser && emailPass ? { user: emailUser, pass: emailPass } : undefined,
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    }
  : {
      host: emailHost,
      port: emailPort,
      secure: emailSecure,
      auth: emailUser && emailPass ? { user: emailUser, pass: emailPass } : undefined,
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    };

const transporter = nodemailer.createTransport(transportConfig as nodemailer.TransportOptions);

// Verify SMTP on startup (non-blocking)
if (emailUser && emailPass) {
  transporter.verify()
    .then(() => console.log('✅ [EmailService] SMTP connection verified'))
    .catch((err) => {
      console.error('❌ [EmailService] SMTP verification failed:', err.message);
      console.error('   → For Gmail: use an App Password → https://myaccount.google.com/apppasswords');
    });
} else {
  console.warn('⚠️ [EmailService] EMAIL_USER/EMAIL_PASS not set — order emails will be skipped');
}

const EMAIL_FROM = process.env.EMAIL_FROM || `"ORA Jewellery" <${emailUser || 'noreply@orashop.in'}>`;
const SUPPORT_EMAIL = 'admin@orashop.in';
const BRAND_PHONE = '+91 98765 43210';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://orashop.vercel.app';

// ═══════════════════════════════════════════════════════════════
// ORA Luxury Email Template System — White + Rose Gold Theme
// ═══════════════════════════════════════════════════════════════

const emailWrapper = (title: string, body: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fdf2f0; font-family: 'Georgia', 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fdf2f0;">
    <tr>
      <td align="center" style="padding: 30px 15px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(183, 110, 121, 0.12);">
          
          <!-- Header with Rose Gold gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #B76E79 0%, #E8A0BF 50%, #C9929D 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 300; color: #ffffff; letter-spacing: 6px; font-family: 'Georgia', serif;">ORA</h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.85); letter-spacing: 3px; text-transform: lowercase;">own · radiate · adorn</p>
            </td>
          </tr>
          
          <!-- Body content -->
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              ${body}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #faf5f4; padding: 28px 40px; border-top: 1px solid #f0e0dc;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #B76E79; font-weight: 600; letter-spacing: 2px;">ORA JEWELLERY</p>
                    <p style="margin: 0 0 12px 0; font-size: 12px; color: #999;">Premium Fashion Jewellery • Made in India 🇮🇳</p>
                    <p style="margin: 0; font-size: 12px; color: #aaa;">
                      <a href="mailto:${SUPPORT_EMAIL}" style="color: #B76E79; text-decoration: none;">${SUPPORT_EMAIL}</a>
                      &nbsp;•&nbsp;
                      <a href="${FRONTEND_URL}" style="color: #B76E79; text-decoration: none;">orashop.in</a>
                    </p>
                    <p style="margin: 12px 0 0 0; font-size: 11px; color: #bbb;">Sold by Ora Global &nbsp;|&nbsp; GSTIN: 33AAJFO8903F1ZA</p>
                    <p style="margin: 8px 0 0 0; font-size: 11px; color: #ccc;">© ${new Date().getFullYear()} Ora Global. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  trackingNumber?: string;
  courierName?: string;
  gstAmount?: number;
  shippingCost?: number;
  discountAmount?: number;
}

// ─────────────────────────────────────
// Helper: Build items table HTML
// ─────────────────────────────────────
const buildItemsTable = (items: OrderEmailData['items'], totalAmount: number, gst?: number, shipping?: number, discount?: number) => {
  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f5e6e3; font-size: 14px; color: #444;">${item.productName}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #f5e6e3; text-align: center; font-size: 14px; color: #666;">×${item.quantity}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #f5e6e3; text-align: right; font-size: 14px; color: #444; font-weight: 600;">₹${item.unitPrice.toFixed(2)}</td>
    </tr>
  `).join('');

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
      <thead>
        <tr>
          <th style="padding: 10px 0; text-align: left; font-size: 12px; color: #B76E79; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #B76E79;">Item</th>
          <th style="padding: 10px 0; text-align: center; font-size: 12px; color: #B76E79; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #B76E79;">Qty</th>
          <th style="padding: 10px 0; text-align: right; font-size: 12px; color: #B76E79; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #B76E79;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 8px;">
      <tr>
        <td style="padding: 4px 0; font-size: 13px; color: #888;">Subtotal</td>
        <td style="padding: 4px 0; text-align: right; font-size: 13px; color: #888;">₹${subtotal.toFixed(2)}</td>
      </tr>
      ${discount && discount > 0 ? `<tr>
        <td style="padding: 4px 0; font-size: 13px; color: #10b981;">Discount</td>
        <td style="padding: 4px 0; text-align: right; font-size: 13px; color: #10b981;">−₹${discount.toFixed(2)}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 4px 0; font-size: 13px; color: #888;">GST</td>
        <td style="padding: 4px 0; text-align: right; font-size: 13px; color: #888;">${gst ? `₹${gst.toFixed(2)}` : 'Included'}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-size: 13px; color: #888;">Shipping</td>
        <td style="padding: 4px 0; text-align: right; font-size: 13px; color: #888;">${!shipping || shipping === 0 ? '<span style="color: #10b981;">FREE</span>' : `₹${shipping.toFixed(2)}`}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: 700; color: #B76E79; border-top: 2px solid #B76E79;">Total</td>
        <td style="padding: 12px 0 0 0; text-align: right; font-size: 18px; font-weight: 700; color: #B76E79; border-top: 2px solid #B76E79;">₹${totalAmount.toFixed(2)}</td>
      </tr>
    </table>
  `;
};

// ─────────────────────────────────────
// Helper: Build shipping address HTML
// ─────────────────────────────────────
const buildAddressBlock = (addr: OrderEmailData['shippingAddress']) => `
  <div style="background: #faf5f4; border-radius: 10px; padding: 18px; margin: 16px 0;">
    <p style="margin: 0 0 8px 0; font-size: 12px; color: #B76E79; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">📦 Shipping To</p>
    <p style="margin: 0; font-size: 14px; color: #444; line-height: 1.7;">
      <strong>${addr.fullName}</strong><br>
      ${addr.addressLine1}<br>
      ${addr.addressLine2 ? `${addr.addressLine2}<br>` : ''}
      ${addr.city}, ${addr.state} ${addr.pincode}
    </p>
  </div>
`;

/**
 * Send order placed email — Luxury Rose Gold theme
 */
export const sendOrderPlacedEmail = async (data: OrderEmailData) => {
  const { customerEmail, customerName, orderNumber, items, totalAmount, shippingAddress, gstAmount, shippingCost, discountAmount } = data;

  const body = `
    <!-- Status badge -->
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #B76E79, #E8A0BF); color: white; padding: 10px 28px; border-radius: 50px; font-size: 15px; letter-spacing: 1px;">
        ✓ Order Placed Successfully
      </div>
    </div>
    
    <p style="font-size: 16px; color: #444; margin: 0 0 8px 0;">Dear <strong>${customerName}</strong>,</p>
    <p style="font-size: 15px; color: #666; line-height: 1.7; margin: 0 0 24px 0;">
      Thank you for choosing ORA! Your order has been placed and is awaiting confirmation. We'll notify you once it's confirmed.
    </p>
    
    <!-- Order number card -->
    <div style="background: #faf5f4; border-radius: 10px; padding: 18px; margin-bottom: 20px; text-align: center;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #B76E79; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
      <p style="margin: 0; font-size: 22px; font-weight: 700; color: #333; letter-spacing: 2px;">${orderNumber}</p>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #999;">Status: <span style="color: #f59e0b; font-weight: 600;">Pending Confirmation</span></p>
    </div>
    
    <!-- Items table -->
    ${buildItemsTable(items, totalAmount, gstAmount, shippingCost, discountAmount)}
    
    <!-- Shipping address -->
    ${buildAddressBlock(shippingAddress)}
    
    <!-- What's next -->
    <div style="background: #fff8f0; border-left: 4px solid #B76E79; padding: 16px; border-radius: 0 10px 10px 0; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #B76E79;">⏳ What's Next?</p>
      <p style="margin: 0; font-size: 13px; color: #777; line-height: 1.6;">Our team will verify your payment and confirm your order within 24 hours. You'll receive another email once confirmed.</p>
    </div>
    
    <!-- CTA -->
    <div style="text-align: center; margin: 28px 0 0 0;">
      <a href="${FRONTEND_URL}/account" style="display: inline-block; background: linear-gradient(135deg, #B76E79, #C9929D); color: white; padding: 14px 36px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 14px; letter-spacing: 1px;">View My Orders</a>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: customerEmail,
      subject: `✓ Order Placed — ${orderNumber} | ORA Jewellery`,
      html: emailWrapper('Order Placed', body),
    });
    console.log(`✓ Order placed email sent to ${customerEmail}`);
  } catch (error) {
    console.error('Failed to send order placed email:', error);
    throw error;
  }
};

/**
 * Send order confirmed email — Luxury Rose Gold theme
 */
export const sendOrderConfirmedEmail = async (data: OrderEmailData) => {
  const { customerEmail, customerName, orderNumber, totalAmount } = data;

  const body = `
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 10px 28px; border-radius: 50px; font-size: 15px; letter-spacing: 1px;">
        ✓ Order Confirmed
      </div>
    </div>
    
    <p style="font-size: 16px; color: #444; margin: 0 0 8px 0;">Dear <strong>${customerName}</strong>,</p>
    <p style="font-size: 15px; color: #666; line-height: 1.7; margin: 0 0 24px 0;">
      Great news! Your payment has been verified and your order is confirmed. We're now preparing your jewellery with care.
    </p>
    
    <div style="background: #faf5f4; border-radius: 10px; padding: 18px; margin-bottom: 20px; text-align: center;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #B76E79; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
      <p style="margin: 0; font-size: 22px; font-weight: 700; color: #333; letter-spacing: 2px;">${orderNumber}</p>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #999;">Status: <span style="color: #10b981; font-weight: 600;">Confirmed</span></p>
      <p style="margin: 8px 0 0 0; font-size: 15px; color: #444;"><strong>Total: ₹${totalAmount.toFixed(2)}</strong></p>
    </div>
    
    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 0 10px 10px 0; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #065f46;">📦 What's Next?</p>
      <p style="margin: 0; font-size: 13px; color: #047857; line-height: 1.6;">We're carefully packaging your items. You'll receive a shipping confirmation email with tracking details once dispatched. Expected delivery: 3–5 business days.</p>
    </div>
    
    <div style="text-align: center; margin: 28px 0 0 0;">
      <a href="${FRONTEND_URL}/account" style="display: inline-block; background: linear-gradient(135deg, #B76E79, #C9929D); color: white; padding: 14px 36px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 14px; letter-spacing: 1px;">Track My Order</a>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: customerEmail,
      subject: `✓ Order Confirmed — ${orderNumber} | ORA Jewellery`,
      html: emailWrapper('Order Confirmed', body),
    });
    console.log(`✓ Order confirmed email sent to ${customerEmail}`);
  } catch (error) {
    console.error('Failed to send order confirmed email:', error);
    throw error;
  }
};

/**
 * Send order shipped email — Luxury Rose Gold theme
 */
export const sendOrderShippedEmail = async (data: OrderEmailData) => {
  const { customerEmail, customerName, orderNumber, trackingNumber, courierName } = data;

  const body = `
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 10px 28px; border-radius: 50px; font-size: 15px; letter-spacing: 1px;">
        🚚 Your Order is On Its Way!
      </div>
    </div>
    
    <p style="font-size: 16px; color: #444; margin: 0 0 8px 0;">Dear <strong>${customerName}</strong>,</p>
    <p style="font-size: 15px; color: #666; line-height: 1.7; margin: 0 0 24px 0;">
      Your ORA jewellery has been dispatched and is on its way to you!
    </p>
    
    <div style="background: #faf5f4; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
      <p style="margin: 0 0 12px 0; font-size: 12px; color: #B76E79; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Shipping Details</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #888;">Order Number</td>
          <td style="padding: 6px 0; text-align: right; font-size: 14px; color: #333; font-weight: 600;">${orderNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #888;">Status</td>
          <td style="padding: 6px 0; text-align: right; font-size: 14px; color: #8b5cf6; font-weight: 600;">Shipped</td>
        </tr>
        ${courierName ? `<tr>
          <td style="padding: 6px 0; font-size: 13px; color: #888;">Courier</td>
          <td style="padding: 6px 0; text-align: right; font-size: 14px; color: #333;">${courierName}</td>
        </tr>` : ''}
        ${trackingNumber ? `<tr>
          <td style="padding: 6px 0; font-size: 13px; color: #888;">Tracking</td>
          <td style="padding: 6px 0; text-align: right; font-size: 14px; color: #333; font-family: monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${trackingNumber}</td>
        </tr>` : ''}
      </table>
    </div>
    
    <div style="background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 16px; border-radius: 0 10px 10px 0; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #5b21b6;">📍 Track Your Package</p>
      <p style="margin: 0; font-size: 13px; color: #6d28d9; line-height: 1.6;">Use the tracking number above on your courier's website. Expected delivery: 3–7 business days.</p>
    </div>
    
    <div style="text-align: center; margin: 28px 0 0 0;">
      <a href="${FRONTEND_URL}/track-order" style="display: inline-block; background: linear-gradient(135deg, #B76E79, #C9929D); color: white; padding: 14px 36px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 14px; letter-spacing: 1px;">Track My Order</a>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: customerEmail,
      subject: `🚚 Order Shipped — ${orderNumber} | ORA Jewellery`,
      html: emailWrapper('Order Shipped', body),
    });
    console.log(`✓ Order shipped email sent to ${customerEmail}`);
  } catch (error) {
    console.error('Failed to send order shipped email:', error);
    throw error;
  }
};

/**
 * Send order delivered email — Luxury Rose Gold theme
 */
export const sendOrderDeliveredEmail = async (data: OrderEmailData) => {
  const { customerEmail, customerName, orderNumber } = data;

  const body = `
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #B76E79, #E8A0BF); color: white; padding: 10px 28px; border-radius: 50px; font-size: 15px; letter-spacing: 1px;">
        🎉 Order Delivered!
      </div>
    </div>
    
    <p style="font-size: 16px; color: #444; margin: 0 0 8px 0;">Dear <strong>${customerName}</strong>,</p>
    <p style="font-size: 15px; color: #666; line-height: 1.7; margin: 0 0 24px 0;">
      Your ORA jewellery has been successfully delivered! We hope you absolutely love it. ✨
    </p>
    
    <div style="background: #faf5f4; border-radius: 10px; padding: 18px; margin-bottom: 20px; text-align: center;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #B76E79; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
      <p style="margin: 0; font-size: 22px; font-weight: 700; color: #333; letter-spacing: 2px;">${orderNumber}</p>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #999;">Status: <span style="color: #10b981; font-weight: 600;">✓ Delivered</span></p>
    </div>
    
    <!-- Review CTA -->
    <div style="background: linear-gradient(135deg, #fdf2f0, #fff5f3); border: 1px solid #f0e0dc; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 6px 0; font-size: 20px;">💝</p>
      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #B76E79;">Love your jewellery?</p>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #888;">Share your experience and help other jewellery lovers discover ORA.</p>
      <a href="${FRONTEND_URL}/account" style="display: inline-block; background: linear-gradient(135deg, #B76E79, #C9929D); color: white; padding: 12px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 13px; letter-spacing: 1px;">Write a Review</a>
    </div>
    
    <!-- Return policy reminder -->
    <div style="background: #fff8f0; border-left: 4px solid #B76E79; padding: 16px; border-radius: 0 10px 10px 0; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #B76E79;">🔁 5-Day Returns</p>
      <p style="margin: 0; font-size: 13px; color: #777; line-height: 1.6;">Not satisfied? You can request a return within 5 days of delivery. <a href="${FRONTEND_URL}/returns" style="color: #B76E79; text-decoration: underline;">Learn more</a></p>
    </div>
    
    <div style="text-align: center; margin: 16px 0 0 0;">
      <p style="font-size: 13px; color: #aaa;">Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color: #B76E79; text-decoration: none;">${SUPPORT_EMAIL}</a></p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: customerEmail,
      subject: `🎉 Order Delivered — ${orderNumber} | ORA Jewellery`,
      html: emailWrapper('Order Delivered', body),
    });
    console.log(`✓ Order delivered email sent to ${customerEmail}`);
  } catch (error) {
    console.error('Failed to send order delivered email:', error);
    throw error;
  }
};

/**
 * Send abandoned cart reminder email — Luxury Rose Gold theme
 */
export const sendAbandonedCartEmail = async (data: {
  customerEmail: string;
  customerName: string;
  items: Array<{ productName: string; unitPrice: number; quantity: number }>;
  cartTotal: number;
}) => {
  const { customerEmail, customerName, items, cartTotal } = data;

  const itemsList = items.slice(0, 4).map(item => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #f5e6e3; font-size: 14px; color: #444;">${item.productName}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #f5e6e3; text-align: right; font-size: 14px; color: #444; font-weight: 600;">₹${item.unitPrice.toFixed(2)}</td>
    </tr>
  `).join('');

  const body = `
    <div style="text-align: center; margin-bottom: 28px;">
      <p style="font-size: 40px; margin: 0;">💎</p>
      <h2 style="margin: 8px 0 0 0; font-size: 22px; color: #333; font-weight: 400;">You left something beautiful behind</h2>
    </div>
    
    <p style="font-size: 15px; color: #666; line-height: 1.7; margin: 0 0 24px 0;">
      Hi <strong>${customerName}</strong>, we noticed you didn't complete your purchase. Your carefully chosen pieces are still waiting for you!
    </p>
    
    <!-- Cart items -->
    <div style="background: #faf5f4; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 12px 0; font-size: 12px; color: #B76E79; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Cart</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${itemsList}
      </table>
      ${items.length > 4 ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #999;">+ ${items.length - 4} more item(s)</p>` : ''}
      <div style="margin-top: 12px; padding-top: 12px; border-top: 2px solid #B76E79;">
        <table role="presentation" width="100%">
          <tr>
            <td style="font-size: 16px; font-weight: 700; color: #B76E79;">Cart Total</td>
            <td style="text-align: right; font-size: 16px; font-weight: 700; color: #B76E79;">₹${cartTotal.toFixed(2)}</td>
          </tr>
        </table>
      </div>
    </div>
    
    <!-- Urgency + CTA -->
    <div style="text-align: center; margin: 28px 0;">
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #888;">🕐 Items in your cart may sell out soon</p>
      <a href="${FRONTEND_URL}/cart" style="display: inline-block; background: linear-gradient(135deg, #B76E79, #E8A0BF); color: white; padding: 16px 44px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 15px; letter-spacing: 1px;">Complete My Order</a>
    </div>
    
    <!-- Trust signals -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td style="text-align: center; padding: 8px; font-size: 12px; color: #999;">🔒 Secure Checkout</td>
        <td style="text-align: center; padding: 8px; font-size: 12px; color: #999;">🚚 Free Delivery</td>
        <td style="text-align: center; padding: 8px; font-size: 12px; color: #999;">🔁 5-Day Returns</td>
      </tr>
    </table>
  `;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: customerEmail,
      subject: `💎 Your ORA jewellery is waiting for you!`,
      html: emailWrapper('Your Cart Awaits', body),
    });
    console.log(`✓ Abandoned cart email sent to ${customerEmail}`);
  } catch (error) {
    console.error('Failed to send abandoned cart email:', error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
// POST-PURCHASE LIFECYCLE EMAILS (Phase 9)
// ═══════════════════════════════════════════════════════════════

/**
 * Day 2 — Shipping Reassurance Email
 * Builds trust while the order is in transit.
 */
export const sendShippingReassuranceEmail = async (data: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  trackingNumber?: string;
  courierName?: string;
}) => {
  const { customerEmail, customerName, orderNumber, trackingNumber, courierName } = data;

  const body = `
    <div style="text-align: center; margin-bottom: 28px;">
      <p style="font-size: 36px; margin: 0;">📦</p>
      <h2 style="margin: 8px 0 0 0; font-size: 22px; color: #333; font-weight: 400;">Your jewellery is on its way!</h2>
    </div>

    <p style="font-size: 15px; color: #666; line-height: 1.7; margin: 0 0 20px 0;">
      Hi <strong>${customerName}</strong>, just a quick update — your ORA order <strong>${orderNumber}</strong> is making its way to you.
    </p>

    ${trackingNumber ? `
    <div style="background: #faf5f4; border-radius: 10px; padding: 18px; margin-bottom: 20px; text-align: center;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #B76E79; text-transform: uppercase; letter-spacing: 1px;">Tracking Number</p>
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #333; font-family: monospace; letter-spacing: 2px;">${trackingNumber}</p>
      ${courierName ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: #999;">via ${courierName}</p>` : ''}
    </div>
    ` : ''}

    <div style="background: #fff8f0; border-left: 4px solid #B76E79; padding: 16px; border-radius: 0 10px 10px 0; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #B76E79;">✨ Crafted with care</p>
      <p style="margin: 0; font-size: 13px; color: #777; line-height: 1.6;">Every ORA piece is quality-checked and packed in our signature gift box. We can't wait for you to unbox it!</p>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
      <tr>
        <td style="text-align: center; padding: 8px; font-size: 12px; color: #999;">🔒 Secure Payment</td>
        <td style="text-align: center; padding: 8px; font-size: 12px; color: #999;">🚚 Free Delivery</td>
        <td style="text-align: center; padding: 8px; font-size: 12px; color: #999;">🔁 5-Day Returns</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 28px 0 0 0;">
      <a href="${FRONTEND_URL}/track-order" style="display: inline-block; background: linear-gradient(135deg, #B76E79, #C9929D); color: white; padding: 14px 36px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 14px; letter-spacing: 1px;">Track My Order</a>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: customerEmail,
      subject: `📦 Your ORA order is on its way — ${orderNumber}`,
      html: emailWrapper('Shipping Update', body),
    });
    console.log(`✓ Shipping reassurance email sent to ${customerEmail}`);
  } catch (error) {
    console.error('Failed to send shipping reassurance email:', error);
    throw error;
  }
};

/**
 * Day 7 — Review Request Email
 * Asks for a review after the customer has had time to try the product.
 */
export const sendReviewRequestEmail = async (data: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  items: Array<{ productName: string; productSlug?: string }>;
}) => {
  const { customerEmail, customerName, orderNumber, items } = data;

  const productNames = items.slice(0, 3).map(i => i.productName).join(', ');
  const firstSlug = items[0]?.productSlug || '';

  const body = `
    <div style="text-align: center; margin-bottom: 28px;">
      <p style="font-size: 36px; margin: 0;">💝</p>
      <h2 style="margin: 8px 0 0 0; font-size: 22px; color: #333; font-weight: 400;">How are you loving your jewellery?</h2>
    </div>

    <p style="font-size: 15px; color: #666; line-height: 1.7; margin: 0 0 20px 0;">
      Hi <strong>${customerName}</strong>, it's been a week since your order <strong>${orderNumber}</strong> arrived. We hope you're loving your <strong>${productNames}</strong>!
    </p>

    <div style="background: linear-gradient(135deg, #fdf2f0, #fff5f3); border: 1px solid #f0e0dc; border-radius: 12px; padding: 28px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #B76E79;">Share your experience</p>
      <p style="margin: 0 0 20px 0; font-size: 13px; color: #888; line-height: 1.5;">Your review helps other jewellery lovers discover ORA.<br>It only takes a minute!</p>

      <!-- Star rating visual -->
      <p style="margin: 0 0 20px 0; font-size: 28px; letter-spacing: 4px;">⭐⭐⭐⭐⭐</p>

      <a href="${FRONTEND_URL}/products/${firstSlug}#reviews" style="display: inline-block; background: linear-gradient(135deg, #B76E79, #E8A0BF); color: white; padding: 14px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 14px; letter-spacing: 1px;">Write a Review</a>
    </div>

    <p style="font-size: 13px; color: #aaa; text-align: center; margin-top: 20px;">
      Not satisfied? <a href="mailto:${SUPPORT_EMAIL}" style="color: #B76E79; text-decoration: none;">Contact us</a> — we're here to help.
    </p>
  `;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: customerEmail,
      subject: `⭐ How's your ORA jewellery? We'd love your review!`,
      html: emailWrapper('Review Request', body),
    });
    console.log(`✓ Review request email sent to ${customerEmail}`);
  } catch (error) {
    console.error('Failed to send review request email:', error);
    throw error;
  }
};

/**
 * Day 21 — Reorder / Browse Again Suggestion
 * Gentle reminder with new arrivals or complementary pieces.
 */
export const sendReorderSuggestionEmail = async (data: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
}) => {
  const { customerEmail, customerName, orderNumber } = data;

  const body = `
    <div style="text-align: center; margin-bottom: 28px;">
      <p style="font-size: 36px; margin: 0;">✨</p>
      <h2 style="margin: 8px 0 0 0; font-size: 22px; color: #333; font-weight: 400;">New pieces, curated for you</h2>
    </div>

    <p style="font-size: 15px; color: #666; line-height: 1.7; margin: 0 0 20px 0;">
      Hi <strong>${customerName}</strong>, it's been a few weeks since your order <strong>${orderNumber}</strong>. We've been busy adding gorgeous new pieces to our collection!
    </p>

    <div style="background: #faf5f4; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #B76E79;">🆕 New Arrivals</p>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #888;">Fresh designs that complement your collection perfectly.</p>
      <a href="${FRONTEND_URL}/collections/new-arrivals" style="display: inline-block; background: linear-gradient(135deg, #B76E79, #E8A0BF); color: white; padding: 14px 36px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 14px; letter-spacing: 1px;">Explore New Arrivals</a>
    </div>

    <div style="background: #fff8f0; border-left: 4px solid #B76E79; padding: 16px; border-radius: 0 10px 10px 0; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #B76E79;">💎 Complete Your Look</p>
      <p style="margin: 0; font-size: 13px; color: #777; line-height: 1.6;">Pair your existing pieces with matching earrings, bracelets, or necklaces from our curated sets.</p>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${FRONTEND_URL}/collections" style="display: inline-block; border: 2px solid #B76E79; color: #B76E79; padding: 12px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 13px; letter-spacing: 1px;">Browse All Collections</a>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: customerEmail,
      subject: `✨ New arrivals at ORA — curated just for you`,
      html: emailWrapper('New Arrivals', body),
    });
    console.log(`✓ Reorder suggestion email sent to ${customerEmail}`);
  } catch (error) {
    console.error('Failed to send reorder suggestion email:', error);
    throw error;
  }
};

export const sendAdminNewOrderEmail = async (data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
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
}) => {
  const adminEmail = Array.from(new Set([
    'admin@orashop.in',
    process.env.ORDER_ALERT_EMAIL,
    process.env.ADMIN_EMAIL,
  ].filter(Boolean))).join(', ');

  const { orderNumber, customerName, customerEmail, customerPhone, totalAmount, paymentMethod, items, shippingAddress } = data;
  const itemsHtml = items.map(i => `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${i.productName}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${i.quantity}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(i.unitPrice * i.quantity).toLocaleString('en-IN')}</td></tr>`).join('');

  const body = `
    <div style="background: #1e293b; color: white; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
      <h2 style="margin: 0; font-size: 20px;">🛍️ NEW ORDER RECEIVED</h2>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #94a3b8;">Order #${orderNumber}</p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #0f172a;">Customer Details</p>
      <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Name:</strong> ${customerName}</p>
      <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Email:</strong> ${customerEmail}</p>
      <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Phone:</strong> ${customerPhone || 'N/A'}</p>
      <p style="margin: 0; font-size: 14px;"><strong>Payment Method:</strong> ${paymentMethod === 'COD' ? '💵 Cash on Delivery (COD)' : '💳 Online Payment (Razorpay)'}</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
      <thead>
        <tr style="background: #f1f5f9; text-align: left;">
          <th style="padding: 8px;">Product</th>
          <th style="padding: 8px; text-align: center;">Qty</th>
          <th style="padding: 8px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div style="text-align: right; font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 24px;">
      Total Amount: ₹${totalAmount.toLocaleString('en-IN')}
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #0f172a;">Shipping Address</p>
      <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.5;">
        ${shippingAddress.fullName}<br/>
        ${shippingAddress.addressLine1}${shippingAddress.addressLine2 ? ', ' + shippingAddress.addressLine2 : ''}<br/>
        ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.pincode}
      </p>
    </div>

    <div style="text-align: center;">
      <a href="${FRONTEND_URL}/admin/v2/orders" style="display: inline-block; background: #0f172a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Open Admin Panel V2</a>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: adminEmail,
      subject: `🚨 [NEW ORDER] #${orderNumber} — ₹${totalAmount.toLocaleString('en-IN')} (${paymentMethod})`,
      html: emailWrapper('New Order Alert', body),
    });
    console.log(`✓ Admin order alert email sent successfully to ${adminEmail}`);
  } catch (error) {
    console.error('Failed to send admin order alert email to', adminEmail, 'Error:', error);
  }
};

export default {
  sendOrderPlacedEmail,
  sendOrderConfirmedEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendAbandonedCartEmail,
  sendShippingReassuranceEmail,
  sendReviewRequestEmail,
  sendReorderSuggestionEmail,
  sendAdminNewOrderEmail,
};
