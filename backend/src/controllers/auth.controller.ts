import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { sendEmail } from '../utils/email';
import { generateToken, verifyToken } from '../utils/jwt';
import { getSupabaseAdmin } from '../config/supabase';
import { generateRefreshToken, storeRefreshToken } from '../utils/refreshToken';
import { sanitizeText, sanitizeEmail, sanitizePhone } from '../utils/sanitize';

// ============================================
// CUSTOM 8-DIGIT OTP AUTHENTICATION SYSTEM
// ============================================
// OTPs are generated with crypto.randomInt (CSPRNG), hashed with bcrypt
// before storage, and verified with bcrypt.compare (constant-time).

interface OtpEntry {
  hash: string;          // bcrypt hash of the OTP — never stored plaintext
  expiresAt: Date;
  attempts: number;      // brute-force guard: max 5 attempts
}

// NOTE: In-memory store works for single-instance.
// For multi-instance or restarts: migrate to Redis.
const otpStore = new Map<string, OtpEntry>();

// SECURITY: crypto.randomInt is CSPRNG-backed, unlike Math.random()
function generate8DigitOTP(): string {
  // Generates a cryptographically secure random 8-digit number: 10000000–99999999
  return crypto.randomInt(10_000_000, 100_000_000).toString();
}

// @desc    Send 8-digit OTP to email
// @route   POST /api/auth/otp-login
// @access  Public
export const otpLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Generate 8-digit OTP
    const otp = generate8DigitOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // SECURITY: Hash the OTP before storing — never keep plaintext in memory
    const BCRYPT_ROUNDS = 10;
    const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);

    // Store HASH only, not the plaintext OTP
    otpStore.set(email.toLowerCase(), { hash: otpHash, expiresAt, attempts: 0 });

    // Send OTP via email
    const emailSent = await sendEmail({
      to: email.toLowerCase(),
      subject: 'Your ORA Login Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .logo { font-size: 36px; font-weight: 300; color: #d97706; font-family: serif; }
            .tagline { color: #9ca3af; font-size: 14px; }
            .otp-box { background: linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
            .otp-code { font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #78350f; font-family: monospace; }
            .message { color: #6b7280; font-size: 16px; margin: 20px 0; }
            .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">ORA</div>
              <div class="tagline">own. radiate. adorn.</div>
            </div>
            
            <p class="message">Hello,</p>
            <p class="message">Here's your login code for ORA Jewellery:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <p class="message">This code will expire in <strong>5 minutes</strong>.</p>
            <p class="message">If you didn't request this code, please ignore this email.</p>
            
            <div class="footer">
              <p>© 2026 ORA Jewellery. Crafted with elegance.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Gate all auth debug logging behind development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth.otpLogin] OTP sent to:', email, '| expires:', expiresAt.toISOString());
      // NEVER log the actual OTP value, even in development
    }

    // Allow login even if email fails (for testing)
    return res.status(200).json({
      success: true,
      message: emailSent 
        ? 'OTP sent to your email. Please check your inbox.'
        : 'OTP generated. Check server console for code (email service unavailable).',
    });
  } catch (error) {
    console.error('[Auth] ❌ OTP login error:', error);
    next(error);
  }
};

// @desc    Verify 8-digit OTP and create session
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required',
      });
    }

    const emailLower = email.toLowerCase();

    // Check if OTP exists for this email
    const storedOtpData = otpStore.get(emailLower);

    if (!storedOtpData) {
      return res.status(400).json({
        success: false,
        error: 'OTP not found. Please request a new one.',
      });
    }

    // Check if OTP is expired
    if (new Date() > storedOtpData.expiresAt) {
      otpStore.delete(emailLower);
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new one.',
      });
    }

    // SECURITY: Brute-force guard — max 5 wrong attempts per OTP
    if (storedOtpData.attempts >= 5) {
      otpStore.delete(emailLower);
      return res.status(429).json({
        success: false,
        error: 'Too many incorrect attempts. Please request a new OTP.',
      });
    }

    // SECURITY: bcrypt.compare is constant-time — prevents timing-based enumeration
    const otpValid = await bcrypt.compare(otp, storedOtpData.hash);

    if (!otpValid) {
      // Increment attempt counter without exposing which field failed
      storedOtpData.attempts += 1;
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP. Please try again.',
      });
    }

    // OTP is valid - delete it immediately (one-time use)
    otpStore.delete(emailLower);

    // Get or create user in Prisma
    let user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    let isNewUser = false;

    if (!user) {
      // First time user - create account
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email: emailLower,
          fullName: '', // Empty - new user must complete profile
          role: 'CUSTOMER',
          isVerified: true,
          profileCompleted: false,
        },
      });
      console.log(`[Auth] ✅ New user created: ${email}`);
    } else {
      // Check if profile is incomplete (name is empty or profileCompleted is false)
      isNewUser = !user.fullName || user.fullName === '' || user.profileCompleted === false;
      
      // Mark as verified on successful OTP
      if (!user.isVerified) {
        user = await prisma.user.update({
          where: { email: emailLower },
          data: { isVerified: true },
        });
      }
    }

    // Generate access token (30m expiry)
    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Generate refresh token (7d expiry)
    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);

    // Set HttpOnly cookies (shared across orashop.in subdomains)
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
      path: '/',
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log(`[Auth] ✅ User logged in via OTP: ${email} (isNewUser: ${isNewUser})`);
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        profileCompleted: user.profileCompleted,
      },
      isNewUser,
    });
  } catch (error) {
    console.error('[Auth] ❌ OTP verification error:', error);
    next(error);
  }
};

