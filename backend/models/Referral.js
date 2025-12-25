// // models/Referral.js 
// const mongoose = require('mongoose');

// const referralSchema = new mongoose.Schema({
//   owner: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//     index: true
//   },
//   code: {
//     type: String,
//     required: true,
//     unique: true,
//     uppercase: true,
//     trim: true,
//     index: true
//   },
//   isActive: {
//     type: Boolean,
//     default: true,
//     index: true
//   },
//   usageCount: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   maxUsage: {
//     type: Number,
//     default: null, // null means unlimited referrals
//   },
  
//   // Track who was referred using this code
//   referredUsers: [{
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true
//     },
//     joinedAt: {
//       type: Date,
//       default: Date.now
//     },
//     onboardingCompleted: {
//       type: Boolean,
//       default: false
//     },
//     pointsAwarded: {
//       type: Number,
//       default: 0
//     },
//     completedAt: {
//       type: Date,
//       default: null
//     }
//   }]
// }, {
//   timestamps: true
// });

// // Index for better performance
// referralSchema.index({ 'referredUsers.user': 1 });

// // Method to add referred user
// referralSchema.methods.addReferredUser = function(userId) {
//   const existingUser = this.referredUsers.find(
//     ref => ref.user.toString() === userId.toString()
//   );
  
//   if (!existingUser) {
//     this.referredUsers.push({
//       user: userId,
//       joinedAt: new Date(),
//       onboardingCompleted: false,
//       pointsAwarded: 0,
//       completedAt: null
//     });
//     this.usageCount += 1;
//   }
  
//   return this;
// };

// // Method to mark user as onboarding completed and award points
// referralSchema.methods.completeReferral = function(userId) {
//   const referredUser = this.referredUsers.find(
//     ref => ref.user.toString() === userId.toString()
//   );
  
//   if (referredUser && !referredUser.onboardingCompleted) {
//     referredUser.onboardingCompleted = true;
//     referredUser.pointsAwarded = 5;
//     referredUser.completedAt = new Date();
//     return true;
//   }
  
//   return false;
// };

// // Virtual fields for statistics
// referralSchema.virtual('stats').get(function() {
//   const totalReferrals = this.referredUsers.length;
//   const successfulReferrals = this.referredUsers.filter(ref => ref.onboardingCompleted).length;
//   const pendingReferrals = totalReferrals - successfulReferrals;
//   const totalPointsEarned = this.referredUsers.reduce((sum, ref) => sum + ref.pointsAwarded, 0);
  
//   return {
//     totalReferrals,
//     successfulReferrals,
//     pendingReferrals,
//     totalPointsEarned
//   };
// });

// // Static method to generate referral code from email
// referralSchema.statics.generateCodeFromEmail = async function(email) {
//   const baseCode = email.split('@')[0].toUpperCase();
//   let code = baseCode;
//   let counter = 1;
  
//   // Check if code exists and generate unique one
//   while (await this.findOne({ code: code })) {
//     code = `${baseCode}${Math.floor(Math.random() * 1000) + counter}`;
//     counter++;
//   }
  
//   return code;
// };

// // Static method to find referral by user ID (for users who were referred)
// referralSchema.statics.findByReferredUser = async function(userId) {
//   return await this.findOne({
//     'referredUsers.user': userId
//   });
// };

// // Static method to get user's referral info (both as owner and as referred)
// referralSchema.statics.getUserReferralInfo = async function(userId) {
//   // Find referral where user is the owner
//   const ownedReferral = await this.findOne({ owner: userId })
//     .populate({
//       path: 'referredUsers.user',
//       select: 'name email createdAt isOnboardingComplete'
//     });
  
//   // Find referral where user was referred
//   const referredByReferral = await this.findOne({
//     'referredUsers.user': userId
//   }).populate('owner', 'name email');
  
//   return {
//     ownedReferral,
//     referredByReferral
//   };
// };

// // Static method to check referral status based on user's onboarding completion
// referralSchema.statics.syncReferralStatus = async function(userId, isOnboardingComplete) {
//   try {
//     const referral = await this.findByReferredUser(userId);
    
//     if (referral) {
//       const referredUser = referral.referredUsers.find(
//         ref => ref.user.toString() === userId.toString()
//       );
      
//       if (referredUser) {
//         // Update onboarding status to match user's actual status
//         if (isOnboardingComplete && !referredUser.onboardingCompleted) {
//           referredUser.onboardingCompleted = true;
//           referredUser.pointsAwarded = 5;
//           referredUser.completedAt = new Date();
//           await referral.save();
          
//           // Award points to referrer
//           const referrer = await mongoose.model('User').findById(referral.owner);
//           if (referrer) {
//             referrer.remainingScans += 5;
//             await referrer.save();
//           }
          
//           return { pointsAwarded: true, referrer };
//         } else if (!isOnboardingComplete && referredUser.onboardingCompleted) {
//           // If somehow user's onboarding got rolled back, update the referral too
//           referredUser.onboardingCompleted = false;
//           referredUser.pointsAwarded = 0;
//           referredUser.completedAt = null;
//           await referral.save();
          
//           return { pointsReverted: true };
//         }
//       }
//     }
    
//     return { noChange: true };
//   } catch (error) {
//     console.error('Error syncing referral status:', error);
//     throw error;
//   }
// };

// module.exports = mongoose.model('Referral', referralSchema);

// models/Referral.js - Minimal model with only schema definition
const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxUsage: {
    type: Number,
    default: null, // null means unlimited referrals
  },
  
  // Track who was referred using this code
  referredUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    pointsAwarded: {
      type: Number,
      default: 0
    },
    completedAt: {
      type: Date,
      default: null
    }
  }]
}, {
  timestamps: true
});

// Index for better performance
referralSchema.index({ 'referredUsers.user': 1 });

// Clean model with only schema definition and indexes

module.exports = mongoose.model('Referral', referralSchema);