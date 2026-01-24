import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
}

/**
 * Send order placed email to customer
 */
export const sendOrderPlacedEmail = async (data: OrderEmailData) => {
  const { customerEmail, customerName, orderNumber, items, totalAmount, shippingAddress } = data;

  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.unitPrice.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Placed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">✓ Order Placed Successfully!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Thank you for shopping with ORA Jewellery</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-top: 0;">Dear ${customerName},</p>
        <p style="font-size: 16px;">Your order has been placed successfully! We'll send you another email when your order is confirmed and ready for shipping.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #667eea;">Order Details</h2>
          <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #f59e0b;">Pending Confirmation</span></p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; text-align: left;">Product</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 15px 10px; text-align: right; font-weight: bold; color: #667eea;">₹${totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Shipping Address</h3>
          <p style="margin: 5px 0;">${shippingAddress.fullName}</p>
          <p style="margin: 5px 0;">${shippingAddress.addressLine1}</p>
          ${shippingAddress.addressLine2 ? `<p style="margin: 5px 0;">${shippingAddress.addressLine2}</p>` : ''}
          <p style="margin: 5px 0;">${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.pincode}</p>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;"><strong>⏳ What's Next?</strong></p>
          <p style="margin: 5px 0 0 0; color: #92400e;">Our team will verify your payment and confirm your order within 24 hours. You'll receive another email once confirmed.</p>
        </div>
        
        <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
          If you have any questions, please don't hesitate to contact us.
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"ORA Jewellery" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `Order Placed Successfully - ${orderNumber}`,
      html,
    });
    console.log(`✓ Order placed email sent to ${customerEmail}`);
  } catch (error) {
    console.error('Failed to send order placed email:', error);
    throw error;
  }
};

/**
 * Send order confirmed email (after admin manual confirmation)
 */
export const sendOrderConfirmedEmail = async (data: OrderEmailData) => {
  const { customerEmail, customerName, orderNumber, totalAmount } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">✓ Order Confirmed!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Your order is being prepared</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-top: 0;">Dear ${customerName},</p>
        <p style="font-size: 16px;">Great news! Your payment has been verified and your order has been confirmed.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #10b981;">Order Details</h2>
          <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #10b981;">Confirmed</span></p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${totalAmount.toFixed(2)}</p>
        </div>
        
        <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #065f46;"><strong>📦 What's Next?</strong></p>
          <p style="margin: 5px 0 0 0; color: #065f46;">We're now preparing your items for shipment. You'll receive a shipping confirmation email with tracking details once your order is dispatched.</p>
        </div>
        
        <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
          Thank you for choosing ORA Jewellery!
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"ORA Jewellery" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `Order Confirmed - ${orderNumber}`,
      html,
    });
    console.log(`✓ Order confirmed email sent to ${customerEmail}`);
  } catch (error) {
    console.error('Failed to send order confirmed email:', error);
    throw error;
  }
};

/**
 * Send order shipped email with tracking info
 */
export const sendOrderShippedEmail = async (data: OrderEmailData) => {
  const { customerEmail, customerName, orderNumber, trackingNumber, courierName } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Shipped</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🚚 Your Order is On Its Way!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Track your shipment below</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-top: 0;">Dear ${customerName},</p>
        <p style="font-size: 16px;">Your order has been shipped and is on its way to you!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #8b5cf6;">Shipping Details</h2>
          <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #8b5cf6;">Shipped</span></p>
          ${courierName ? `<p style="margin: 5px 0;"><strong>Courier:</strong> ${courierName}</p>` : ''}
          ${trackingNumber ? `<p style="margin: 5px 0;"><strong>Tracking Number:</strong> <span style="font-family: monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${trackingNumber}</span></p>` : ''}
        </div>
        
        <div style="background: #ede9fe; border-left: 4px solid #8b5cf6; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #5b21b6;"><strong>📍 Track Your Package</strong></p>
          <p style="margin: 5px 0 0 0; color: #5b21b6;">Use the tracking number above to track your package on the courier's website.</p>
        </div>
        
        <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
          Expected delivery: 3-7 business days
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"ORA Jewellery" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `Order Shipped - ${orderNumber}`,
      html,
    });
    console.log(`✓ Order shipped email sent to ${customerEmail}`);
  } catch (error) {
    console.error('Failed to send order shipped email:', error);
    throw error;
  }
};

/**
 * Send order delivered email
 */
export const sendOrderDeliveredEmail = async (data: OrderEmailData) => {
  const { customerEmail, customerName, orderNumber } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Delivered</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Order Delivered!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Thank you for your purchase</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-top: 0;">Dear ${customerName},</p>
        <p style="font-size: 16px;">Your order has been successfully delivered!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #10b981;">Order Details</h2>
          <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #10b981;">Delivered</span></p>
        </div>
        
        <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #065f46;"><strong>💝 We Hope You Love It!</strong></p>
          <p style="margin: 5px 0 0 0; color: #065f46;">We'd love to hear about your experience. Share your feedback or review your purchase.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666; font-size: 14px; margin-bottom: 15px;">Need help or have questions?</p>
          <a href="mailto:support@orajewellery.com" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Contact Support</a>
        </div>
        
        <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
          Thank you for choosing ORA Jewellery!
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"ORA Jewellery" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `Order Delivered - ${orderNumber}`,
      html,
    });
    console.log(`✓ Order delivered email sent to ${customerEmail}`);
  } catch (error) {
    console.error('Failed to send order delivered email:', error);
    throw error;
  }
};

export default {
  sendOrderPlacedEmail,
  sendOrderConfirmedEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
};
