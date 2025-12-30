const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail, sendPasswordResetEmail, sendPasswordChangeConfirmationEmail,sendLoginSuccessEmail, 
    sendSuspiciousLoginAlert  } = require('../utils/sendEmail');
const sendWelcomeEmail = require('../utils/sendWelcomeEmail');
const auth = require('../middleware/auth');
const router = express.Router();
const UAParser = require('ua-parser-js');
const Session = require('../models/Session');
const crypto = require('crypto'); 
const TwoFA = require('../models/TwoFA');
const speakeasy = require("speakeasy");
const DeletedAccount = require('../models/DeletedAccounts');
const ReferralService = require('../services/referralService');
// Track ongoing signup/resend operations to prevent double emails
const pendingOperations = new Map();

// Helper function to get client IP
const getClientIp = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
};




router.post('/signup', async (req, res) => {
  const { email, password, referralCode } = req.body;

  try {
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if there's already a pending operation for this email
    if (pendingOperations.has(normalizedEmail)) {
      return res.status(429).json({ 
        message: 'Please wait before requesting another verification code' 
      });
    }

    // Check if email is in deleted accounts
    const deletedAccount = await DeletedAccount.findOne({ email: normalizedEmail });
    if (deletedAccount) {
      return res.status(403).json({ 
        message: 'This email address is associated with an account that was deleted. Please contact support if you believe this is an error.' 
      });
    }

    // Check if user already exists (verified or unverified)
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'An account with this email already exists. Please sign in instead.' 
      });
    }

    // Validate referral code if provided
    let validatedReferral = null;
    if (referralCode) {
      try {
        validatedReferral = await ReferralService.validateReferralCode(referralCode);
        console.log(`Valid referral code ${referralCode} from ${validatedReferral.owner.name}`);
      } catch (error) {
        console.error('Referral validation error:', error);
        return res.status(400).json({ message: `Invalid referral code: ${error.message}` });
      }
    }

    // Mark operation as pending
    pendingOperations.set(normalizedEmail, Date.now());

    // Generate verification code and hash password
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Get client IP
    const clientIp = getClientIp(req);

    // Create new user
    const newUser = new User({
      email: normalizedEmail,
      password: hashedPassword,
      verificationCode,
      verificationExpires,
      createdIp: clientIp,
      isVerified: false,
      isOnboardingComplete: false,
      remainingScans: 0 // Will be set after verification/onboarding
    });

    await newUser.save();
    console.log('User created successfully:', newUser.email);

    // Apply referral code if provided and validated
    let referralApplied = false;
    if (referralCode && validatedReferral) {
      try {
        await ReferralService.applyReferralCode(referralCode, newUser._id, true);
        referralApplied = true;
        console.log(`Referral code ${referralCode} applied to new user ${newUser.email}`);
      } catch (referralError) {
        console.error('Error applying referral code:', referralError);
        // Don't fail signup if referral application fails
        // The user can still complete signup and manually apply referral later
      }
    }

    // Send verification email
    try {
      await sendEmail(newUser.email, verificationCode);
      console.log('Verification email sent to:', newUser.email);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      
      // Remove the user since email failed
      await User.deleteOne({ email: normalizedEmail, isVerified: false });
      pendingOperations.delete(normalizedEmail);
      
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again.' 
      });
    }

    // Remove from pending operations after a delay
    setTimeout(() => {
      pendingOperations.delete(normalizedEmail);
    }, 5000); // 5 second cooldown

    // Success response (don't include sensitive data)
    res.status(201).json({
      success: true,
      message: 'Verification code sent to your email. Please check your email and verify your account.',
      user: {
        id: newUser._id,
        email: newUser.email,
        isVerified: newUser.isVerified
      },
      referralApplied
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Clean up pending operation on error
    if (email) {
      pendingOperations.delete(email.toLowerCase());
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid user data provided' });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }
    
    res.status(500).json({ message: 'Server error during user creation. Please try again.' });
  }
});



router.post('/verify-email', async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Email already verified' });

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.verificationExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code expired. Please request a new one.' });
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;

    await user.save();

    // Send welcome email after successful verification
    try {
      await sendWelcomeEmail(user.email, user.name);
      console.log('Welcome email sent to:', user.email);
    } catch (welcomeEmailErr) {
      // Log error but don't fail the verification process
      console.error('Failed to send welcome email:', welcomeEmailErr);
      // You might want to queue this for retry later or handle it differently
    }

    res.status(200).json({ message: 'Email verified successfully' });

  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if there's already a pending operation for this email
    if (pendingOperations.has(email)) {
      return res.status(429).json({ 
        message: 'Please wait before requesting another verification code' 
      });
    }

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Email already verified' });

    // Mark operation as pending
    pendingOperations.set(email, Date.now());

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationExpires = expiry;

    await user.save();

    try {
      await sendEmail(email, verificationCode);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
      pendingOperations.delete(email);
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again.' 
      });
    }

    // Remove from pending operations after a delay
    setTimeout(() => {
      pendingOperations.delete(email);
    }, 5000); // 5 second cooldown

    res.status(200).json({ message: 'Verification code sent to your email' });

  } catch (err) {
    console.error('Resend verification error:', err);
    pendingOperations.delete(email);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});


