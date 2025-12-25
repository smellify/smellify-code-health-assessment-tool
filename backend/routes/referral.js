// // backend/routes/referral.js - Updated with fixes
// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');
// const Referral = require('../models/Referral');
// const auth = require('../middleware/auth');

// // Generate referral code for user (automatically called when user completes onboarding)
// router.post('/generate-code', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.user_id);
    
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     // Check if user already has a referral code
//     let referral = await Referral.findOne({ owner: user._id });
    
//     if (referral) {
//       return res.json({ 
//         success: true, 
//         referralCode: referral.code,
//         message: 'Referral code already exists'
//       });
//     }
    
//     // Generate referral code
//     const code = await Referral.generateCodeFromEmail(user.email);
    
//     // Create referral document
//     referral = new Referral({
//       owner: user._id,
//       code: code
//     });
    
//     await referral.save();
    
//     res.json({ 
//       success: true, 
//       referralCode: code,
//       message: 'Referral code generated successfully'
//     });
    
//   } catch (error) {
//     console.error('Error generating referral code:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get user's referral dashboard data
// router.get('/dashboard', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.user_id)
//       .select('name email remainingScans isOnboardingComplete');
    
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     // Get user's referral information
//     const { ownedReferral, referredByReferral } = await Referral.getUserReferralInfo(user._id);
    
//     const dashboardData = {
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         remainingScans: user.remainingScans,
//         isOnboardingComplete: user.isOnboardingComplete,
//         referralCode: ownedReferral ? ownedReferral.code : null,
//         referredBy: referredByReferral ? {
//           owner: referredByReferral.owner,
//           code: referredByReferral.code
//         } : null
//       },
//       referral: ownedReferral ? {
//         code: ownedReferral.code,
//         usageCount: ownedReferral.usageCount,
//         isActive: ownedReferral.isActive,
//         referredUsers: ownedReferral.referredUsers,
//         createdAt: ownedReferral.createdAt,
//         stats: ownedReferral.stats
//       } : null
//     };
    
//     res.json({ success: true, data: dashboardData });
    
//   } catch (error) {
//     console.error('Error fetching referral dashboard:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Validate referral code (used during signup and dashboard)
// router.post('/validate-code', async (req, res) => {
//   try {
//     const { code } = req.body;
    
//     if (!code) {
//       return res.status(400).json({ message: 'Referral code is required' });
//     }
    
//     const referral = await Referral.findOne({ 
//       code: code.toUpperCase(), 
//       isActive: true 
//     }).populate('owner', 'name email');
    
//     if (!referral) {
//       return res.status(404).json({ message: 'Invalid or inactive referral code' });
//     }
    
//     // Check if referral has reached max usage
//     if (referral.maxUsage && referral.usageCount >= referral.maxUsage) {
//       return res.status(400).json({ message: 'Referral code has reached maximum usage limit' });
//     }
    
//     res.json({ 
//       success: true, 
//       referral: {
//         code: referral.code,
//         ownerName: referral.owner.name,
//         ownerEmail: referral.owner.email
//       },
//       message: 'Valid referral code'
//     });
    
//   } catch (error) {
//     console.error('Error validating referral code:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Apply referral code to existing user (called from referral dashboard - Scenario 2)
// router.post('/apply-code', auth, async (req, res) => {
//   try {
//     const { code } = req.body;
//     const userId = req.user.user_id;
    
//     if (!code) {
//       return res.status(400).json({ message: 'Referral code is required' });
//     }
    
//     // Get current user
//     const currentUser = await User.findById(userId);
//     if (!currentUser) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     // Check if user already has been referred
//     const existingReferral = await Referral.findByReferredUser(userId);
//     if (existingReferral) {
//       return res.status(400).json({ message: 'You have already been referred by someone else' });
//     }
    
//     const referral = await Referral.findOne({ 
//       code: code.toUpperCase(), 
//       isActive: true 
//     });
    
//     if (!referral) {
//       return res.status(404).json({ message: 'Invalid or inactive referral code' });
//     }
    
//     // Check if user is trying to use their own referral code
//     if (referral.owner.toString() === userId.toString()) {
//       return res.status(400).json({ message: 'You cannot use your own referral code' });
//     }
    
//     // Check if user already exists in referral
//     const existingRef = referral.referredUsers.find(
//       ref => ref.user.toString() === userId.toString()
//     );
    
//     if (existingRef) {
//       return res.status(400).json({ message: 'User already referred with this code' });
//     }
    
//     // Add user to referral
//     referral.addReferredUser(userId);
    
