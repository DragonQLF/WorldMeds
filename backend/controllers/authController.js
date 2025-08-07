const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Email transport configuration
const transport = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "sandbox.smtp.mailtrap.io",
  port: process.env.EMAIL_PORT || 2525,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// User registration with email verification
exports.register = async (req, res) => {
  try {
    console.log("Register endpoint received body:", req.body);

    const { first_name, last_name, firstName, lastName, email, password } = req.body;
    
    const userFirstName = first_name || firstName;
    const userLastName = last_name || lastName;
    
    if (!userFirstName || !userLastName || !email || !password) {
      console.log("Validation failed: Missing required fields", { userFirstName, userLastName, email, password });
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }
    
    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    const user = await User.create({
      first_name: userFirstName,
      last_name: userLastName,
      email,
      password,
      verification_token: verificationToken,
      email_verified: false
    });
    
    // Send verification email with prettier template
    try {
      await transport.sendMail({
        from: '"WorldMeds" <noreply@worldmeds.com>',
        to: email,
        subject: 'Verify your WorldMeds account',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email - WorldMeds</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">WorldMeds</h1>
                <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Global Medicine Price Transparency</p>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Welcome, ${userFirstName}!</h2>
                <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                  Thank you for joining WorldMeds. To complete your registration and start exploring global medicine prices, please verify your email address.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${verificationToken}" 
                     style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);">
                    Verify Email Address
                  </a>
                </div>
                
                <p style="color: #999; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0;">
                  If you didn't create this account, please ignore this email. This verification link will expire in 24 hours.
                </p>
                
                <p style="color: #999; font-size: 14px; line-height: 1.5; margin: 10px 0 0 0;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <span style="word-break: break-all;">${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${verificationToken}</span>
                </p>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
                <p style="color: #6c757d; font-size: 12px; margin: 0; text-align: center;">
                  © 2024 WorldMeds. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with registration even if email fails
    }
    
    // Don't generate token until email is verified
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account before logging in.',
      user: {
        id: user.id,
        first_name: userFirstName,
        last_name: userLastName,
        firstName: userFirstName,
        lastName: userLastName,
        email: user.email,
        role: user.role || 'user',
        email_verified: false
      },
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration'
    });
  }
};

// User login - now requires email verification
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(200).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(200).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if email is verified
    if (!user.email_verified) {
      return res.status(200).json({
        success: false,
        message: 'Please verify your email address before logging in. Check your inbox for the verification email.',
        requiresVerification: true
      });
    }
    
    const token = generateToken(user.id);
    
    const userData = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role || 'user',
      email_verified: user.email_verified || false
    };
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(200).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
};

// Forgot password with prettier email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Save reset token to user
    await User.setPasswordResetToken(user.id, resetToken, resetTokenExpiry);
    
    // Send reset email with prettier template
    try {
      await transport.sendMail({
        from: '"WorldMeds" <noreply@worldmeds.com>',
        to: email,
        subject: 'Reset your WorldMeds password',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password - WorldMeds</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">WorldMeds</h1>
                <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
                <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                  Hi ${user.first_name},
                </p>
                <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                  We received a request to reset your password for your WorldMeds account. Click the button below to create a new password:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}" 
                     style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);">
                    Reset Password
                  </a>
                </div>
                
                <p style="color: #e74c3c; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0; background-color: #fdf2f2; padding: 15px; border-radius: 4px; border-left: 4px solid #e74c3c;">
                  <strong>Security Notice:</strong> This link will expire in 1 hour for your security.
                </p>
                
                <p style="color: #999; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0;">
                  If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                </p>
                
                <p style="color: #999; font-size: 14px; line-height: 1.5; margin: 10px 0 0 0;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <span style="word-break: break-all;">${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}</span>
                </p>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
                <p style="color: #6c757d; font-size: 12px; margin: 0; text-align: center;">
                  © 2024 WorldMeds. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with response even if email fails
    }
    
    res.status(200).json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }
    
    const user = await User.findByVerificationToken(token);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }
    
    await User.verifyEmail(user.id);
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during email verification'
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    const user = await User.findByPasswordResetToken(token);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    await User.resetPassword(user.id, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during password reset'
    });
  }
};

// Google OAuth login
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Missing Google credential' });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Invalid Google token' });
    }

    const email = payload.email;
    const firstName = payload.given_name || '';
    const lastName = payload.family_name || '';

    // Find or create user
    let user = await User.findByEmail(email);
    if (!user) {
      // Create user with email_verified true (Google already verified)
      user = await User.create({
        first_name: firstName,
        last_name: lastName,
        email,
        password: crypto.randomBytes(32).toString('hex'), // random password, not used
        email_verified: true,
      });
    } else if (!user.email_verified) {
      // If user exists but not verified, mark as verified
      await User.verifyEmail(user.id);
      user = await User.findById(user.id);
    }

    // Generate JWT
    const token = generateToken(user.id);
    const userData = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role || 'user',
      email_verified: true
    };
    res.status(200).json({ success: true, user: userData, token });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, message: 'Google authentication failed' });
  }
};