router.post('/login', async (req, res) => {
    try {
        const { email, password, twoFactorCode } = req.body;
       
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
       
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
       
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
if (!user.isActive) {
    return res.status(403).json({ 
        message: 'Your account has been suspended. Please contact support for assistance.',
        isBanned: true 
    });
}
        // Check if user's email is verified
        if (!user.isVerified) {
            return res.status(400).json({ 
                message: 'Email not verified. Please verify your email to continue.',
                needsVerification: true 
            });
        }
       
        // Check if user has 2FA enabled
        const twoFA = await TwoFA.findOne({ userId: user._id });
        const has2FA = twoFA && twoFA.twoFactorEnabled;

        // Parse user agent for device info (for email notifications)
        const parser = new UAParser(req.headers['user-agent'] || '');
        const deviceInfo = {
            browser: parser.getBrowser().name || 'Unknown',
            os: parser.getOS().name || 'Unknown',
            device: parser.getDevice().model || 'Desktop',
            isMobile: parser.getDevice().type === 'mobile'
        };
       
        // Get client IP address
        const ipAddress = req.ip ||
                         req.connection.remoteAddress ||
                         req.socket.remoteAddress ||
                         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                         req.headers['x-forwarded-for']?.split(',')[0] ||
                         'Unknown';

        // If 2FA is enabled but no code provided, request 2FA code
        if (has2FA && !twoFactorCode) {
            // NEW: Send suspicious login alert email
            try {
                await sendSuspiciousLoginAlert(
                    user.email,
                    user.name,
                    deviceInfo,
                    ipAddress
                );
                console.log('Suspicious login alert sent for incomplete 2FA login');
            } catch (emailError) {
                console.error('Failed to send suspicious login alert:', emailError);
                // Don't fail the login process if email fails
            }

            return res.status(200).json({
                message: 'Two-factor authentication required',
                requires2FA: true,
                // Don't send any tokens or user data yet
            });
        }

        // If 2FA is enabled and code is provided, verify it
        if (has2FA && twoFactorCode) {
            let isValidCode = false;
            let usedBackupCode = null;

            // First check if it's a backup code
            for (let backupCode of twoFA.twoFactorBackupCodes) {
                if (!backupCode.used && backupCode.code === twoFactorCode.toUpperCase()) {
                    backupCode.used = true;
                    backupCode.usedAt = new Date();
                    await twoFA.save();
                    isValidCode = true;
                    usedBackupCode = backupCode.code;
                    break;
                }
            }

            // If not a backup code, verify TOTP
            if (!isValidCode) {
                isValidCode = speakeasy.totp.verify({
                    secret: twoFA.twoFactorSecret,
                    encoding: 'base32',
                    token: twoFactorCode,
                    window: 2 // Allow 2 time steps before/after current time
                });
            }

            if (!isValidCode) {
                return res.status(400).json({ 
                    message: 'Invalid two-factor authentication code. Please try again.',
                    requires2FA: true 
                });
            }

            // If backup code was used, include it in response
            if (usedBackupCode) {
                console.log(`Backup code ${usedBackupCode} used by user ${user.email}`);
            }
        }
       
        // At this point, either 2FA is disabled or 2FA verification passed
        // Generate unique session ID
        const sessionId = crypto.randomBytes(32).toString('hex');
       
        // Create session record
        await Session.create({
            userId: user._id,
            sessionId,
            userAgent: req.headers['user-agent'] || 'Unknown',
            ipAddress: ipAddress,
            deviceInfo
        });

        // Update last login
        user.lastLogin = new Date();
        user.lastLoginIp = ipAddress;
        await user.save();
       
        // Create JWT with session ID
        const tokenPayload = {
            userId: user._id,
            user_id: user._id, // Keep for backward compatibility
            sessionId,
            email: user.email
        };
       
        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // NEW: Send successful login notification email
        try {
            await sendLoginSuccessEmail(
                user.email,
                user.name,
                deviceInfo,
                ipAddress
            );
            console.log('Login success email sent');
        } catch (emailError) {
            console.error('Failed to send login success email:', emailError);
            // Don't fail the login process if email fails
        }
       
        // Return success response
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                company: user.company,
                role: user.role,
                isOnboardingComplete: user.isOnboardingComplete
            },
            message: 'Login successful',
            has2FA: has2FA
        });
       
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed. Please try again.' });
    }
});