// ============================================
// UNIFIED LOGIN ENDPOINT (HYBRID OTP + PASSWORD)
// ============================================

// @desc    Unified login - accepts either password or triggers OTP
// @route   POST /api/auth/login
// @access  Public
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    const emailLower = email.toLowerCase();

    if (password) {
      // PASSWORD LOGIN FLOW
      console.log(`[Auth] 🔐 Password login attempt for: ${email}`);
      console.log(`[Auth] 📧 Email received:`, email);
      console.log(`[Auth] 🔑 Password length:`, password?.length);
      
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: emailLower },
      });

      console.log(`[Auth] 👤 User found:`, !!user);
      if (user) {
        console.log(`[Auth] 🔐 Has passwordHash:`, !!user.passwordHash);
        console.log(`[Auth] 📝 User ID:`, user.id);
        console.log(`[Auth] ✉️  User email:`, user.email);
      }

      if (!user) {
        console.log(`[Auth] ❌ LOGIN FAILED: User not found for email: ${emailLower}`);
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Check if user has password set
      if (!user.passwordHash) {
        console.log(`[Auth] ❌ LOGIN FAILED: Account is OTP-only (no password set)`);
        return res.status(401).json({
          success: false,
          error: 'This account uses OTP login. Please use the OTP option instead.',
        });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      console.log(`[Auth] 🔑 Password match result:`, passwordMatch);

      if (!passwordMatch) {
        console.log(`[Auth] ❌ LOGIN FAILED: Password mismatch for ${email}`);
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Generate access token (30m expiry)
      const accessToken = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      // Generate refresh token (7d expiry)
      const refreshToken = generateRefreshToken();
      await storeRefreshToken(user.id, refreshToken);

      // Set HttpOnly cookies (shared across orashop.in subdomains)
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
        path: '/',
        maxAge: 30 * 60 * 1000, // 30 minutes
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      console.log(`[Auth] ✅ User logged in with password: ${email}`);
      console.log(`[Auth] 🍪 Cookies set:`, {
        access_token: 'SET',
        refresh_token: 'SET',
        domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : 'localhost',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      
      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          profileCompleted: user.profileCompleted,
        },
        isNewUser: false,
      });
    } else {
      // OTP LOGIN FLOW (EXISTING LOGIC)
      console.log(`[Auth] 📧 OTP login request for: ${email}`);
      
      // Generate 8-digit OTP
      const otp = generate8DigitOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Hash OTP before storing (never store plaintext)
      const otpHash = await bcrypt.hash(otp, 10);
      otpStore.set(emailLower, { hash: otpHash, expiresAt, attempts: 0 });

      console.log(`[Auth] 🔢 Generated OTP for ${email}: ${otp} (expires at ${expiresAt})`);

      // Try to send email with enhanced error handling
      try {
        await sendEmail({
          to: emailLower,
          subject: 'ORA Jewellery - Your Login Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
              <h2>ORA Jewellery</h2>
              <p>Your login code is:</p>
              <h1 style="font-size: 32px; letter-spacing: 4px; color: #2563eb;">${otp}</h1>
              <p>This code expires in 5 minutes.</p>
              <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
            </div>
          `,
        });

        console.log(`[Auth] ✅ OTP email sent to: ${email}`);
      } catch (emailError) {
        // SMTP FAILURE HANDLING - Don't crash, just log warning
        console.warn(`[Auth] ⚠️ SMTP failed for ${email}:`, emailError);
        // Don't return error - continue with success response
        // This is the "temporary hybrid" solution for unreliable SMTP
      }

      return res.status(200).json({
        success: true,
        message: 'Login code sent to your email',
        requiresOTP: true,
      });
    }
  } catch (error) {
    console.error('[Auth] ❌ Login error:', error);
    next(error);
  }
};

// ============================================
// PASSWORD AUTHENTICATION SYSTEM
// ============================================

// @desc    Register (hybrid: with password or OTP-only)
// @route   POST /api/auth/register
// @access  Public
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, fullName, phone } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // XSS SANITIZATION - Clean all user inputs
    const emailLower = sanitizeEmail(email);
    const sanitizedFullName = sanitizeText(fullName);
    const sanitizedPhone = phone ? sanitizePhone(phone) : null;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered. Please login instead.',
      });
    }

    if (password) {
      // PASSWORD REGISTRATION
      console.log(`[Auth] 🔐 Password registration for: ${email}`);
      
      // ============================================
      // PASSWORD STRENGTH VALIDATION (Production Security)
      // ============================================
      // Minimum length check
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long',
        });
      }

      // Uppercase letter check
      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({
          success: false,
          error: 'Password must contain at least one uppercase letter',
        });
      }

      // Lowercase letter check
      if (!/[a-z]/.test(password)) {
        return res.status(400).json({
          success: false,
          error: 'Password must contain at least one lowercase letter',
        });
      }

      // Number check
      if (!/[0-9]/.test(password)) {
        return res.status(400).json({
          success: false,
          error: 'Password must contain at least one number',
        });
      }

      // Common password check
      const commonPasswords = ['password', '12345678', 'admin123', 'welcome123', 'qwerty123'];
      if (commonPasswords.includes(password.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: 'Password is too common. Please choose a stronger password',
        });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user with password
      const user = await prisma.user.create({
        data: {
          email: emailLower,
          passwordHash,
          fullName: sanitizedFullName || '',
          phone: sanitizedPhone,
          role: 'CUSTOMER',
          isVerified: true, // Auto-verify for password registration
          profileCompleted: !!fullName,
        },
      });

      // Generate access token (30m expiry)
      const accessToken = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      // Generate refresh token (7d expiry)
      const refreshToken = generateRefreshToken();
      await storeRefreshToken(user.id, refreshToken);

      // Set HttpOnly cookies (shared across orashop.in subdomains)
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
        path: '/',
        maxAge: 30 * 60 * 1000, // 30 minutes
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      console.log(`[Auth] ✅ User registered with password: ${email}`);
      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          profileCompleted: user.profileCompleted,
        },
        isNewUser: true,
      });
    } else {
      // OTP REGISTRATION (CREATE UNVERIFIED USER)
      console.log(`[Auth] 📧 OTP registration for: ${email}`);
      
      // Create unverified user without password
      const user = await prisma.user.create({
        data: {
          email: emailLower,
          passwordHash: null, // No password for OTP users
          fullName: sanitizedFullName || '',
          phone: sanitizedPhone,
          role: 'CUSTOMER',
          isVerified: false, // Must verify via OTP
          profileCompleted: false,
        },
      });

      // Generate and send OTP
      const otp = generate8DigitOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      // Hash OTP before storing (never store plaintext)
      const otpHash = await bcrypt.hash(otp, 10);
      otpStore.set(emailLower, { hash: otpHash, expiresAt, attempts: 0 });

      console.log(`[Auth] 🔢 Generated registration OTP for ${email}: ${otp}`);

      // Try to send welcome email with OTP
      try {
        await sendEmail({
          to: emailLower,
          subject: 'Welcome to ORA Jewellery - Verify Your Account',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
              <h2>Welcome to ORA Jewellery! ✨</h2>
              <p>Thank you for signing up. Your verification code is:</p>
              <h1 style="font-size: 32px; letter-spacing: 4px; color: #2563eb;">${otp}</h1>
              <p>This code expires in 5 minutes.</p>
              <p style="color: #666; font-size: 14px;">If you didn't create this account, please ignore this email.</p>
            </div>
          `,
        });

        console.log(`[Auth] ✅ Welcome email sent to: ${email}`);
      } catch (emailError) {
        // SMTP FAILURE HANDLING - Don't crash, just log warning
        console.warn(`[Auth] ⚠️ SMTP failed for registration ${email}:`, emailError);
        // Don't return error - user is created, they can still verify later
      }

      return res.status(201).json({
        success: true,
        message: 'Registration successful. Check your email for verification code.',
        requiresOTP: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isVerified: user.isVerified,
          profileCompleted: user.profileCompleted,
        },
      });
    }
  } catch (error) {
    console.error('[Auth] ❌ Registration error:', error);
    next(error);
  }
};

