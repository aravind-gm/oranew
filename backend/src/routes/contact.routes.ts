import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Reuse the same transporter config as the email service
const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
const emailHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
const emailPort = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587');

const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: (process.env.EMAIL_SECURE === 'true') || emailPort === 465,
  auth: emailUser && emailPass ? { user: emailUser, pass: emailPass } : undefined,
  connectionTimeout: 15000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  ...(emailHost.includes('gmail') && { service: 'gmail' }),
} as nodemailer.TransportOptions);

const EMAIL_FROM = process.env.EMAIL_FROM || `"ORA Jewellery" <${emailUser || 'noreply@orashop.in'}>`;

// Rate limit: max 3 contact form submissions per IP per 15 minutes
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { success: false, error: 'Too many submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/contact
 * Sends the contact form to admin email
 */
router.post('/', contactLimiter, async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, orderId, message } = req.body;

    if (!fullName || !email || !message) {
      return res.status(400).json({ success: false, error: 'Name, email, and message are required.' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address.' });
    }

    // Send to admin
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: 'admin@orashop.in',
      replyTo: email,
      subject: `[ORA Contact] New message from ${fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E75480;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold;">Name:</td><td style="padding: 8px;">${fullName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Phone:</td><td style="padding: 8px;">${phone || 'Not provided'}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Order ID:</td><td style="padding: 8px;">${orderId || 'N/A'}</td></tr>
          </table>
          <h3 style="margin-top: 16px;">Message:</h3>
          <p style="background: #f9f9f9; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${message}</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('[Contact] Error sending contact form:', error);
    return res.status(500).json({ success: false, error: 'Failed to send message. Please try again.' });
  }
});

/**
 * POST /api/contact/subscribe
 * Newsletter subscription endpoint (public)
 */
router.post('/subscribe', contactLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address.' });
    }

    // Send notification to admin about new subscriber
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: 'admin@orashop.in',
      subject: `[ORA] New newsletter subscriber: ${email}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #E75480;">New Newsletter Subscriber</h2>
          <p>Email: <strong>${email}</strong></p>
          <p>Subscribed at: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: 'Subscribed successfully.' });
  } catch (error) {
    console.error('[Contact] Newsletter subscribe error:', error);
    return res.status(200).json({ success: true, message: 'Subscribed successfully.' });
  }
});

export default router;