// Updated verify 2FA route with login success notification
router.post('/verify-2fa', async (req, res) => {
    try {
        const { email, password, twoFactorCode } = req.body;

        if (!email || !password || !twoFactorCode) {
            return res.status(400).json({ 
                message: 'Email, password, and two-factor code are required' 
            });
        }

        // Find user and verify password again (for security)
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user has 2FA enabled
        const twoFA = await TwoFA.findOne({ userId: user._id });
        if (!twoFA || !twoFA.twoFactorEnabled) {
            return res.status(400).json({ message: '2FA is not enabled for this account' });
        }

        let isValidCode = false;
        let usedBackupCode = null;

        // Check backup codes first
        for (let backupCode of twoFA.twoFactorBackupCodes) {
            if (!backupCode.used && backupCode.code === twoFactorCode.toUpperCase()) {
                backupCode.used = true;
                backupCode.usedAt = new Date();
                await twoFA.save();
                isValidCode = true;
                usedBackupCode = backupCode.code;
                break;
            }
        }

        // If not a backup code, verify TOTP
        if (!isValidCode) {
            isValidCode = speakeasy.totp.verify({
                secret: twoFA.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorCode,
                window: 2
            });
        }

        if (!isValidCode) {
            return res.status(400).json({ 
                message: 'Invalid two-factor authentication code. Please try again.' 
            });
        }

        // Continue with login process (same as above)
        const sessionId = crypto.randomBytes(32).toString('hex');
        
        const parser = new UAParser(req.headers['user-agent'] || '');
        const deviceInfo = {
            browser: parser.getBrowser().name || 'Unknown',
            os: parser.getOS().name || 'Unknown',
            device: parser.getDevice().model || 'Desktop',
            isMobile: parser.getDevice().type === 'mobile'
        };
        
        const ipAddress = req.ip || 'Unknown';
        
        await Session.create({
            userId: user._id,
            sessionId,
            userAgent: req.headers['user-agent'] || 'Unknown',
            ipAddress: ipAddress,
            deviceInfo
        });

        user.lastLogin = new Date();
        user.lastLoginIp = ipAddress;
        await user.save();
        
        const tokenPayload = {
            userId: user._id,
            user_id: user._id,
            sessionId,
            email: user.email
        };
        
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        // NEW: Send successful login notification email
        try {
            await sendLoginSuccessEmail(
                user.email,
                user.name,
                deviceInfo,
                ipAddress
            );
            console.log('Login success email sent after 2FA verification');
        } catch (emailError) {
            console.error('Failed to send login success email:', emailError);
            // Don't fail the login process if email fails
        }
        
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                company: user.company,
                role: user.role,
                isOnboardingComplete: user.isOnboardingComplete
            },
            message: 'Login successful',
            usedBackupCode: usedBackupCode
        });

    } catch (error) {
        console.error('2FA verification error:', error);
        res.status(500).json({ message: 'Verification failed. Please try again.' });
    }
});

// Logout endpoint (terminate current session)
router.post('/logout', require('../middleware/auth'), async (req, res) => {
    try {
        if (req.user.sessionId) {
            // Delete current session
            await Session.deleteOne({
                userId: req.user.userId,
                sessionId: req.user.sessionId
            });
        }
        
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Logout failed' });
    }
});

