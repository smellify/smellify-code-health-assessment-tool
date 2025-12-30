const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Referral = require('../models/Referral');
const ReferralService = require('../services/referralService');
const auth = require('../middleware/auth');

// Generate referral code for user
router.post('/generate-code', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user already has a referral code
    let referral = await Referral.findOne({ owner: user._id });
    
    if (referral) {
      return res.json({ 
        success: true, 
        referralCode: referral.code,
        message: 'Referral code already exists'
      });
    }
    
    // Generate referral code using service
    const code = await ReferralService.generateCodeFromEmail(user.email);
    
    // Create referral document
    referral = new Referral({
      owner: user._id,
      code: code
    });
    
    await referral.save();
    
    res.json({ 
      success: true, 
      referralCode: code,
      message: 'Referral code generated successfully'
    });
    
  } catch (error) {
    console.error('Error generating referral code:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's referral dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.user_id)
      .select('name email remainingScans isOnboardingComplete');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Use service to get referral information
    const { ownedReferral, referredByReferral } = await ReferralService.getUserReferralInfo(user._id);
    
    const dashboardData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        remainingScans: user.remainingScans,
        isOnboardingComplete: user.isOnboardingComplete,
        referralCode: ownedReferral ? ownedReferral.code : null,
        referredBy: referredByReferral ? {
          owner: referredByReferral.owner,
          code: referredByReferral.code
        } : null
      },
      referral: ownedReferral ? {
        code: ownedReferral.code,
        usageCount: ownedReferral.usageCount,
        isActive: ownedReferral.isActive,
        referredUsers: ownedReferral.referredUsers,
        createdAt: ownedReferral.createdAt,
        stats: ReferralService.getReferralStats(ownedReferral)
      } : null
    };
    
    res.json({ success: true, data: dashboardData });
    
  } catch (error) {
    console.error('Error fetching referral dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Validate referral code
router.post('/validate-code', async (req, res) => {
  try {
    const { code } = req.body;
    
    const referral = await ReferralService.validateReferralCode(code);
    
    res.json({ 
      success: true, 
      referral: {
        code: referral.code,
        ownerName: referral.owner.name,
        ownerEmail: referral.owner.email
      },
      message: 'Valid referral code'
    });
    
  } catch (error) {
    console.error('Error validating referral code:', error);
    res.status(400).json({ message: error.message });
  }
});

// Apply referral code to existing user
router.post('/apply-code', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.user_id;
    
    await ReferralService.applyReferralCode(code, userId, false);
    
    res.json({ 
      success: true, 
      message: 'Referral code applied successfully'
    });
    
  } catch (error) {
    console.error('Error applying referral code:', error);
    res.status(400).json({ message: error.message });
  }
});

// Apply referral code to new user during signup
router.post('/apply-code-signup', async (req, res) => {
  try {
    const { code, newUserId } = req.body;
    
    if (!newUserId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    await ReferralService.applyReferralCode(code, newUserId, true);
    
    res.json({ 
      success: true, 
      message: 'Referral code applied successfully'
    });
    
  } catch (error) {
    console.error('Error applying referral code:', error);
    res.status(400).json({ message: error.message });
  }
});

// Check and complete pending referrals - ENHANCED with notifications
router.post('/complete-pending', auth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    // Find if this user was referred by someone using service
    const referral = await ReferralService.findByReferredUser(userId);
    
    if (!referral) {
      return res.json({ 
        success: true, 
        message: 'No pending referrals to complete'
      });
    }
    
    // Use service to complete referral (this will now create notifications)
    const result = await ReferralService.completeReferral(referral, userId);
    
    if (result.success && result.referrer) {
      console.log(`Referral completed: User ${userId} completed onboarding, ${result.referrer.email} earned 5 points`);
      
      return res.json({
        success: true,
        message: `Referral completed! ${result.referrer.name || result.referrer.email} earned 5 bonus scans for referring you.`,
        referrerRewarded: true
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Referral processing completed'
    });
    
  } catch (error) {
    console.error('Error completing pending referral:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// NEW: Endpoint to manually sync user onboarding status with referral system
router.post('/sync-onboarding', auth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Sync the referral status based on current user onboarding status
    const result = await ReferralService.syncReferralStatus(userId, user.isOnboardingComplete);
    
    if (result.pointsAwarded && result.referrer) {
      return res.json({
        success: true,
        message: `Onboarding sync completed! ${result.referrer.name || result.referrer.email} earned 5 bonus scans.`,
        pointsAwarded: true
      });
    }
    
    res.json({
      success: true,
      message: 'Onboarding status synced successfully'
    });
    
  } catch (error) {
    console.error('Error syncing onboarding status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle referral code active status
router.post('/toggle-status', auth, async (req, res) => {
  try {
    const referral = await Referral.findOne({ owner: req.user.user_id });
    
    if (!referral) {
      return res.status(404).json({ message: 'Referral code not found' });
    }
    
    referral.isActive = !referral.isActive;
    await referral.save();
    
    res.json({ 
      success: true, 
      isActive: referral.isActive,
      message: `Referral code ${referral.isActive ? 'activated' : 'deactivated'} successfully`
    });
    
  } catch (error) {
    console.error('Error toggling referral status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;