import * as nodemailer from 'nodemailer';

// Create transporter with environment config (lazy initialization)
let transporter: nodemailer.Transporter | null = null;
let transporterVerified = false;

function getTransporter() {
  if (!transporter) {
    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587');
    const secure = (process.env.EMAIL_SECURE === 'true') || port === 465;
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

    if (!user || !pass) {
      console.warn('⚠️ [Email] No EMAIL_USER/EMAIL_PASS configured. Emails will be skipped.');
    } else {
      console.log(`📧 [Email] Transporter init: ${host}:${port} (user: ${user.substring(0, 3)}***)`);
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      // Gmail-specific: needed for App Passwords
      ...(host.includes('gmail') && {
        service: 'gmail',
        // Remove host/port when using 'service' — nodemailer handles it
      }),
    } as nodemailer.TransportOptions);

    // Verify connection on first use (non-blocking)
    if (user && pass && !transporterVerified) {
      transporter.verify()
        .then(() => {
          transporterVerified = true;
          console.log('✅ [Email] SMTP connection verified successfully');
        })
        .catch((err) => {
          console.error('❌ [Email] SMTP verification failed:', err.message);
          console.error('   → Check EMAIL_HOST, EMAIL_USER, EMAIL_PASS in your .env');
          console.error('   → For Gmail: use an App Password (not your regular password)');
          console.error('   → Generate at: https://myaccount.google.com/apppasswords');
        });
    }
  }
  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

    if (!user || !pass) {
      console.warn('⚠️ [Email] Not configured (EMAIL_USER/EMAIL_PASS missing). Skipping email to:', options.to);
      console.log(`📧 [Email] Would have sent: "${options.subject}" to ${options.to}`);
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"ORA Jewellery" <${user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await getTransporter().sendMail(mailOptions);
    console.log(`✅ [Email] Sent to ${options.to}. Subject: "${options.subject}". MessageID: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ [Email] Failed to send to ${options.to}:`, error.message);
    
    // Provide actionable error messages
    if (error.code === 'EAUTH') {
      console.error('   → Authentication failed. For Gmail, use an App Password:');
      console.error('   → https://myaccount.google.com/apppasswords');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   → Connection refused. Check EMAIL_HOST and EMAIL_PORT.');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
      console.error('   → Connection timed out. SMTP server may be unreachable from this host.');
    } else if (error.responseCode === 535) {
      console.error('   → Bad credentials. Check EMAIL_USER and EMAIL_PASS.');
    }
    
    return false;
  }
};

// Email Templates
export const getWelcomeEmailTemplate = (name: string): string => {
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

export const getOtpEmailTemplate = (name: string, otp: string): string => {
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

export const getOrderConfirmationTemplate = (orderNumber: string, totalAmount: number): string => {
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

export const getReturnApprovedTemplate = (name: string, orderNumber: string, returnId: string): string => {
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

export const getRefundProcessedTemplate = (name: string, orderNumber: string, refundAmount: number): string => {
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
