# 📧 SUPABASE EMAIL TEMPLATE - MAGIC LINK

## Supabase Template (HTML)

Copy this template into **Authentication → Email Templates → Confirm Email** in your Supabase Dashboard:

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; line-height: 1.5; color: #333;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #FFF5F7 0%, #FFEBF0 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="font-family: Georgia, serif; font-size: 32px; font-weight: bold; color: #d4af37; margin: 0; letter-spacing: 2px;">ORA</h1>
    <p style="color: #78716b; margin: 8px 0 0 0; font-size: 14px;">Jewellery that tells your story</p>
  </div>

  <!-- Main Content -->
  <div style="background: white; padding: 40px 20px; text-align: center;">
    <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1A1A1A; margin: 0 0 12px 0;">Welcome Back to ORA</h2>
    
    <p style="color: #78716b; margin: 0 0 8px 0;">Hi there!</p>
    <p style="color: #78716b; margin: 0 0 24px 0;">Click the button below to securely log in to your ORA Jewellery account.</p>

    <!-- CTA Button -->
    <div style="margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" style="
        display: inline-block;
        background: linear-gradient(135deg, #d4af37 0%, #c9a227 100%);
        color: white;
        text-decoration: none;
        padding: 14px 40px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
        transition: all 0.3s ease;
      ">
        ✓ Log In Securely
      </a>
    </div>

    <!-- Alternative Link -->
    <p style="color: #78716b; font-size: 13px; margin: 24px 0 8px 0;">Or copy and paste this link in your browser:</p>
    <p style="word-break: break-all; background: #f5f5f5; padding: 12px; border-radius: 6px; font-size: 12px; color: #666; font-family: 'Courier New', monospace; margin: 8px 0;">{{ .ConfirmationURL }}</p>
  </div>

  <!-- Security Info -->
  <div style="background: #FFF5F7; padding: 20px; text-align: center; border-top: 1px solid #FFE8ED;">
    <p style="color: #78716b; font-size: 12px; margin: 0; line-height: 1.6;">
      🔒 <strong>Link expires in 24 hours</strong><br>
      This link is unique and only works once for security purposes.
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #f9f9f9; padding: 24px 20px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #efefef;">
    <p style="color: #999; font-size: 12px; margin: 0 0 8px 0;">
      Didn't request this? No action needed. Your account is secure.
    </p>
    
    <p style="color: #999; font-size: 11px; margin: 12px 0 0 0;">
      © 2024-2026 ORA Jewellery. All rights reserved.<br>
      <a href="https://orashop.in" style="color: #d4af37; text-decoration: none;">Visit our store</a> | 
      <a href="https://orashop.in/privacy" style="color: #d4af37; text-decoration: none;">Privacy Policy</a>
    </p>
  </div>

</div>
```

---

## Plain Text Version (Optional)

If you want a plain text fallback:

```
ORA - Jewellery that tells your story

WELCOME BACK TO ORA

Click the link below to log in to your ORA Jewellery account:

{{ .ConfirmationURL }}

This link expires in 24 hours.

---

SECURITY NOTE:
This link is unique and only works once. If you didn't request this, no action is needed.

© 2024-2026 ORA Jewellery
https://orashop.in
```

---

## How to Add This Template

### In Supabase Dashboard:

1. Go to **Authentication** (left sidebar)
2. Click **Email Templates** (under Auth settings)
3. Find **Confirm Email** row
4. Click the **Edit** button (pencil icon)
5. Update the HTML content with the template above
6. Save changes

### Important Variables:

- `{{ .ConfirmationURL }}` = The actual magic link (Supabase fills this automatically)
- Do NOT change or remove this variable
- This will contain the `/auth/callback` URL with authentication code

### Testing the Template:

1. Save the template
2. Send a test link from `/auth/login`
3. Check email to see how it looks
4. Click the link to verify it works

---

## Email Preview

How the email will look:

```
┌─────────────────────────────────────────┐
│                                         │
│  [Pink gradient background]             │
│              ORA                        │ (Gold text)
│  Jewellery that tells your story       │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│      Welcome Back to ORA                │
│                                         │
│  Hi there!                              │
│  Click the button below to securely     │
│  log in to your ORA account.            │
│                                         │
│         ✓ Log In Securely               │ (Gold button)
│                                         │
│  Or copy and paste this link:           │
│  [long URL...]                          │
│                                         │
├─────────────────────────────────────────┤
│  🔒 Link expires in 24 hours            │
├─────────────────────────────────────────┤
│  Didn't request this? No action needed. │
│  Your account is secure.                │
│                                         │
│  © 2024-2026 ORA Jewellery              │
│  Visit our store | Privacy Policy       │
└─────────────────────────────────────────┘
```

---

## Customization Options

### Change Subject Line

In Supabase Email Templates, the subject field should be:

```
Your ORA Jewellery Secure Login Link
```

Or customize as:
```
Log In to Your ORA Account
```

### Change Colors

- Gold/Accent: `#d4af37` (ORA brand color)
- Blush pink: `#FFF5F7`, `#FFEBF0` (ORA backgrounds)
- Text primary: `#1A1A1A` (Dark charcoal)
- Text muted: `#78716b` (Neutral gray)

---

## Testing

### Step 1: Add Template to Supabase
1. Copy HTML from above
2. Paste into Supabase Email Template editor
3. Save

### Step 2: Test Sending
1. Go to `/auth/login` on your app
2. Enter test email
3. Click "Send Login Link"
4. Check email (may take 30-60 seconds)

### Step 3: Verify Formatting
1. Open email and verify styling
2. Check link is clickable
3. Click link to verify login works

---

## Troubleshooting

### Email looks plain/broken

**Cause:** HTML not properly saved  
**Fix:** 
1. Click "Edit" on Confirm Email
2. Delete old content completely
3. Paste new HTML
4. Make sure `{{ .ConfirmationURL }}` is present
5. Save

### Link not clickable

**Cause:** `{{ .ConfirmationURL }}` variable not rendering  
**Fix:**
1. Verify variable is exactly: `{{ .ConfirmationURL }}`
2. Make sure it's inside the `href` attribute
3. Save and test again

### Styling looks different

**Cause:** Email client rendering differences  
**Fix:**
1. This is normal - email rendering varies by client
2. Gmail, Apple Mail, Outlook render differently
3. Core content (link) should work on all
4. Test on your main email client

---

## Next Steps

- [x] Add this email template to Supabase
- [ ] Configure URL settings (Site URL & Redirect URLs)
- [ ] Test magic link flow
- [ ] Deploy to production
- [ ] Monitor email delivery rates

---

**Maintained by:** ORA Jewellery Team  
**Last Updated:** February 2, 2026  
**Version:** 1.0 (Magic Link Template)
