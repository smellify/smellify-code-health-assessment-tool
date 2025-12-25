// routes/profile.js
const express = require('express');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const ReferralCode = require('../models/ReferralCode');
const GitHubAuth = require('../models/GitHubAuth');
const auth = require('../middleware/auth');
const { validateReferralCode, generateUniqueReferralCode } = require('../utils/referralUtils');

const router = express.Router();

// Complete user profile after signup/verification
router.post('/complete', auth, async (req, res) => {
  const { name, githubUsername, referralCode } = req.body;

  try {
    const userId = req.user.user_id;
    const user = await User.findById(userId).populate('profile');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Validate referral code if provided
    let referredBy = null;
    if (referralCode && referralCode.trim()) {
      const referralValidation = await validateReferralCode(referralCode.trim());
      if (!referralValidation.isValid) {
        return res.status(400).json({ message: referralValidation.message });
      }
      referredBy = referralValidation.referralOwner;
    }

    // Prepare profile data
    const profileData = {
      user: userId,
      name: name.trim(),
      referralCode: referralCode?.trim()?.toUpperCase() || null,
      referredBy
    };

    // Handle GitHub information
    if (githubUsername && githubUsername.trim()) {
      const githubAuth = await GitHubAuth.findOne({ user: userId });
      
      if (githubAuth) {
        // Use GitHub auth data
        profileData.github = {
          username: githubAuth.username,
          profileUrl: githubAuth.profileUrl,
          avatarUrl: githubAuth.avatarUrl
        };
      } else {
        // Manual GitHub username entry
        profileData.github = {
          username: githubUsername.trim().toLowerCase(),
          profileUrl: `https://github.com/${githubUsername.trim()}`,
          avatarUrl: null
        };
      }
    }

    let profile;
    
    if (user.profile) {
      // Update existing profile
      profile = await UserProfile.findByIdAndUpdate(
        user.profile._id,
        profileData,
        { new: true, runValidators: true }
      );
    } else {
      // Create new profile
      profile = await UserProfile.create(profileData);
      
      // Link profile to user
      user.profile = profile._id;
      await user.save();
    }

    // Update referral code usage if applicable
    if (referredBy) {
      await ReferralCode.findOneAndUpdate(
        { owner: referredBy, isActive: true },
        { $inc: { usageCount: 1 } }
      );
    }

    res.status(200).json({
      message: 'Profile completed successfully',
      profile: {
        id: profile._id,
        name: profile.name,
        github: profile.github,
        isComplete: profile.isComplete
      }
    });

  } catch (error) {
    console.error('Profile completion error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A profile with this information already exists' });
    }
    
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Get user profile
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const user = await User.findById(userId)
      .populate('profile')
      .select('-password -verificationCode -verificationExpires');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get GitHub auth data if exists
    let githubAuth = null;
    if (user.githubId) {
      githubAuth = await GitHubAuth.findOne({ user: userId })
        .select('-accessToken -refreshToken');
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isProfileComplete: user.profile?.isComplete || false,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      profile: user.profile,
      github: githubAuth
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/update', auth, async (req, res) => {
  const { name, githubUsername } = req.body;

  try {
    const userId = req.user.user_id;
    const user = await User.findById(userId).populate('profile');

    if (!user || !user.profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const updateData = {};
    
    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    if (githubUsername !== undefined) {
      if (githubUsername && githubUsername.trim()) {
        updateData['github.username'] = githubUsername.trim().toLowerCase();
        updateData['github.profileUrl'] = `https://github.com/${githubUsername.trim()}`;
      } else {
        // Clear GitHub info
        updateData.github = {
          username: null,
          profileUrl: null,
          avatarUrl: user.profile.github?.avatarUrl || null
        };
      }
    }

    const updatedProfile = await UserProfile.findByIdAndUpdate(
      user.profile._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Generate referral code for user
router.post('/generate-referral-code', auth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    // Check if user already has an active referral code
    const existingCode = await ReferralCode.findOne({ 
      owner: userId, 
      isActive: true 
    });

    if (existingCode) {
      return res.json({
        referralCode: existingCode.code,
        usageCount: existingCode.usageCount,
        message: 'Using existing referral code'
      });
    }

    // Generate new unique referral code
    const code = await generateUniqueReferralCode();

    const newReferralCode = await ReferralCode.create({
      code,
      owner: userId,
      isActive: true
    });

    res.status(201).json({
      referralCode: newReferralCode.code,
      usageCount: 0,
      message: 'Referral code generated successfully'
    });

  } catch (error) {
    console.error('Generate referral code error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Get referral statistics
router.get('/referral-stats', auth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    // Get user's referral codes
    const referralCodes = await ReferralCode.find({ 
      owner: userId, 
      isActive: true 
    });

    // Get users referred by this user
    const referredUsers = await UserProfile.find({ 
      referredBy: userId 
    }).populate('user', 'email createdAt isVerified');

    const stats = {
      totalCodes: referralCodes.length,
      totalUsage: referralCodes.reduce((sum, code) => sum + code.usageCount, 0),
      referralCodes: referralCodes.map(code => ({
        code: code.code,
        usageCount: code.usageCount,
        createdAt: code.createdAt
      })),
      referredUsers: referredUsers.map(profile => ({
        name: profile.name,
        email: profile.user.email,
        joinedAt: profile.user.createdAt,
        isVerified: profile.user.isVerified
      }))
    };

    res.json(stats);

  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Validate referral code endpoint
router.post('/validate-referral', auth, async (req, res) => {
  const { code } = req.body;

  try {
    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'Referral code is required' });
    }

    const validation = await validateReferralCode(code.trim());
    
    if (validation.isValid) {
      // Get referrer's profile info
      const referrerProfile = await UserProfile.findOne({ 
        user: validation.referralOwner 
      }).select('name');

      res.json({
        isValid: true,
        message: `Valid referral code from ${referrerProfile?.name || 'Unknown User'}`,
        referrerName: referrerProfile?.name
      });
    } else {
      res.status(400).json({
        isValid: false,
        message: validation.message
      });
    }

  } catch (error) {
    console.error('Validate referral error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;