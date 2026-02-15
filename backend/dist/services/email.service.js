"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAbandonedCartEmail = exports.sendOrderDeliveredEmail = exports.sendOrderShippedEmail = exports.sendOrderConfirmedEmail = exports.sendOrderPlacedEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Email configuration — supports both EMAIL_* and SMTP_* env vars for compatibility
const transporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'),
    secure: (process.env.EMAIL_SECURE || 'false') === 'true',
    auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER,
        pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
    },
});
const EMAIL_FROM = process.env.EMAIL_FROM || `"ORA Jewellery" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`;
const SUPPORT_EMAIL = 'admin@orashop.in';
const BRAND_PHONE = '+91 98765 43210';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://orashop.vercel.app';
// ═══════════════════════════════════════════════════════════════
// ORA Luxury Email Template System — White + Rose Gold Theme
// ═══════════════════════════════════════════════════════════════
const emailWrapper = (title, body) => `
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
                    <p style="margin: 16px 0 0 0; font-size: 11px; color: #ccc;">© ${new Date().getFullYear()} ORA Jewellery. All rights reserved.</p>
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
// ─────────────────────────────────────
// Helper: Build items table HTML
// ─────────────────────────────────────
const buildItemsTable = (items, totalAmount, gst, shipping, discount) => {
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
const buildAddressBlock = (addr) => `
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
const sendOrderPlacedEmail = async (data) => {
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
    }
    catch (error) {
        console.error('Failed to send order placed email:', error);
        throw error;
    }
};
exports.sendOrderPlacedEmail = sendOrderPlacedEmail;
/**
 * Send order confirmed email — Luxury Rose Gold theme
 */
const sendOrderConfirmedEmail = async (data) => {
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
    }
    catch (error) {
        console.error('Failed to send order confirmed email:', error);
        throw error;
    }
};
exports.sendOrderConfirmedEmail = sendOrderConfirmedEmail;
/**
 * Send order shipped email — Luxury Rose Gold theme
 */
const sendOrderShippedEmail = async (data) => {
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
    }
    catch (error) {
        console.error('Failed to send order shipped email:', error);
        throw error;
    }
};
exports.sendOrderShippedEmail = sendOrderShippedEmail;
/**
 * Send order delivered email — Luxury Rose Gold theme
 */
const sendOrderDeliveredEmail = async (data) => {
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
    }
    catch (error) {
        console.error('Failed to send order delivered email:', error);
        throw error;
    }
};
exports.sendOrderDeliveredEmail = sendOrderDeliveredEmail;
/**
 * Send abandoned cart reminder email — Luxury Rose Gold theme
 */
const sendAbandonedCartEmail = async (data) => {
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
    }
    catch (error) {
        console.error('Failed to send abandoned cart email:', error);
        throw error;
    }
};
exports.sendAbandonedCartEmail = sendAbandonedCartEmail;
exports.default = {
    sendOrderPlacedEmail: exports.sendOrderPlacedEmail,
    sendOrderConfirmedEmail: exports.sendOrderConfirmedEmail,
    sendOrderShippedEmail: exports.sendOrderShippedEmail,
    sendOrderDeliveredEmail: exports.sendOrderDeliveredEmail,
    sendAbandonedCartEmail: exports.sendAbandonedCartEmail,
};
//# sourceMappingURL=email.service.js.map