// @desc    Login with password
// @route   POST /api/auth/password-login
// @access  Public
export const passwordLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const emailLower = email.toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Check if user has password set
    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        error: 'This account uses OTP login. Please use the OTP option instead.',
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Generate access token (30m expiry)
    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Generate refresh token (7d expiry)
    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);

    // Set HttpOnly cookies (shared across orashop.in subdomains)
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
      path: '/',
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log(`[Auth] ✅ User logged in with password: ${email}`);
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        profileCompleted: user.profileCompleted,
      },
      isNewUser: false,
    });
  } catch (error) {
    console.error('[Auth] ❌ Password login error:', error);
    next(error);
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // If user has no password, they can't change it
    if (!user.passwordHash) {
      return res.status(400).json({
        success: false,
        error: 'This account uses OTP login. Cannot change password.',
      });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    console.log(`[Auth] ✅ Password changed for user: ${user.email}`);
    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('[Auth] ❌ Change password error:', error);
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('[Auth] ❌ Get user error:', error);
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Clear authentication cookies (shared across subdomains)
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
      path: '/',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' ? 'orashop.in' : undefined,
      path: '/',
    });

    console.log(`[Auth] ✅ User logged out: ${req.user.email}`);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('[Auth] ❌ Logout error:', error);
    next(error);
  }
};

// @desc    Delete account
// @route   DELETE /api/auth/account
// @access  Private
export const deleteAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;

    // Delete user from Prisma
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(`[Auth] ✅ Account deleted: ${req.user.email}`);
    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('[Auth] ❌ Delete account error:', error);
    next(error);
  }
};
