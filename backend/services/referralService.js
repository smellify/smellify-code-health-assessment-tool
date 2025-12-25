// // services/referralService.js
// const User = require('../models/User');
// const Referral = require('../models/Referral');

// class ReferralService {
//   // MOVED: Simple data manipulation (was referralSchema.methods.addReferredUser)
//   static addReferredUser(referralDoc, userId) {
//     const existingUser = referralDoc.referredUsers.find(
//       ref => ref.user.toString() === userId.toString()
//     );
    
//     if (!existingUser) {
//       referralDoc.referredUsers.push({
//         user: userId,
//         joinedAt: new Date(),
//         onboardingCompleted: false,
//         pointsAwarded: 0,
//         completedAt: null
//       });
//       referralDoc.usageCount += 1;
//     }
    
//     return referralDoc;
//   }

//   // MOVED: Virtual stats calculation
//   static getReferralStats(referralDoc) {
//     const totalReferrals = referralDoc.referredUsers.length;
//     const successfulReferrals = referralDoc.referredUsers.filter(ref => ref.onboardingCompleted).length;
//     const pendingReferrals = totalReferrals - successfulReferrals;
//     const totalPointsEarned = referralDoc.referredUsers.reduce((sum, ref) => sum + ref.pointsAwarded, 0);
    
//     return {
//       totalReferrals,
//       successfulReferrals,
//       pendingReferrals,
//       totalPointsEarned
//     };
//   }

//   // MOVED: Code generation (was referralSchema.statics.generateCodeFromEmail)
//   static async generateCodeFromEmail(email) {
//     const baseCode = email.split('@')[0].toUpperCase();
//     let code = baseCode;
//     let counter = 1;
    
//     // Check if code exists and generate unique one
//     while (await Referral.findOne({ code: code })) {
//       code = `${baseCode}${Math.floor(Math.random() * 1000) + counter}`;
//       counter++;
//     }
    
//     return code;
//   }

//   // MOVED: Query method (was referralSchema.statics.findByReferredUser)
//   static async findByReferredUser(userId) {
//     return await Referral.findOne({
//       'referredUsers.user': userId
//     });
//   }
//   // MOVED: Complex business logic with multiple model interactions
//   static async completeReferral(referralDoc, userId) {
//     const referredUser = referralDoc.referredUsers.find(
//       ref => ref.user.toString() === userId.toString()
//     );
    
//     if (referredUser && !referredUser.onboardingCompleted) {
//       referredUser.onboardingCompleted = true;
//       referredUser.pointsAwarded = 5;
//       referredUser.completedAt = new Date();
      
//       await referralDoc.save();
      
//       // Award points to referrer
//       const referrer = await User.findById(referralDoc.owner);
//       if (referrer) {
//         referrer.remainingScans += 5;
//         await referrer.save();
//         return { success: true, referrer };
//       }
//     }
    
//     return { success: false };
//   }

//   // MOVED: Complex query with multiple populations and business logic
//   static async getUserReferralInfo(userId) {
//     // Find referral where user is the owner
//     const ownedReferral = await Referral.findOne({ owner: userId })
//       .populate({
//         path: 'referredUsers.user',
//         select: 'name email createdAt isOnboardingComplete'
//       });
    
//     // Find referral where user was referred
//     const referredByReferral = await Referral.findOne({
//       'referredUsers.user': userId
//     }).populate('owner', 'name email');
    
//     return {
//       ownedReferral,
//       referredByReferral
//     };
//   }

//   // MOVED: Complex sync operation with multiple model updates
//   static async syncReferralStatus(userId, isOnboardingComplete) {
//     try {
//       const referral = await this.findByReferredUser(userId);
      
//       if (referral) {
//         const referredUser = referral.referredUsers.find(
//           ref => ref.user.toString() === userId.toString()
//         );
        
//         if (referredUser) {
//           // Update onboarding status to match user's actual status
//           if (isOnboardingComplete && !referredUser.onboardingCompleted) {
//             referredUser.onboardingCompleted = true;
//             referredUser.pointsAwarded = 5;
//             referredUser.completedAt = new Date();
//             await referral.save();
            
//             // Award points to referrer
//             const referrer = await User.findById(referral.owner);
//             if (referrer) {
//               referrer.remainingScans += 5;
//               await referrer.save();
//             }
            
//             return { pointsAwarded: true, referrer };
//           } else if (!isOnboardingComplete && referredUser.onboardingCompleted) {
//             // If somehow user's onboarding got rolled back, update the referral too
//             referredUser.onboardingCompleted = false;
//             referredUser.pointsAwarded = 0;
//             referredUser.completedAt = null;
//             await referral.save();
            
//             return { pointsReverted: true };
//           }
//         }
//       }
      
//       return { noChange: true };
//     } catch (error) {
//       console.error('Error syncing referral status:', error);
//       throw error;
//     }
//   }

