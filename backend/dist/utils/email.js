"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRefundProcessedTemplate = exports.getReturnApprovedTemplate = exports.getOrderConfirmationTemplate = exports.getPasswordResetEmailTemplate = exports.getWelcomeEmailTemplate = exports.sendEmail = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
    mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
}
const sendEmail = async (options) => {
    try {
        if (!process.env.SENDGRID_API_KEY || !process.env.FROM_EMAIL) {
            console.warn('⚠️ SendGrid not configured. Skipping email to:', options.to);
            return;
        }
        const msg = {
            to: options.to,
            from: process.env.FROM_EMAIL,
            subject: options.subject,
            html: options.html,
        };
        const response = await mail_1.default.send(msg);
        console.log(`✅ Email sent to ${options.to}. Message ID: ${response[0].headers['x-message-id']}`);
    }
    catch (error) {
        console.error('❌ Email error:', error);
        // Don't throw - allow app to continue even if email fails
    }
};
exports.sendEmail = sendEmail;
// Email Templates
const getWelcomeEmailTemplate = (name) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', sans-serif; color: #2D2D2D; background: #FDFBF7; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 32px; font-weight: bold; color: #FFD6E8; }
        .tagline { font-size: 14px; color: #6B6B6B; margin-top: 8px; }
        .content { background: white; padding: 40px; border-radius: 8px; }
        h1 { font-family: 'Cormorant Garamond', serif; font-size: 28px; margin-bottom: 20px; }
        .button { display: inline-block; padding: 12px 32px; background: #FFD6E8; color: #2D2D2D; text-decoration: none; border-radius: 8px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">ORA</div>
          <div class="tagline">own. radiate. adorn.</div>
        </div>
        <div class="content">
          <h1>Welcome to ORA, ${name}!</h1>
          <p>Thank you for joining our luxury jewellery community.</p>
          <p>We're delighted to have you here. Explore our exclusive collection of handcrafted artificial jewellery designed to make you shine.</p>
          <a href="${process.env.FRONTEND_URL}/products" class="button">Start Shopping</a>
        </div>
      </div>
    </body>
    </html>
  `;
};
exports.getWelcomeEmailTemplate = getWelcomeEmailTemplate;
const getPasswordResetEmailTemplate = (name, resetUrl) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', sans-serif; color: #2D2D2D; background: #FDFBF7; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 32px; font-weight: bold; color: #FFD6E8; }
        .tagline { font-size: 14px; color: #6B6B6B; margin-top: 8px; }
        .content { background: white; padding: 40px; border-radius: 8px; }
        h1 { font-family: 'Cormorant Garamond', serif; font-size: 28px; margin-bottom: 20px; }
        .warning { background: #FEF3CD; padding: 15px; border-left: 4px solid #FFC107; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; padding: 12px 32px; background: #FFD6E8; color: #2D2D2D; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 500; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E5E5; font-size: 12px; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">ORA</div>
          <div class="tagline">own. radiate. adorn.</div>
        </div>
        <div class="content">
          <h1>Reset Your Password</h1>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password.</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <div class="warning">
            <strong>This link expires in 1 hour.</strong> If you didn't request this, you can safely ignore this email.
          </div>
          <p>Or paste this link in your browser:</p>
          <p style="word-break: break-all; font-size: 12px; color: #666;"><code>${resetUrl}</code></p>
          <div class="footer">
            <p>This is an automated email. Please do not reply directly.</p>
            <p>&copy; ${new Date().getFullYear()} ORA Jewellery. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
exports.getPasswordResetEmailTemplate = getPasswordResetEmailTemplate;
const getOrderConfirmationTemplate = (orderNumber, totalAmount) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', sans-serif; color: #2D2D2D; background: #FDFBF7; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 32px; font-weight: bold; color: #FFD6E8; }
        .content { background: white; padding: 40px; border-radius: 8px; }
        h1 { font-family: 'Cormorant Garamond', serif; font-size: 28px; margin-bottom: 20px; }
        .order-box { background: #FDFBF7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 32px; background: #FFD6E8; color: #2D2D2D; text-decoration: none; border-radius: 8px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">ORA</div>
        </div>
        <div class="content">
          <h1>Order Confirmed!</h1>
          <p>Thank you for your order. We're processing it now.</p>
          <div class="order-box">
            <strong>Order Number:</strong> ${orderNumber}<br>
            <strong>Total Amount:</strong> ₹${totalAmount.toFixed(2)}
          </div>
          <p>You will receive a shipping confirmation email once your order is on the way.</p>
          <a href="${process.env.FRONTEND_URL}/orders/${orderNumber}" class="button">Track Order</a>
        </div>
      </div>
    </body>
    </html>
  `;
};
exports.getOrderConfirmationTemplate = getOrderConfirmationTemplate;
const getReturnApprovedTemplate = (name, orderNumber, returnId) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', sans-serif; color: #2D2D2D; background: #FDFBF7; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 32px; font-weight: bold; color: #FFD6E8; }
        .tagline { font-size: 14px; color: #6B6B6B; margin-top: 8px; }
        .content { background: white; padding: 40px; border-radius: 8px; }
        h1 { font-family: 'Cormorant Garamond', serif; font-size: 28px; margin-bottom: 20px; }
        .status-box { background: #D4EDDA; padding: 15px; border-left: 4px solid #28A745; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; padding: 12px 32px; background: #FFD6E8; color: #2D2D2D; text-decoration: none; border-radius: 8px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">ORA</div>
          <div class="tagline">own. radiate. adorn.</div>
        </div>
        <div class="content">
          <h1>Return Approved</h1>
          <p>Hi ${name},</p>
          <p>Great news! Your return request for order <strong>${orderNumber}</strong> has been approved.</p>
          <div class="status-box">
            <strong>Return ID:</strong> ${returnId}<br>
            <strong>Status:</strong> Approved
          </div>
          <p>We'll process your refund within 5-7 business days. You should see the amount credited back to your original payment method.</p>
          <a href="${process.env.FRONTEND_URL}/account/orders/${orderNumber}" class="button">View Order</a>
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E5E5; font-size: 12px; color: #888;">
            If you have any questions, please contact our customer support team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};
exports.getReturnApprovedTemplate = getReturnApprovedTemplate;
const getRefundProcessedTemplate = (name, orderNumber, refundAmount) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', sans-serif; color: #2D2D2D; background: #FDFBF7; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 32px; font-weight: bold; color: #FFD6E8; }
        .tagline { font-size: 14px; color: #6B6B6B; margin-top: 8px; }
        .content { background: white; padding: 40px; border-radius: 8px; }
        h1 { font-family: 'Cormorant Garamond', serif; font-size: 28px; margin-bottom: 20px; }
        .amount-box { background: #FDFBF7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #FFD6E8; text-align: center; }
        .amount { font-size: 32px; font-weight: bold; color: #FFD6E8; }
        .button { display: inline-block; padding: 12px 32px; background: #FFD6E8; color: #2D2D2D; text-decoration: none; border-radius: 8px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">ORA</div>
          <div class="tagline">own. radiate. adorn.</div>
        </div>
        <div class="content">
          <h1>Refund Processed</h1>
          <p>Hi ${name},</p>
          <p>Your refund for order <strong>${orderNumber}</strong> has been successfully processed!</p>
          <div class="amount-box">
            <div>Refund Amount</div>
            <div class="amount">₹${refundAmount.toFixed(2)}</div>
          </div>
          <p>The amount has been credited back to your original payment method. Depending on your bank, it may take 3-5 business days to appear in your account.</p>
          <a href="${process.env.FRONTEND_URL}/account/orders/${orderNumber}" class="button">View Order</a>
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E5E5; font-size: 12px; color: #888;">
            Thank you for choosing ORA. We hope to serve you again soon.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};
exports.getRefundProcessedTemplate = getRefundProcessedTemplate;
//# sourceMappingURL=email.js.map