//     // If user has already completed onboarding, immediately award points
//     if (currentUser.isOnboardingComplete) {
//       const completed = referral.completeReferral(userId);
//       if (completed) {
//         // Award points to referrer
//         const referrer = await User.findById(referral.owner);
//         if (referrer) {
//           referrer.remainingScans += 5;
//           await referrer.save();
//         }
//       }
//     }
    
//     await referral.save();
    
//     res.json({ 
//       success: true, 
//       message: 'Referral code applied successfully'
//     });
    
//   } catch (error) {
//     console.error('Error applying referral code:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Apply referral code to new user during signup (Scenario 1)
// router.post('/apply-code-signup', async (req, res) => {
//   try {
//     const { code, newUserId } = req.body;
    
//     if (!code || !newUserId) {
//       return res.status(400).json({ message: 'Referral code and user ID are required' });
//     }
    
//     const referral = await Referral.findOne({ 
//       code: code.toUpperCase(), 
//       isActive: true 
//     });
    
//     if (!referral) {
//       return res.status(404).json({ message: 'Invalid or inactive referral code' });
//     }
    
//     // Check if user is trying to use their own referral code
//     if (referral.owner.toString() === newUserId.toString()) {
//       return res.status(400).json({ message: 'Cannot use your own referral code' });
//     }
    
//     // Check if user already exists in referral
//     const existingRef = referral.referredUsers.find(
//       ref => ref.user.toString() === newUserId.toString()
//     );
    
//     if (existingRef) {
//       return res.status(400).json({ message: 'User already referred with this code' });
//     }
    
//     // Add user to referral - they will be marked as pending until onboarding complete
//     referral.addReferredUser(newUserId);
//     await referral.save();
    
//     res.json({ 
//       success: true, 
//       message: 'Referral code applied successfully'
//     });
    
//   } catch (error) {
//     console.error('Error applying referral code:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Check and complete pending referrals (called when user completes onboarding)
// router.post('/complete-pending', auth, async (req, res) => {
//   try {
//     const userId = req.user.user_id;
    
//     // Find if this user was referred by someone
//     const referralThatReferredUser = await Referral.findByReferredUser(userId);
    
//     if (!referralThatReferredUser) {
//       return res.json({ 
//         success: true, 
//         message: 'No pending referrals to complete'
//       });
//     }
    
//     // Mark referral as completed and award points
//     const referralCompleted = referralThatReferredUser.completeReferral(userId);
    
//     if (referralCompleted) {
//       await referralThatReferredUser.save();
      
//       // Award points to referrer (add 5 scans)
//       const referrer = await User.findById(referralThatReferredUser.owner);
//       if (referrer) {
//         referrer.remainingScans += 5;
//         await referrer.save();
        
//         console.log(`Referral completed: User ${userId} completed onboarding, ${referrer.email} earned 5 points`);
        
//         return res.json({
//           success: true,
//           message: `Referral completed! ${referrer.name || referrer.email} earned 5 bonus scans for referring you.`,
//           referrerRewarded: true
//         });
//       }
//     }
    
//     res.json({ 
//       success: true, 
//       message: 'Referral processing completed'
//     });
    
//   } catch (error) {
//     console.error('Error completing pending referral:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Toggle referral code active status
// router.post('/toggle-status', auth, async (req, res) => {
//   try {
//     const referral = await Referral.findOne({ owner: req.user.user_id });
    
//     if (!referral) {
//       return res.status(404).json({ message: 'Referral code not found' });
//     }
    
//     referral.isActive = !referral.isActive;
//     await referral.save();
    
//     res.json({ 
//       success: true, 
//       isActive: referral.isActive,
//       message: `Referral code ${referral.isActive ? 'activated' : 'deactivated'} successfully`
//     });
    
//   } catch (error) {
//     console.error('Error toggling referral status:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;




// // backend/routes/referral.js - Cleaned up with service
// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');
// const Referral = require('../models/Referral');
// const ReferralService = require('../services/referralService');
// const auth = require('../middleware/auth');

// // Generate referral code for user
// router.post('/generate-code', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.user_id);
    
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     // Check if user already has a referral code
//     let referral = await Referral.findOne({ owner: user._id });
    
//     if (referral) {
//       return res.json({ 
//         success: true, 
//         referralCode: referral.code,
//         message: 'Referral code already exists'
//       });
//     }
    
//     // Generate referral code using service
//     const code = await ReferralService.generateCodeFromEmail(user.email);
    
//     // Create referral document
//     referral = new Referral({
//       owner: user._id,
//       code: code
//     });
    
//     await referral.save();
    