//   // MOVED: Validation logic that involves business rules
//   static async validateReferralCode(code, excludeUserId = null) {
//     if (!code) {
//       throw new Error('Referral code is required');
//     }
    
//     const referral = await Referral.findOne({ 
//       code: code.toUpperCase(), 
//       isActive: true 
//     }).populate('owner', 'name email');
    
//     if (!referral) {
//       throw new Error('Invalid or inactive referral code');
//     }
    
//     // Check if referral has reached max usage
//     if (referral.maxUsage && referral.usageCount >= referral.maxUsage) {
//       throw new Error('Referral code has reached maximum usage limit');
//     }
    
//     // Check if user is trying to use their own referral code
//     if (excludeUserId && referral.owner.toString() === excludeUserId.toString()) {
//       throw new Error('You cannot use your own referral code');
//     }
    
//     return referral;
//   }

//   // MOVED: Apply referral with all business logic
//   static async applyReferralCode(code, userId, isNewUser = false) {
//     try {
//       // Validate the referral code
//       const referral = await this.validateReferralCode(code, userId);
      
//       // Check if user already has been referred (for existing users)
//       if (!isNewUser) {
//         const existingReferral = await this.findByReferredUser(userId);
//         if (existingReferral) {
//           throw new Error('You have already been referred by someone else');
//         }
//       }
      
//       // Check if user already exists in this referral
//       const existingRef = referral.referredUsers.find(
//         ref => ref.user.toString() === userId.toString()
//       );
      
//       if (existingRef) {
//         throw new Error('User already referred with this code');
//       }
      
//       // Add user to referral
//       this.addReferredUser(referral, userId);
      
//       // If user has already completed onboarding, immediately award points
//       if (!isNewUser) {
//         const currentUser = await User.findById(userId);
//         if (currentUser && currentUser.isOnboardingComplete) {
//           await this.completeReferral(referral, userId);
//         }
//       }
      
//       await referral.save();
      
//       return { success: true, referral };
      
//     } catch (error) {
//       throw error;
//     }
//   }
// }

// module.exports = ReferralService;



// services/referralService.js
const User = require('../models/User');
const Referral = require('../models/Referral');
const Notification = require('../models/Notification');

class ReferralService {
  // Helper method to create notifications
  static async createNotification(userId, type, message) {
    try {
      let notification = await Notification.findOne({ userId });
      
      if (!notification) {
        // Create new document if doesn't exist
        notification = new Notification({
          userId,
          preferences: {
            dashboardNotifications: true,
            popupNotifications: true,
            newsletterEmails: false,
          },
          notifications: []
        });
      }
      
      // Add new notification to the array
      notification.notifications.push({
        type,
        message,
        read: false,
        createdAt: new Date()
      });
      
      await notification.save();
      console.log(`Notification created for user ${userId}: ${message}`);
      
    } catch (error) {
      console.error('Error creating notification:', error);
      // Don't throw error to avoid breaking main referral flow
    }
  }

  // MOVED: Simple data manipulation (was referralSchema.methods.addReferredUser)
  static addReferredUser(referralDoc, userId) {
    const existingUser = referralDoc.referredUsers.find(
      ref => ref.user.toString() === userId.toString()
    );
    
    if (!existingUser) {
      referralDoc.referredUsers.push({
        user: userId,
        joinedAt: new Date(),
        onboardingCompleted: false,
        pointsAwarded: 0,
        completedAt: null
      });
      referralDoc.usageCount += 1;
    }
    
    return referralDoc;
  }

  // MOVED: Virtual stats calculation
  static getReferralStats(referralDoc) {
    const totalReferrals = referralDoc.referredUsers.length;
    const successfulReferrals = referralDoc.referredUsers.filter(ref => ref.onboardingCompleted).length;
    const pendingReferrals = totalReferrals - successfulReferrals;
    const totalPointsEarned = referralDoc.referredUsers.reduce((sum, ref) => sum + ref.pointsAwarded, 0);
    
    return {
      totalReferrals,
      successfulReferrals,
      pendingReferrals,
      totalPointsEarned
    };
  }

  // MOVED: Code generation (was referralSchema.statics.generateCodeFromEmail)
  static async generateCodeFromEmail(email) {
    const baseCode = email.split('@')[0].toUpperCase();
    let code = baseCode;
    let counter = 1;
    
    // Check if code exists and generate unique one
    while (await Referral.findOne({ code: code })) {
      code = `${baseCode}${Math.floor(Math.random() * 1000) + counter}`;
      counter++;
    }
    
    return code;
  }

  // MOVED: Query method (was referralSchema.statics.findByReferredUser)
  static async findByReferredUser(userId) {
    return await Referral.findOne({
      'referredUsers.user': userId
    });
  }

