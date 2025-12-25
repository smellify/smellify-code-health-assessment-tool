// services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

class AuthService {
  constructor() {
    // Track ongoing operations to prevent double emails
    this.pendingOperations = new Map();
  }

  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  generateToken(userId) {
    return jwt.sign(
      { user_id: userId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  isOperationPending(email) {
    return this.pendingOperations.has(email);
  }

  markOperationPending(email) {
    this.pendingOperations.set(email, Date.now());
    
    // Auto-cleanup after 5 seconds
    setTimeout(() => {
      this.pendingOperations.delete(email);
    }, 5000);
  }

  clearPendingOperation(email) {
    this.pendingOperations.delete(email);
  }

  async createUser(email, password) {
    const verificationCode = this.generateVerificationCode();
    const hashedPassword = await bcrypt.hash(password, 10);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    return await User.create({
      email,
      password: hashedPassword,
      verificationCode,
      verificationExpires: expiry,
      isVerified: false
    });
  }

  async sendVerificationEmail(email, verificationCode) {
    try {
      await sendEmail(email, verificationCode);
      return { success: true };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return { success: false, error };
    }
  }

  async verifyUser(email, code) {
    const user = await User.findOne({ email });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.isVerified) {
      return { success: false, message: 'Email already verified' };
    }

    if (user.verificationCode !== code) {
      return { success: false, message: 'Invalid verification code' };
    }

    if (user.verificationExpires < new Date()) {
      return { success: false, message: 'Verification code expired. Please request a new one.' };
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;
    await user.save();

    return { success: true, message: 'Email verified successfully' };
  }

  async resendVerificationCode(email) {
    const user = await User.findOne({ email });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.isVerified) {
      return { success: false, message: 'Email already verified' };
    }

    const verificationCode = this.generateVerificationCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationExpires = expiry;
    await user.save();

    const emailResult = await this.sendVerificationEmail(email, verificationCode);
    
    if (!emailResult.success) {
      return { success: false, message: 'Failed to send verification email. Please try again.' };
    }

    return { success: true, message: 'Verification code sent to your email' };
  }

  async authenticateUser(email, password) {
    const user = await User.findOne({ email });

    if (!user) {
      return { success: false, message: 'Invalid email or password' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid email or password' };
    }

    // Check if email is verified
    if (!user.isVerified) {
      const needsNewCode = !user.verificationCode || 
                          !user.verificationExpires || 
                          user.verificationExpires < new Date();

      if (needsNewCode) {
        const verificationCode = this.generateVerificationCode();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        user.verificationCode = verificationCode;
        user.verificationExpires = expiry;
        await user.save();

        await this.sendVerificationEmail(email, verificationCode);
      }

      return { 
        success: false, 
        message: 'Email not verified. Please check your email for the verification code.',
        needsVerification: true 
      };
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = this.generateToken(user._id);

    return {
      success: true,
      token,
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name,
        role: user.role,
        isOnboardingComplete: user.isOnboardingComplete || false
      }
    };
  }
}

module.exports = new AuthService();