//     res.json({ 
//       success: true, 
//       referralCode: code,
//       message: 'Referral code generated successfully'
//     });
    
//   } catch (error) {
//     console.error('Error generating referral code:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get user's referral dashboard data
// router.get('/dashboard', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.user_id)
//       .select('name email remainingScans isOnboardingComplete');
    
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     // Use service to get referral information
//     const { ownedReferral, referredByReferral } = await ReferralService.getUserReferralInfo(user._id);
    
//     const dashboardData = {
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         remainingScans: user.remainingScans,
//         isOnboardingComplete: user.isOnboardingComplete,
//         referralCode: ownedReferral ? ownedReferral.code : null,
//         referredBy: referredByReferral ? {
//           owner: referredByReferral.owner,
//           code: referredByReferral.code
//         } : null
//       },
//       referral: ownedReferral ? {
//         code: ownedReferral.code,
//         usageCount: ownedReferral.usageCount,
//         isActive: ownedReferral.isActive,
//         referredUsers: ownedReferral.referredUsers,
//         createdAt: ownedReferral.createdAt,
//         stats: ReferralService.getReferralStats(ownedReferral)
//       } : null
//     };
    
//     res.json({ success: true, data: dashboardData });
    
//   } catch (error) {
//     console.error('Error fetching referral dashboard:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Validate referral code
// router.post('/validate-code', async (req, res) => {
//   try {
//     const { code } = req.body;
    
//     const referral = await ReferralService.validateReferralCode(code);
    
//     res.json({ 
//       success: true, 
//       referral: {
//         code: referral.code,
//         ownerName: referral.owner.name,
//         ownerEmail: referral.owner.email
//       },
//       message: 'Valid referral code'
//     });
    
//   } catch (error) {
//     console.error('Error validating referral code:', error);
//     res.status(400).json({ message: error.message });
//   }
// });

// // Apply referral code to existing user
// router.post('/apply-code', auth, async (req, res) => {
//   try {
//     const { code } = req.body;
//     const userId = req.user.user_id;
    
//     await ReferralService.applyReferralCode(code, userId, false);
    
//     res.json({ 
//       success: true, 
//       message: 'Referral code applied successfully'
//     });
    
//   } catch (error) {
//     console.error('Error applying referral code:', error);
//     res.status(400).json({ message: error.message });
//   }
// });

// // Apply referral code to new user during signup
// router.post('/apply-code-signup', async (req, res) => {
//   try {
//     const { code, newUserId } = req.body;
    
//     if (!newUserId) {
//       return res.status(400).json({ message: 'User ID is required' });
//     }
    
//     await ReferralService.applyReferralCode(code, newUserId, true);
    
//     res.json({ 
//       success: true, 
//       message: 'Referral code applied successfully'
//     });
    
//   } catch (error) {
//     console.error('Error applying referral code:', error);
//     res.status(400).json({ message: error.message });
//   }
// });

// // Check and complete pending referrals
// router.post('/complete-pending', auth, async (req, res) => {
//   try {
//     const userId = req.user.user_id;
    
//     // Find if this user was referred by someone using service
//     const referral = await ReferralService.findByReferredUser(userId);
    
//     if (!referral) {
//       return res.json({ 
//         success: true, 
//         message: 'No pending referrals to complete'
//       });
//     }
    
//     // Use service to complete referral
//     const result = await ReferralService.completeReferral(referral, userId);
    
//     if (result.success && result.referrer) {
//       console.log(`Referral completed: User ${userId} completed onboarding, ${result.referrer.email} earned 5 points`);
      
//       return res.json({
//         success: true,
//         message: `Referral completed! ${result.referrer.name || result.referrer.email} earned 5 bonus scans for referring you.`,
//         referrerRewarded: true
//       });
//     }
    
//     res.json({ 
//       success: true, 
//       message: 'Referral processing completed'
//     });
    
//   } catch (error) {
//     console.error('Error completing pending referral:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Toggle referral code active status
// router.post('/toggle-status', auth, async (req, res) => {
//   try {
//     const referral = await Referral.findOne({ owner: req.user.user_id });
    
//     if (!referral) {
//       return res.status(404).json({ message: 'Referral code not found' });
//     }
    
//     referral.isActive = !referral.isActive;
//     await referral.save();
    
//     res.json({ 
//       success: true, 
//       isActive: referral.isActive,
//       message: `Referral code ${referral.isActive ? 'activated' : 'deactivated'} successfully`
//     });
    
//   } catch (error) {
//     console.error('Error toggling referral status:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;


// backend/routes/referral.js - Updated with notifications
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