  // ENHANCED: Complete referral with notification
  static async completeReferral(referralDoc, userId) {
    const referredUser = referralDoc.referredUsers.find(
      ref => ref.user.toString() === userId.toString()
    );
    
    if (referredUser && !referredUser.onboardingCompleted) {
      referredUser.onboardingCompleted = true;
      referredUser.pointsAwarded = 5;
      referredUser.completedAt = new Date();
      
      await referralDoc.save();
      
      // Award points to referrer
      const referrer = await User.findById(referralDoc.owner);
      const newUser = await User.findById(userId);
      
      if (referrer && newUser) {
        referrer.remainingScans += 5;
        await referrer.save();
        
        // Create notification for referrer about completed onboarding
        await this.createNotification(
          referrer._id,
          'success',
          `🎉 ${newUser.name } completed onboarding! You earned 5 bonus scans.`
        );
        
        return { success: true, referrer };
      }
    }
    
    return { success: false };
  }

  // MOVED: Complex query with multiple populations and business logic
  static async getUserReferralInfo(userId) {
    // Find referral where user is the owner
    const ownedReferral = await Referral.findOne({ owner: userId })
      .populate({
        path: 'referredUsers.user',
        select: 'name email createdAt isOnboardingComplete'
      });
    
    // Find referral where user was referred
    const referredByReferral = await Referral.findOne({
      'referredUsers.user': userId
    }).populate('owner', 'name email');
    
    return {
      ownedReferral,
      referredByReferral
    };
  }

  // ENHANCED: Sync referral status with notifications
  static async syncReferralStatus(userId, isOnboardingComplete) {
    try {
      const referral = await this.findByReferredUser(userId);
      
      if (referral) {
        const referredUser = referral.referredUsers.find(
          ref => ref.user.toString() === userId.toString()
        );
        
        if (referredUser) {
          // Update onboarding status to match user's actual status
          if (isOnboardingComplete && !referredUser.onboardingCompleted) {
            referredUser.onboardingCompleted = true;
            referredUser.pointsAwarded = 5;
            referredUser.completedAt = new Date();
            await referral.save();
            
            // Award points to referrer
            const referrer = await User.findById(referral.owner);
            const newUser = await User.findById(userId);
            
            if (referrer && newUser) {
              referrer.remainingScans += 5;
              await referrer.save();
              
              // Create notification for referrer
              await this.createNotification(
                referrer._id,
                'success',
                `🎉 ${newUser.name} completed onboarding! You earned 5 bonus scans.`
              );
            }
            
            return { pointsAwarded: true, referrer };
          } else if (!isOnboardingComplete && referredUser.onboardingCompleted) {
            // If somehow user's onboarding got rolled back, update the referral too
            referredUser.onboardingCompleted = false;
            referredUser.pointsAwarded = 0;
            referredUser.completedAt = null;
            await referral.save();
            
            return { pointsReverted: true };
          }
        }
      }
      
      return { noChange: true };
    } catch (error) {
      console.error('Error syncing referral status:', error);
      throw error;
    }
  }

  // MOVED: Validation logic that involves business rules
  static async validateReferralCode(code, excludeUserId = null) {
    if (!code) {
      throw new Error('Referral code is required');
    }
    
    const referral = await Referral.findOne({ 
      code: code.toUpperCase(), 
      isActive: true 
    }).populate('owner', 'name email');
    
    if (!referral) {
      throw new Error('Invalid or inactive referral code');
    }
    
    // Check if referral has reached max usage
    if (referral.maxUsage && referral.usageCount >= referral.maxUsage) {
      throw new Error('Referral code has reached maximum usage limit');
    }
    
    // Check if user is trying to use their own referral code
    if (excludeUserId && referral.owner.toString() === excludeUserId.toString()) {
      throw new Error('You cannot use your own referral code');
    }
    
    return referral;
  }

  // ENHANCED: Apply referral with notifications
  static async applyReferralCode(code, userId, isNewUser = false) {
    try {
      // Validate the referral code
      const referral = await this.validateReferralCode(code, userId);
      
      // Check if user already has been referred (for existing users)
      if (!isNewUser) {
        const existingReferral = await this.findByReferredUser(userId);
        if (existingReferral) {
          throw new Error('You have already been referred by someone else');
        }
      }
      
      // Check if user already exists in this referral
      const existingRef = referral.referredUsers.find(
        ref => ref.user.toString() === userId.toString()
      );
      
      if (existingRef) {
        throw new Error('User already referred with this code');
      }
      
      // Add user to referral
      this.addReferredUser(referral, userId);
      
      // Get user details for notification
      const newUser = await User.findById(userId);
      const referrer = await User.findById(referral.owner);
      
      if (newUser && referrer) {
        // Create notification for referrer about new signup
        await this.createNotification(
          referrer._id,
          'info',
          `👋 Someone signed up using your referral code! They need to complete onboarding for you to earn bonus scans.`
        );
      }
      
      // If user has already completed onboarding, immediately award points
      if (!isNewUser) {
        const currentUser = await User.findById(userId);
        if (currentUser && currentUser.isOnboardingComplete) {
          await this.completeReferral(referral, userId);
        }
      }
      
      await referral.save();
      
      return { success: true, referral };
      
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ReferralService;