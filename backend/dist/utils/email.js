"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRefundProcessedTemplate = exports.getReturnApprovedTemplate = exports.getOrderConfirmationTemplate = exports.getOtpEmailTemplate = exports.getWelcomeEmailTemplate = exports.sendEmail = void 0;
const nodemailer = __importStar(require("nodemailer"));
// Create transporter with environment config (lazy initialization)
let transporter = null;
function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }
    return transporter;
}
const sendEmail = async (options) => {
    try {
        if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('⚠️ Email not configured. Skipping email to:', options.to);
            console.log('📧 OTP would have been sent:', options.subject);
            return false;
        }
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: options.to,
            subject: options.subject,
            html: options.html,
        };
        const info = await getTransporter().sendMail(mailOptions);
        console.log(`✅ Email sent to ${options.to}. Message ID: ${info.messageId}`);
        return true;
    }
    catch (error) {
        console.error('❌ Email error:', error);
        return false;
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
const getOtpEmailTemplate = (name, otp) => {
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
        .otp-code { display: inline-block; padding: 12px 32px; background: #FFD6E8; color: #2D2D2D; border-radius: 8px; margin-top: 20px; font-weight: 600; font-size: 24px; font-family: 'Courier New', monospace; }
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
          <h1>Your Login Code</h1>
          <p>Hi ${name},</p>
          <p>Enter this code to verify your email and access your account:</p>
          <div class="otp-code">${otp}</div>
          <div class="warning">
            <strong>This code expires in 10 minutes.</strong> If you didn't request this, you can safely ignore this email.
          </div>
          <p style="margin-top: 20px; font-size: 14px;">Never share this code with anyone. ORA will never ask for your code.</p>
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
exports.getOtpEmailTemplate = getOtpEmailTemplate;
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