// Route to request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.trim()) {
      return res.status(400).json({ 
        message: 'Email address is required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        message: 'Please enter a valid email address' 
      });
    }

    // Check if there's already a pending operation for this email
    if (pendingOperations.has(email.toLowerCase().trim())) {
      return res.status(429).json({ 
        message: 'Please wait before requesting another reset code' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ 
        message: 'If an account with this email exists, a reset code has been sent' 
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({ 
        message: 'Please verify your email address first before resetting password' 
      });
    }

    // Mark operation as pending
    pendingOperations.set(email.toLowerCase().trim(), Date.now());

    // Generate reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store reset code temporarily in user record
    user.passwordResetCode = resetCode;
    user.passwordResetExpires = expiry;
    await user.save();

    // Send reset code email
    try {
      await sendPasswordResetEmail(user.email, resetCode);
    } catch (emailErr) {
      console.error('Failed to send password reset email:', emailErr);
      // Remove reset code if email failed
      user.passwordResetCode = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      pendingOperations.delete(email.toLowerCase().trim());
      return res.status(500).json({ 
        message: 'Failed to send reset email. Please try again later.' 
      });
    }

    // Remove from pending operations after a delay
    setTimeout(() => {
      pendingOperations.delete(email.toLowerCase().trim());
    }, 5000); // 5 second cooldown

    res.json({ 
      message: 'If an account with this email exists, a reset code has been sent' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    pendingOperations.delete(email?.toLowerCase()?.trim());
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Route to verify reset code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !email.trim()) {
      return res.status(400).json({ 
        message: 'Email address is required' 
      });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({ 
        message: 'Reset code is required' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if there's a reset code
    if (!user.passwordResetCode) {
      return res.status(400).json({ 
        message: 'No password reset request found. Please request a new reset code.' 
      });
    }

    // Verify the code
    if (user.passwordResetCode !== code.trim()) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    // Check if code has expired
    if (user.passwordResetExpires < new Date()) {
      // Clear expired reset code
      user.passwordResetCode = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      return res.status(400).json({ 
        message: 'Reset code has expired. Please request a new one.' 
      });
    }

    res.json({ 
      message: 'Reset code verified successfully. You can now set a new password.' 
    });

  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Route to reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;
    
    // Validation
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'Reset code is required' });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Both password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Password strength validation
    const errors = [];
    if (newPassword.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(newPassword)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(newPassword)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(newPassword)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(newPassword)) {
      errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        message: 'Password does not meet requirements',
        errors 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if there's a reset code
    if (!user.passwordResetCode) {
      return res.status(400).json({ 
        message: 'No password reset request found. Please request a new reset code.' 
      });
    }

    // Verify the code
    if (user.passwordResetCode !== code.trim()) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    // Check if code has expired
    if (user.passwordResetExpires < new Date()) {
      user.passwordResetCode = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      return res.status(400).json({ 
        message: 'Reset code has expired. Please request a new one.' 
      });
    }

    // // Check if new password is same as current password
    // const isSamePassword = await bcrypt.compare(newPassword, user.password);
    // if (isSamePassword) {
    //   return res.status(400).json({ 
    //     message: 'New password cannot be the same as your current password' 
    //   });
    // }
    if (user.password) {
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    return res.status(400).json({
      message: 'New password cannot be the same as your current password'
    });
  }
} else {
  // User signed up via GitHub (no password yet)
  // You might just allow them to set a new one without comparing
  console.log("User has no existing password, setting new one directly.");
}
    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    const clientIp = getClientIp(req);

    // Update password and clear reset code
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    user.lastLogin = new Date();
    user.lastLoginIp = clientIp;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // Invalidate all sessions for security
    if (Session) {
      await Session.deleteMany({ userId: user._id });
    }

    // Send password change confirmation email
    try {
      await sendPasswordChangeConfirmationEmail(user.email, user.name || 'User');
    } catch (emailErr) {
      console.error('Failed to send password change confirmation email:', emailErr);
      // Continue even if email fails
    }

    res.json({ 
      message: 'Password reset successfully. Please log in with your new password.',
      sessionsTerminated: true
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password. Please try again.' });
  }
});

// Route to resend reset code
router.post('/resend-reset-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.trim()) {
      return res.status(400).json({ 
        message: 'Email address is required' 
      });
    }

    // Check if there's already a pending operation for this email
    if (pendingOperations.has(email.toLowerCase().trim())) {
      return res.status(429).json({ 
        message: 'Please wait before requesting another reset code' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ 
        message: 'If an account with this email exists, a reset code has been sent' 
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({ 
        message: 'Please verify your email address first before resetting password' 
      });
    }

    // Mark operation as pending
    pendingOperations.set(email.toLowerCase().trim(), Date.now());

    // Generate new reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update reset code
    user.passwordResetCode = resetCode;
    user.passwordResetExpires = expiry;
    await user.save();

    // Send reset code email
    try {
      await sendPasswordResetEmail(user.email, resetCode);
    } catch (emailErr) {
      console.error('Failed to send password reset email:', emailErr);
      user.passwordResetCode = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      pendingOperations.delete(email.toLowerCase().trim());
      return res.status(500).json({ 
        message: 'Failed to send reset email. Please try again later.' 
      });
    }

    // Remove from pending operations after a delay
    setTimeout(() => {
      pendingOperations.delete(email.toLowerCase().trim());
    }, 5000); // 5 second cooldown

    res.json({ 
      message: 'If an account with this email exists, a reset code has been sent' 
    });

  } catch (error) {
    console.error('Resend reset code error:', error);
    pendingOperations.delete(email?.toLowerCase()?.trim());
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;