// routes/twoFA.js
const express = require('express');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const User = require('../models/User'); // Add this import
const TwoFA = require('../models/twoFA');
const auth = require('../middleware/auth');
const { send2FAEnabledEmail, send2FADisabledEmail } = require('../utils/sendEmail');

const router = express.Router();

// Generate 2FA secret and QR code
router.post('/setup', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if 2FA is already enabled
    let twoFA = await TwoFA.findOne({ userId: req.user.user_id });
    
    if (twoFA && twoFA.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled for your account' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${user.email}`,
      issuer: process.env.APP_NAME || 'YourApp',
      length: 32
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Create or update TwoFA record with temporary secret (don't enable 2FA yet)
    if (!twoFA) {
      twoFA = new TwoFA({ userId: req.user.user_id });
    }
    
    twoFA.twoFactorSecret = secret.base32;
    await twoFA.save();

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32,
      issuer: process.env.APP_NAME || 'YourApp',
      accountName: user.email
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ message: 'Failed to setup 2FA. Please try again.' });
  }
});

// Verify and enable 2FA
router.post('/enable', auth, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token || token.length !== 6) {
      return res.status(400).json({ message: 'Please enter a valid 6-digit code' });
    }

    const user = await User.findById(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const twoFA = await TwoFA.findOne({ userId: req.user.user_id });

    if (!twoFA || !twoFA.twoFactorSecret) {
      return res.status(400).json({ message: 'No 2FA setup found. Please start the setup process again.' });
    }

    if (twoFA.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled for your account' });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: twoFA.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after current time
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid authentication code. Please try again.' });
    }

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push({
        code: crypto.randomBytes(3).toString('hex').toUpperCase(),
        used: false
      });
    }

    // Enable 2FA
    twoFA.twoFactorEnabled = true;
    twoFA.twoFactorEnabledAt = new Date();
    twoFA.twoFactorBackupCodes = backupCodes;
    
    await twoFA.save();

    // Send confirmation email
    try {
      await send2FAEnabledEmail(user.email, user.name || 'User');
    } catch (emailErr) {
      console.error('Failed to send 2FA enabled email:', emailErr);
      // Don't fail the operation if email fails
    }

    res.json({ 
      message: '2FA has been successfully enabled for your account',
      backupCodes: backupCodes.map(bc => bc.code),
      enabledAt: twoFA.twoFactorEnabledAt
    });

  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ message: 'Failed to enable 2FA. Please try again.' });
  }
});

// Disable 2FA
router.post('/disable', auth, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token || token.length !== 6) {
      return res.status(400).json({ message: 'Please enter a valid 6-digit code' });
    }

    const user = await User.findById(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const twoFA = await TwoFA.findOne({ userId: req.user.user_id });

    if (!twoFA || !twoFA.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled for your account' });
    }

    // Check if it's a backup code first
    let isValidToken = false;
    let usedBackupCode = null;

    // Check backup codes
    for (let backupCode of twoFA.twoFactorBackupCodes) {
      if (!backupCode.used && backupCode.code === token.toUpperCase()) {
        backupCode.used = true;
        backupCode.usedAt = new Date();
        isValidToken = true;
        usedBackupCode = backupCode.code;
        break;
      }
    }

    // If not a backup code, verify TOTP
    if (!isValidToken) {
      isValidToken = speakeasy.totp.verify({
        secret: twoFA.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });
    }

    if (!isValidToken) {
      return res.status(400).json({ message: 'Invalid authentication code. Please try again.' });
    }

    // Disable 2FA - delete the entire TwoFA record
    await TwoFA.findOneAndDelete({ userId: req.user.user_id });

    // Send confirmation email
    try {
      await send2FADisabledEmail(user.email, user.name || 'User');
    } catch (emailErr) {
      console.error('Failed to send 2FA disabled email:', emailErr);
      // Don't fail the operation if email fails
    }

    res.json({ 
      message: '2FA has been successfully disabled for your account',
      usedBackupCode: usedBackupCode
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ message: 'Failed to disable 2FA. Please try again.' });
  }
});

// Get 2FA status
router.get('/status', auth, async (req, res) => {
  try {
    const twoFA = await TwoFA.findOne({ userId: req.user.user_id }).select('twoFactorEnabled twoFactorEnabledAt');
    
    res.json({
      enabled: twoFA ? twoFA.twoFactorEnabled : false,
      enabledAt: twoFA ? twoFA.twoFactorEnabledAt : null
    });

  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({ message: 'Failed to get 2FA status' });
  }
});

// Get backup codes (only if 2FA is enabled)
router.get('/backup-codes', auth, async (req, res) => {
  try {
    const twoFA = await TwoFA.findOne({ userId: req.user.user_id });
    
    if (!twoFA || !twoFA.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled for your account' });
    }

    const availableCodes = twoFA.twoFactorBackupCodes.filter(code => !code.used);
    
    res.json({
      backupCodes: availableCodes.map(bc => ({
        code: bc.code,
        used: bc.used
      })),
      totalCodes: twoFA.twoFactorBackupCodes.length,
      unusedCodes: availableCodes.length
    });

  } catch (error) {
    console.error('Get backup codes error:', error);
    res.status(500).json({ message: 'Failed to get backup codes' });
  }
});

// Regenerate backup codes
router.post('/regenerate-backup-codes', auth, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token || token.length !== 6) {
      return res.status(400).json({ message: 'Please enter a valid 6-digit code to regenerate backup codes' });
    }

    const twoFA = await TwoFA.findOne({ userId: req.user.user_id });
    
    if (!twoFA || !twoFA.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled for your account' });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: twoFA.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid authentication code. Please try again.' });
    }

    // Generate new backup codes
    const newBackupCodes = [];
    for (let i = 0; i < 10; i++) {
      newBackupCodes.push({
        code: crypto.randomBytes(3).toString('hex').toUpperCase(),
        used: false
      });
    }

    twoFA.twoFactorBackupCodes = newBackupCodes;
    await twoFA.save();

    res.json({
      message: 'Backup codes have been regenerated successfully',
      backupCodes: newBackupCodes.map(bc => bc.code)
    });

  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    res.status(500).json({ message: 'Failed to regenerate backup codes. Please try again.' });
  }
});

module.exports = router;