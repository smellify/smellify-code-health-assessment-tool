// // routes/users.js
// const express = require('express');
// const User = require('../models/User');
// const auth = require('../middleware/auth');
// const router = express.Router();

// // Route to get user profile
// router.get('/profile', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.user_id).select('-password -verificationCode');
    
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.json({
//       id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       isVerified: user.isVerified,
//       isOnboardingComplete: user.isOnboardingComplete || false,
//       lastLogin: user.lastLogin,
//       createdAt: user.createdAt
//     });
//   } catch (error) {
//     console.error('Error fetching user profile:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Route to update user name (keeping original endpoint for compatibility)
// router.post('/update-name', auth, async (req, res) => {
//   try {
//     const { name } = req.body;
    
//     if (!name || !name.trim()) {
//       return res.status(400).json({ message: 'Name is required' });
//     }

//     const user = await User.findByIdAndUpdate(
//       req.user.user_id,
//       { 
//         name: name.trim(),
//         lastLogin: new Date()
//       },
//       { new: true }
//     );

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.json({ 
//       message: 'Name updated successfully',
//       user: { 
//         id: user._id, 
//         email: user.email, 
//         name: user.name,
//         role: user.role 
//       }
//     });
//   } catch (error) {
//     console.error('Error updating name:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Route to update user profile (RESTful approach)
// router.put('/profile', auth, async (req, res) => {
//   try {
//     const { name } = req.body;
    
//     if (!name || !name.trim()) {
//       return res.status(400).json({ message: 'Name is required' });
//     }

//     const user = await User.findByIdAndUpdate(
//       req.user.user_id,
//       { 
//         name: name.trim(),
//         lastLogin: new Date()
//       },
//       { new: true }
//     ).select('-password -verificationCode');

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.json({ 
//       message: 'Profile updated successfully',
//       user: { 
//         id: user._id, 
//         email: user.email, 
//         name: user.name,
//         role: user.role 
//       }
//     });
//   } catch (error) {
//     console.error('Error updating profile:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Route to mark onboarding as complete
// router.post('/complete-onboarding', auth, async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(
//       req.user.user_id,
//       { 
//         lastLogin: new Date(),
//         isOnboardingComplete: true
//       },
//       { new: true }
//     );

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.json({ message: 'Onboarding completed successfully' });
//   } catch (error) {
//     console.error('Error completing onboarding:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;

// routes/users.js
// const express = require('express');
// const User = require('../models/User');
// const auth = require('../middleware/auth');
// const router = express.Router();

// // Helper function to get client IP
// const getClientIp = (req) => {
//   return req.headers['x-forwarded-for'] || 
//          req.headers['x-real-ip'] || 
//          req.connection.remoteAddress || 
//          req.socket.remoteAddress ||
//          (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
//          req.ip;
// };

// // Route to get user profile
// router.get('/profile', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.user_id).select('-password -verificationCode');
    
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.json({
//       id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       isVerified: user.isVerified,
//       isOnboardingComplete: user.isOnboardingComplete || false,
//       lastLogin: user.lastLogin,
//       createdAt: user.createdAt,
//       createdIp: user.createdIp,
//       lastLoginIp: user.lastLoginIp
//     });
//   } catch (error) {
//     console.error('Error fetching user profile:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Route to update user name (keeping original endpoint for compatibility)
// router.post('/update-name', auth, async (req, res) => {
//   try {
//     const { name } = req.body;
    
//     if (!name || !name.trim()) {
//       return res.status(400).json({ message: 'Name is required' });
//     }

//     const clientIp = getClientIp(req);

//     const user = await User.findByIdAndUpdate(
//       req.user.user_id,
//       { 
//         name: name.trim(),
//         lastLogin: new Date(),
//         lastLoginIp: clientIp // Update IP on profile updates too
//       },
//       { new: true }
//     );

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.json({ 
//       message: 'Name updated successfully',
//       user: { 
//         id: user._id, 
//         email: user.email, 
//         name: user.name,
//         role: user.role 
//       }
//     });
//   } catch (error) {
//     console.error('Error updating name:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Route to update user profile (RESTful approach)
// router.put('/profile', auth, async (req, res) => {
//   try {
//     const { name } = req.body;
    
//     if (!name || !name.trim()) {
//       return res.status(400).json({ message: 'Name is required' });
//     }

//     const clientIp = getClientIp(req);

//     const user = await User.findByIdAndUpdate(
//       req.user.user_id,
//       { 
//         name: name.trim(),
//         lastLogin: new Date(),
//         lastLoginIp: clientIp // Update IP on profile updates too
//       },
//       { new: true }
//     ).select('-password -verificationCode');

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.json({ 
//       message: 'Profile updated successfully',
//       user: { 
//         id: user._id, 
//         email: user.email, 
//         name: user.name,
//         role: user.role 
//       }
//     });
//   } catch (error) {
//     console.error('Error updating profile:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Route to mark onboarding as complete
// router.post('/complete-onboarding', auth, async (req, res) => {
//   try {
//     const clientIp = getClientIp(req);

//     const user = await User.findByIdAndUpdate(
//       req.user.user_id,
//       { 
//         lastLogin: new Date(),
//         lastLoginIp: clientIp, // Update IP on onboarding completion
//         isOnboardingComplete: true
//       },
//       { new: true }
//     );

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.json({ message: 'Onboarding completed successfully' });
//   } catch (error) {
//     console.error('Error completing onboarding:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });


// module.exports = router;

// routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Session = require('../models/Session');
const { 
  sendVerificationEmail,
  sendEmailChangeVerification, 
  sendEmailChangeConfirmation, 
  sendAccountDeletionConfirmation ,
  sendPasswordChangeConfirmationEmail,
  sendSettingsPasswordChangeEmail,
  sendPasswordSetupEmail
} = require('../utils/sendEmail');
const TwoFA = require('../models/TwoFA');
const DeletedAccount = require('../models/DeletedAccounts'); // Import the DeletedAccount model
const Referral = require('../models/Referral');
const router = express.Router();

// Helper function to get client IP
const getClientIp = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
};

// Route to get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.user_id).select(' -verificationCode -pendingEmailChange');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      company: user.company,
      role: user.role,
      isVerified: user.isVerified,
      isOnboardingComplete: user.isOnboardingComplete || false,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      createdIp: user.createdIp,
      lastLoginIp: user.lastLoginIp,
      notificationSettings: user.notificationSettings,
      hasPassword: !!(user.password && user.password.trim()),
      remainingScans: user.remainingScans,
      analysisPreferences: user.analysisPreferences,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to verify current password
router.post('/verify-password', auth, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await User.findById(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(400).json({ 
        message: 'Invalid password',
        valid: false 
      });
    }

    res.json({ valid: true });

  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to request email change
router.post('/request-email-change', auth, async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    
    if (!newEmail || !password) {
      return res.status(400).json({ 
        message: 'New email and password are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ 
        message: 'Please enter a valid email address' 
      });
    }

    const user = await User.findById(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Check if new email is the same as current
    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return res.status(400).json({ 
        message: 'New email must be different from current email' 
      });
    }

    // Check if new email is already in use
    const existingUser = await User.findOne({ 
      email: newEmail.toLowerCase(),
      _id: { $ne: user._id }
    });

    if (existingUser) {
      return res.status(409).json({ 
        message: 'This email address is already in use by another account' 
      });
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store email change request temporarily
    user.pendingEmailChange = {
      newEmail: newEmail.toLowerCase(),
      verificationCode: verificationCode,
      verificationExpires: expiry,
      oldEmail: user.email
    };

    await user.save();

    // Send verification email to new email address
    try {
      await sendEmailChangeVerification(newEmail, verificationCode);
    } catch (emailErr) {
      console.error('Failed to send email change verification:', emailErr);
      // Remove pending email change if email failed
      user.pendingEmailChange = undefined;
      await user.save();
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again.' 
      });
    }

    res.json({ 
      message: 'Verification code sent to new email address',
      newEmail: newEmail
    });

  } catch (error) {
    console.error('Email change request error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Route to verify email change
router.post('/verify-email-change', auth, async (req, res) => {
  try {
    const { verificationCode, newEmail } = req.body;
    
    if (!verificationCode || !newEmail) {
      return res.status(400).json({ 
        message: 'Verification code and new email are required' 
      });
    }

    const user = await User.findById(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if there's a pending email change
    if (!user.pendingEmailChange) {
      return res.status(400).json({ 
        message: 'No pending email change request found' 
      });
    }

    // Verify the code and email match
    if (user.pendingEmailChange.verificationCode !== verificationCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.pendingEmailChange.newEmail !== newEmail.toLowerCase()) {
      return res.status(400).json({ message: 'Email mismatch' });
    }

    // Check if code has expired
    if (user.pendingEmailChange.verificationExpires < new Date()) {
      return res.status(400).json({ 
        message: 'Verification code has expired. Please request a new one.' 
      });
    }

    // Double check that new email isn't taken (race condition protection)
    const existingUser = await User.findOne({ 
      email: newEmail.toLowerCase(),
      _id: { $ne: user._id }
    });

    if (existingUser) {
      user.pendingEmailChange = undefined;
      await user.save();
      return res.status(409).json({ 
        message: 'This email address is already in use by another account' 
      });
    }

    const oldEmail = user.email;
    const clientIp = getClientIp(req);

    // Update user email and clear pending change
    user.email = newEmail.toLowerCase();
    user.lastLogin = new Date();
    user.lastLoginIp = clientIp;
    user.pendingEmailChange = undefined;

    await user.save();

    // Send confirmation email to old email address
    try {
      await sendEmailChangeConfirmation(oldEmail, newEmail);
    } catch (emailErr) {
      // Log error but don't fail the operation since email was already changed
      console.error('Failed to send email change confirmation to old email:', emailErr);
    }

    res.json({ 
      message: 'Email successfully updated',
      newEmail: newEmail
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Route to update user name (keeping original endpoint for compatibility)
// router.post('/update-name', auth, async (req, res) => {
//   try {
//     const { name } = req.body;
    
//     if (!name || !name.trim()) {
//       return res.status(400).json({ message: 'Name is required' });
//     }

//     const clientIp = getClientIp(req);

//     const user = await User.findByIdAndUpdate(
//       req.user.user_id,
//       { 
//         name: name.trim(),
//         lastLogin: new Date(),
//         lastLoginIp: clientIp
//       },
//       { new: true }
//     );

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.json({ 
//       message: 'Name updated successfully',
//       user: { 
//         id: user._id, 
//         email: user.email, 
//         name: user.name,
//         role: user.role 
//       }
//     });
//   } catch (error) {
//     console.error('Error updating name:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });
router.post('/update-name', auth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Allow ONLY alphabets + spaces (no numbers, no special chars)
    const nameRegex = /^[A-Za-z ]+$/;

    if (!nameRegex.test(name.trim())) {
      return res.status(400).json({ 
        message: 'Name can only contain alphabets and spaces' 
      });
    }

    const clientIp = getClientIp(req);

    const user = await User.findByIdAndUpdate(
      req.user.user_id,
      { 
        name: name.trim(),
        lastLogin: new Date(),
        lastLoginIp: clientIp
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Name updated successfully',
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name,
        role: user.role 
      }
    });

  } catch (error) {
    console.error('Error updating name:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Route to update user profile (RESTful approach)
// router.put('/profile', auth, async (req, res) => {
//   try {
//     const { name, phoneNumber, company } = req.body;
    
//     if (!name || !name.trim()) {
//       return res.status(400).json({ message: 'Name is required' });
//     }

//     const clientIp = getClientIp(req);

//     const user = await User.findByIdAndUpdate(
//       req.user.user_id,
//       { 
//         name: name.trim(),
//         phoneNumber: phoneNumber ? phoneNumber.trim() : '',
//         company: company ? company.trim() : '',
//         lastLogin: new Date(),
//         lastLoginIp: clientIp
//       },
//       { new: true }
//     ).select('-password -verificationCode -pendingEmailChange');

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.json({ 
//       message: 'Profile updated successfully',
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         phoneNumber: user.phoneNumber,
//         company: user.company,
//         role: user.role,
//         isOnboardingComplete: user.isOnboardingComplete || false
//       }
//     });
//   } catch (error) {
//     console.error('Error updating profile:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phoneNumber, company } = req.body;

    //  Validate Name (only alphabets + spaces)
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const nameRegex = /^[A-Za-z ]+$/;
    if (!nameRegex.test(name.trim())) {
      return res.status(400).json({
        message: 'Name can only contain alphabets and spaces'
      });
    }

    // 📞 Optional: Validate Phone Number (digits + formatting)
    if (phoneNumber && !/^[0-9+\-() ]+$/.test(phoneNumber.trim())) {
      return res.status(400).json({
        message: 'Phone number contains invalid characters'
      });
    }

    const clientIp = getClientIp(req);

    const user = await User.findByIdAndUpdate(
      req.user.user_id,
      {
        name: name.trim(),
        phoneNumber: phoneNumber ? phoneNumber.trim() : '',
        company: company ? company.trim() : '',
        lastLogin: new Date(),
        lastLoginIp: clientIp
      },
      { new: true }
    ).select('-password -verificationCode -pendingEmailChange');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        company: user.company,
        role: user.role,
        isOnboardingComplete: user.isOnboardingComplete || false
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Route to update notification settings
router.put('/notification-settings', auth, async (req, res) => {
  try {
    const { emailNotifications, dashboardNotifications, securityAlerts, marketingEmails } = req.body;
    
    const clientIp = getClientIp(req);

    const user = await User.findByIdAndUpdate(
      req.user.user_id,
      { 
        notificationSettings: {
          emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
          dashboardNotifications: dashboardNotifications !== undefined ? dashboardNotifications : true,
          securityAlerts: securityAlerts !== undefined ? securityAlerts : true,
          marketingEmails: marketingEmails !== undefined ? marketingEmails : false
        },
        lastLogin: new Date(),
        lastLoginIp: clientIp
      },
      { new: true }
    ).select('-password -verificationCode -pendingEmailChange');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Notification settings updated successfully',
      notificationSettings: user.notificationSettings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to mark onboarding as complete
// router.post('/complete-onboarding', auth, async (req, res) => {
//   try {
//     const clientIp = getClientIp(req);

//     const user = await User.findByIdAndUpdate(
//       req.user.user_id,
//       { 
//         lastLogin: new Date(),
//         lastLoginIp: clientIp,
//         isOnboardingComplete: true,
//         remainingScans: 20,
//       },
//       { new: true }
//     );

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.json({ message: 'Onboarding completed successfully' });
//   } catch (error) {
//     console.error('Error completing onboarding:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// }); 

// Updated onboarding route to handle referral system
// //routes/users.js
// router.post('/complete-onboarding', auth, async (req, res) => {
//   try {
//     const clientIp = getClientIp(req);
//     const user = await User.findByIdAndUpdate(
//       req.user.user_id,
//       { 
//         lastLogin: new Date(),
//         lastLoginIp: clientIp,
//         isOnboardingComplete: true, // Make sure this field name matches your schema
//         remainingScans: 20,
//       },
//       { new: true }
//     );
    
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     // Generate referral code for the user
//     let userReferralCode = null;
//     try {
//       let referral = await Referral.findOne({ owner: user._id });
      
//       if (!referral) {
//         const code = await Referral.generateCodeFromEmail(user.email);
        
//         referral = new Referral({
//           owner: user._id,
//           code: code
//         });
//         await referral.save();
//         userReferralCode = code;
//       } else {
//         userReferralCode = referral.code;
//       }
//     } catch (referralCodeError) {
//       console.error('Error generating referral code:', referralCodeError);
//       // Don't fail onboarding if referral code generation fails
//     }
    
//     // Handle referral reward if user was referred
//     let referralMessage = null;
//     try {
//       // Find if this user was referred by someone
//       const referralThatReferredUser = await Referral.findByReferredUser(user._id);
      
//       if (referralThatReferredUser) {
//         console.log(`Processing referral completion for user ${user.email}`);
        
//         // Mark referral as completed and award points
//         const referralCompleted = referralThatReferredUser.completeReferral(user._id);
        
//         if (referralCompleted) {
//           await referralThatReferredUser.save();
          
//           // Award points to referrer (add 5 scans)
//           const referrer = await User.findById(referralThatReferredUser.owner);
//           if (referrer) {
//             referrer.remainingScans += 5;
//             await referrer.save();
            
//             referralMessage = `Thank you for using a referral code! ${referrer.name || referrer.email} has earned 5 bonus scans for referring you.`;
            
//             console.log(`Referral completed: User ${user.email} completed onboarding, ${referrer.email} earned 5 points`);
//           }
//         }
//       }
//     } catch (referralError) {
//       console.error('Error processing referral reward:', referralError);
//       // Don't fail onboarding if referral processing fails
//     }
    
//     const response = { 
//       message: 'Onboarding completed successfully',
//       referralCode: userReferralCode,
//       remainingScans: user.remainingScans
//     };
    
//     if (referralMessage) {
//       response.referralReward = referralMessage;
//     }
    
//     res.json(response);
    
//   } catch (error) {
//     console.error('Error completing onboarding:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });
//routes/users.js - Updated to use ReferralService
const ReferralService = require('../services/referralService'); // Add this import

router.post('/complete-onboarding', auth, async (req, res) => {
  try {
    const clientIp = getClientIp(req);
    const user = await User.findByIdAndUpdate(
      req.user.user_id,
      { 
        lastLogin: new Date(),
        lastLoginIp: clientIp,
        isOnboardingComplete: true,
        remainingScans: 20,
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate referral code for the user using service
    let userReferralCode = null;
    try {
      let referral = await Referral.findOne({ owner: user._id });
      
      if (!referral) {
        const code = await ReferralService.generateCodeFromEmail(user.email);
        
        referral = new Referral({
          owner: user._id,
          code: code
        });
        await referral.save();
        userReferralCode = code;
      } else {
        userReferralCode = referral.code;
      }
    } catch (referralCodeError) {
      console.error('Error generating referral code:', referralCodeError);
      // Don't fail onboarding if referral code generation fails
    }
    
    // Handle referral reward if user was referred using service
    let referralMessage = null;
    try {
      // Find if this user was referred by someone using service
      const referralThatReferredUser = await ReferralService.findByReferredUser(user._id);
      
      if (referralThatReferredUser) {
        console.log(`Processing referral completion for user ${user.email}`);
        
        // Complete referral using service
        const result = await ReferralService.completeReferral(referralThatReferredUser, user._id);
        
        if (result.success && result.referrer) {
          referralMessage = `Thank you for using a referral code! ${result.referrer.name || result.referrer.email} has earned 5 bonus scans for referring you.`;
          
          console.log(`Referral completed: User ${user.email} completed onboarding, ${result.referrer.email} earned 5 points`);
        }
      }
    } catch (referralError) {
      console.error('Error processing referral reward:', referralError);
      // Don't fail onboarding if referral processing fails
    }
    
    const response = { 
      message: 'Onboarding completed successfully',
      referralCode: userReferralCode,
      remainingScans: user.remainingScans
    };
    
    if (referralMessage) {
      response.referralReward = referralMessage;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// routes/users.js - Updated sections with new functionality

// Route to cancel email change request
router.post('/cancel-email-change', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clear pending email change
    user.pendingEmailChange = undefined;
    await user.save();

    res.json({ 
      message: 'Email change request cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel email change error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Updated delete account route with enhanced validation
// router.delete('/account', auth, async (req, res) => {
//   try {
//     const { password, confirmText } = req.body;
    
//     // Enhanced validation
//     if (!password || !password.trim()) {
//       return res.status(400).json({ message: 'Password is required to delete your account' });
//     }

//     if (!confirmText || confirmText.trim() !== 'DELETE') {
//       return res.status(400).json({ message: 'Please type "DELETE" exactly to confirm account deletion' });
//     }

//     const user = await User.findById(req.user.user_id);
    
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Verify password
//     const isValidPassword = await bcrypt.compare(password, user.password);
//     if (!isValidPassword) {
//       return res.status(400).json({ message: 'Incorrect password. Please try again.' });
//     }

//     // Send account deletion confirmation email
//     try {
//       await sendAccountDeletionConfirmation(user.email, user.name || 'User');
//     } catch (emailErr) {
//       console.error('Failed to send account deletion confirmation:', emailErr);
//       // Continue with deletion even if email fails
//     }

//     // Delete the user
//     await User.findByIdAndDelete(req.user.user_id);
//     await Session.deleteMany({ userId: req.user.user_id });
//     await Notification.deleteMany({ userId: req.user.user_id });
//     await TwoFA.deleteOne({ userId: req.user.user_id });

//     res.json({ message: 'Account successfully deleted' });

//   } catch (error) {
//     console.error('Account deletion error:', error);
//     res.status(500).json({ message: 'Failed to delete account. Please try again.' });
//   }
// });

const GitHubAuth = require('../models/GitHubAuth');

router.delete('/account', auth, async (req, res) => {
  try {
    const { password, confirmText } = req.body;
    
    // Enhanced validation
    if (!password || !password.trim()) {
      return res.status(400).json({ message: 'Password is required to delete your account' });
    }

    if (!confirmText || confirmText.trim() !== 'DELETE') {
      return res.status(400).json({ message: 'Please type "DELETE" exactly to confirm account deletion' });
    }

    const user = await User.findById(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Incorrect password. Please try again.' });
    }

    // Prepare GitHub history data
    let githubHistory = [];
    if (user.githubId || user.githubUsername) {
      githubHistory.push({
        githubId: user.githubId || 'unknown',
        username: user.githubUsername || 'unknown',
        linkedAt: user.githubLinkedAt || user.createdAt || new Date(),
        unlinkedAt: null,
        isCurrentlyLinked: !!user.githubId
      });
    }

    // If user has a github history field (array), merge it
    if (user.githubHistory && Array.isArray(user.githubHistory)) {
      githubHistory = [...user.githubHistory, ...githubHistory];
    }

    // Store deleted account information
    const deletedAccountData = {
      originalUserId: user._id,
      email: user.email,
      githubIdHistory: githubHistory,
      deletedAt: new Date(),
      deletedIp: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
      reason: "User account deletion"
    };

    // Save to DeletedAccount collection
    try {
      await DeletedAccount.create(deletedAccountData);
      console.log(`Account deletion logged for user: ${user.email}`);
    } catch (saveError) {
      console.error('Failed to save deleted account data:', saveError);
      // You might want to decide whether to continue deletion or abort here
      // For now, we'll continue but log the error
    }

    // Send account deletion confirmation email
    try {
      await sendAccountDeletionConfirmation(user.email, user.name || 'User');
    } catch (emailErr) {
      console.error('Failed to send account deletion confirmation:', emailErr);
      // Continue with deletion even if email fails
    }

    // Delete the user and related data
    await User.findByIdAndDelete(req.user.user_id);
    await Session.deleteMany({ userId: req.user.user_id });
    await Notifications.deleteMany({ userId: req.user.user_id });
    await TwoFA.deleteOne({ userId: req.user.user_id });
    await GitHubAuth.deleteMany({ userId: req.user.user_id });

    res.json({ message: 'Account successfully deleted' });

  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ message: 'Failed to delete account. Please try again.' });
  }
});

router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.userId;
        const currentSessionId = req.user.sessionId;
        
        // Get user first to check if they have existing password
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const hasExistingPassword = !!user.password;
        
        // Validation - adjust based on whether user has existing password
        if (hasExistingPassword && !currentPassword) {
            return res.status(400).json({ message: 'Current password is required' });
        }
        
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'New password and confirmation are required' });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New password and confirmation do not match' });
        }
        
        // Enhanced password strength validation
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
        
        // If user has existing password, verify current password and check for duplicates
        if (hasExistingPassword) {
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
            
            // Check if new password is same as current password
            const isSamePassword = await bcrypt.compare(newPassword, user.password);
            if (isSamePassword) {
                return res.status(400).json({ message: 'New password must be different from current password' });
            }
        }
        
        // Hash new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        const clientIp = getClientIp(req);
        
        // Update password, passwordChangedAt timestamp, and IP
        await User.findByIdAndUpdate(userId, {
            password: hashedPassword,
            passwordChangedAt: new Date(),
            lastLogin: new Date(),
            lastLoginIp: clientIp
        });
        
        // Delete all OTHER sessions (keep current one active)
        const deleteResult = await Session.deleteMany({
            userId: userId,
            sessionId: { $ne: currentSessionId }
        });
        
        // Send appropriate email based on whether this is a password change or first-time setup
        try {
            if (hasExistingPassword) {
                await sendSettingsPasswordChangeEmail(user.email, user.name || 'User');
                console.log('Settings password change confirmation email sent to:', user.email);
            } else {
                // You might want to create a separate email template for password setup
                await sendPasswordSetupEmail(user.email, user.name || 'User');
                console.log('Password setup confirmation email sent to:', user.email);
            }
        } catch (emailErr) {
            console.error('Failed to send password confirmation email:', emailErr);
            // Continue with success response even if email fails
        }
        
        res.json({ 
            message: hasExistingPassword ? 'Password changed successfully' : 'Password set up successfully',
            otherSessionsTerminated: deleteResult.deletedCount
        });
        
    } catch (error) {
        console.error('Change/Set password error:', error);
        res.status(500).json({ message: 'Failed to update password. Please try again.' });
    }
});
// Get all active sessions for current user
router.get('/sessions', auth, async (req, res) => {
    try {
        const sessions = await Session.find({ userId: req.user.userId })
            .sort({ lastActive: -1 });
        
        const formattedSessions = sessions.map(session => ({
            id: session._id,
            sessionId: session.sessionId,
            createdAt: session.createdAt,
            lastActive: session.lastActive,
            userAgent: session.userAgent,
            ipAddress: session.ipAddress,
            deviceInfo: session.deviceInfo,
            isCurrent: session.sessionId === req.user.sessionId
        }));
        
        res.json(formattedSessions);
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ message: 'Failed to get sessions' });
    }
});

// Log out from all devices except current
router.post('/logout-all-others', auth, async (req, res) => {
    try {
        const currentSessionId = req.user.sessionId;
        
        if (!currentSessionId) {
            return res.status(400).json({ message: 'No active session found' });
        }
        
        // Delete all sessions except current one
        const result = await Session.deleteMany({
            userId: req.user.userId,
            sessionId: { $ne: currentSessionId }
        });
        
        res.json({ 
            message: `Successfully logged out from ${result.deletedCount} other device(s)`,
            loggedOutCount: result.deletedCount
        });
    } catch (error) {
        console.error('Logout all others error:', error);
        res.status(500).json({ message: 'Failed to logout from other devices' });
    }
});

// Log out from all devices including current
router.post('/logout-everywhere', auth, async (req, res) => {
    try {
        // Delete all sessions for user
        const result = await Session.deleteMany({
            userId: req.user.userId
        });
        
        res.json({ 
            message: `Successfully logged out from all devices`,
            loggedOutCount: result.deletedCount
        });
    } catch (error) {
        console.error('Logout everywhere error:', error);
        res.status(500).json({ message: 'Failed to logout from all devices' });
    }
});

// Terminate specific session
router.delete('/sessions/:sessionId', auth, async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // Don't allow deleting current session via this endpoint
        if (sessionId === req.user.sessionId) {
            return res.status(400).json({ message: 'Cannot delete current session. Use logout instead.' });
        }
        
        const result = await Session.deleteOne({
            userId: req.user.userId,
            sessionId: sessionId
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        res.json({ message: 'Session terminated successfully' });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ message: 'Failed to delete session' });
    }
});

// Enhanced email change request route with better validation
router.post('/request-email-change', auth, async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    
    if (!newEmail || !newEmail.trim()) {
      return res.status(400).json({ 
        message: 'New email address is required' 
      });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({ 
        message: 'Password is required to change email' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      return res.status(400).json({ 
        message: 'Please enter a valid email address' 
      });
    }

    const user = await User.findById(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Incorrect password. Please try again.' });
    }

    // Check if new email is the same as current
    if (newEmail.toLowerCase().trim() === user.email.toLowerCase()) {
      return res.status(400).json({ 
        message: 'New email address cannot be the same as your current email' 
      });
    }

    // Check if new email is already in use
    const existingUser = await User.findOne({ 
      email: newEmail.toLowerCase().trim(),
      _id: { $ne: user._id }
    });

    if (existingUser) {
      return res.status(409).json({ 
        message: 'This email address is already registered with another account' 
      });
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store email change request temporarily
    user.pendingEmailChange = {
      newEmail: newEmail.toLowerCase().trim(),
      verificationCode: verificationCode,
      verificationExpires: expiry,
      oldEmail: user.email
    };

    await user.save();

    // Send verification email to new email address
    try {
      await sendEmailChangeVerification(newEmail.trim(), verificationCode);
    } catch (emailErr) {
      console.error('Failed to send email change verification:', emailErr);
      // Remove pending email change if email failed
      user.pendingEmailChange = undefined;
      await user.save();
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again later.' 
      });
    }

    res.json({ 
      message: 'Verification code sent to your new email address',
      newEmail: newEmail.trim()
    });

  } catch (error) {
    console.error('Email change request error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Enhanced email verification route
router.post('/verify-email-change', auth, async (req, res) => {
  try {
    const { verificationCode, newEmail } = req.body;
    
    if (!verificationCode || !verificationCode.trim()) {
      return res.status(400).json({ 
        message: 'Verification code is required' 
      });
    }

    if (!newEmail || !newEmail.trim()) {
      return res.status(400).json({ 
        message: 'New email is required' 
      });
    }

    const user = await User.findById(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if there's a pending email change
    if (!user.pendingEmailChange) {
      return res.status(400).json({ 
        message: 'No pending email change request found. Please start the process again.' 
      });
    }

    // Verify the code and email match
    if (user.pendingEmailChange.verificationCode !== verificationCode.trim()) {
      return res.status(400).json({ message: 'Invalid verification code. Please try again.' });
    }

    if (user.pendingEmailChange.newEmail !== newEmail.toLowerCase().trim()) {
      return res.status(400).json({ message: 'Email address mismatch. Please try again.' });
    }

    // Check if code has expired
    if (user.pendingEmailChange.verificationExpires < new Date()) {
      // Clear expired request
      user.pendingEmailChange = undefined;
      await user.save();
      return res.status(400).json({ 
        message: 'Verification code has expired. Please request a new one.' 
      });
    }

    // Double check that new email isn't taken (race condition protection)
    const existingUser = await User.findOne({ 
      email: newEmail.toLowerCase().trim(),
      _id: { $ne: user._id }
    });

    if (existingUser) {
      user.pendingEmailChange = undefined;
      await user.save();
      return res.status(409).json({ 
        message: 'This email address is already registered with another account' 
      });
    }

    const oldEmail = user.email;
    const clientIp = getClientIp(req);

    // Update user email and clear pending change
    user.email = newEmail.toLowerCase().trim();
    user.lastLogin = new Date();
    user.lastLoginIp = clientIp;
    user.pendingEmailChange = undefined;

    await user.save();

    // Send confirmation email to old email address
    try {
      await sendEmailChangeConfirmation(oldEmail, newEmail.trim());
    } catch (emailErr) {
      // Log error but don't fail the operation since email was already changed
      console.error('Failed to send email change confirmation to old email:', emailErr);
    }

    res.json({ 
      message: 'Email address successfully updated',
      newEmail: newEmail.trim()
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

router.post('/deduct-scan', auth, async (req, res) => {
  try {
    const userId = req.user.userId; 
    
    // Find user and check remaining scans
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check if user has scans remaining
    if (user.remainingScans <= 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'No scans remaining. Please purchase more scans to continue.' 
      });
    }
    
    // Deduct one scan
    user.remainingScans = Math.max(0, user.remainingScans - 1);
    await user.save();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Scan credit deducted successfully',
      remainingScans: user.remainingScans
    });
    
  } catch (error) {
    console.error('Error deducting scan credit:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to deduct scan credit' 
    });
  }
});

router.patch('/analysis-preferences', auth, async (req, res) => {
  try {
    const { codeDuplication, expressMiddleware, reactHooks, propDrilling } = req.body;

    const values = [codeDuplication, expressMiddleware, reactHooks, propDrilling];
    if (values.every(v => v === false)) {
      return res.status(400).json({ message: 'At least one analysis preference must be enabled.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $set: {
          'analysisPreferences.codeDuplication': codeDuplication,
          'analysisPreferences.expressMiddleware': expressMiddleware,
          'analysisPreferences.reactHooks': reactHooks,
          'analysisPreferences.propDrilling': propDrilling,
        }
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({ success: true, analysisPreferences: user.analysisPreferences });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

module.exports = router;
