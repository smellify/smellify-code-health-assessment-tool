// // models/User.js
// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     trim: true, 
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true,
//     index: true
//   },
//   password: {
//     type: String,
//     required: function() {
//       return !this.githubId; // Password required only if not GitHub user
//     }
//   },
//   role: {
//     type: Number,
//     enum: [1, 2], // 1 = User, 2 = Admin
//     default: 1,
//     index: true
//   },
//   isVerified: {
//     type: Boolean,
//     default: false,
//     index: true
//   },
//   verificationCode: {
//     type: String,
//     sparse: true
//   },
//   verificationExpires: {
//     type: Date,
//     sparse: true
//   },
//   // Authentication providers
//   githubId: {
//     type: String,
//     sparse: true,
//     unique: true
//   },
//   // Account status
//   isActive: {
//     type: Boolean,
//     default: true,
//     index: true
//   },
//   lastLogin: {
//     type: Date
//   },
//   isOnboardingComplete: {
//     type: Boolean,
//     default: false,
//     index: true
//   },
//   // IP tracking
//   createdIp: {
//     type: String,
//     trim: true
//   },
//   lastLoginIp: {
//     type: String,
//     trim: true
//   }
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('User', userSchema);

// // models/User.js
// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     trim: true, 
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true,
//     index: true
//   },
//   password: {
//     type: String,
//     required: function() {
//       return !this.githubId; // Password required only if not GitHub user
//     }
//   },
//   // Additional profile fields
//   phoneNumber: {
//     type: String,
//     trim: true,
//     default: ''
//   },
//   company: {
//     type: String,
//     trim: true,
//     default: ''
//   },
//   role: {
//     type: Number,
//     enum: [1, 2], // 1 = User, 2 = Admin
//     default: 1,
//     index: true
//   },
//   isVerified: {
//     type: Boolean,
//     default: false,
//     index: true
//   },
//   verificationCode: {
//     type: String,
//     sparse: true
//   },
//   verificationExpires: {
//     type: Date,
//     sparse: true
//   },
//   // Email change functionality
//   pendingEmailChange: {
//     newEmail: {
//       type: String,
//       lowercase: true,
//       trim: true
//     },
//     verificationCode: {
//       type: String
//     },
//     verificationExpires: {
//       type: Date
//     },
//     oldEmail: {
//       type: String,
//       lowercase: true,
//       trim: true
//     }
//   },
//   // Authentication providers
//   githubId: {
//     type: String,
//     sparse: true,
//     unique: true
//   },
//   // Account status
//   isActive: {
//     type: Boolean,
//     default: true,
//     index: true
//   },
//   lastLogin: {
//     type: Date
//   },
//   isOnboardingComplete: {
//     type: Boolean,
//     default: false,
//     index: true
//   },
//   // IP tracking
//   createdIp: {
//     type: String,
//     trim: true
//   },
//   lastLoginIp: {
//     type: String,
//     trim: true
//   },
//   // Notification preferences
//   notificationSettings: {
//     emailNotifications: {
//       type: Boolean,
//       default: true
//     },
//     dashboardNotifications: {
//       type: Boolean,
//       default: true
//     },
//     securityAlerts: {
//       type: Boolean,
//       default: true
//     },
//     marketingEmails: {
//       type: Boolean,
//       default: false
//     }
//   },
//   // Security settings
//   twoFactorEnabled: {
//     type: Boolean,
//     default: false
//   },
//   twoFactorSecret: {
//     type: String,
//     sparse: true
//   },
//   // Account deletion
//   deletionRequested: {
//     type: Boolean,
//     default: false
//   },
//   deletionRequestedAt: {
//     type: Date
//   }
// }, {
//   timestamps: true
// });

// // Index for email change functionality
// userSchema.index({ 'pendingEmailChange.newEmail': 1 }, { sparse: true });
// userSchema.index({ 'pendingEmailChange.verificationExpires': 1 }, { sparse: true });

// // Method to clean expired email change requests
// userSchema.methods.cleanExpiredEmailChangeRequests = function() {
//   if (this.pendingEmailChange && 
//       this.pendingEmailChange.verificationExpires && 
//       this.pendingEmailChange.verificationExpires < new Date()) {
//     this.pendingEmailChange = undefined;
//     return this.save();
//   }
//   return Promise.resolve(this);
// };

// // Static method to clean all expired email change requests
// userSchema.statics.cleanAllExpiredEmailChangeRequests = function() {
//   return this.updateMany(
//     {
//       'pendingEmailChange.verificationExpires': { $lt: new Date() }
//     },
//     {
//       $unset: { pendingEmailChange: 1 }
//     }
//   );
// };

// module.exports = mongoose.model('User', userSchema);



// // models/User.js
// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     trim: true, 
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true,
//     index: true
//   },
//   password: {
//     type: String,
//     required: function() {
//       return !this.githubId;
//     }
//   },
//   phoneNumber: {
//     type: String,
//     trim: true,
//     default: ''
//   },
//   company: {
//     type: String,
//     trim: true,
//     default: ''
//   },
//   role: {
//     type: Number,
//     enum: [1, 2],
//     default: 1,
//     index: true
//   },
//   isVerified: {
//     type: Boolean,
//     default: false,
//     index: true
//   },
//   verificationCode: {
//     type: String,
//     sparse: true
//   },
//   verificationExpires: {
//     type: Date,
//     sparse: true
//   },
//   pendingEmailChange: {
//     newEmail: {
//       type: String,
//       lowercase: true,
//       trim: true
//     },
//     verificationCode: {
//       type: String
//     },
//     verificationExpires: {
//       type: Date
//     },
//     oldEmail: {
//       type: String,
//       lowercase: true,
//       trim: true
//     }
//   },
//   githubId: {
//     type: String,
//     sparse: true,
//     unique: true
//   },
//   isActive: {
//     type: Boolean,
//     default: true,
//     index: true
//   },
//   lastLogin: {
//     type: Date
//   },
//   isOnboardingComplete: {
//     type: Boolean,
//     default: false,
//     index: true
//   },
//   createdIp: {
//     type: String,
//     trim: true
//   },
//   lastLoginIp: {
//     type: String,
//     trim: true
//   },
  
//   // Password change tracking for 2FA
//   passwordChangedAt: {
//     type: Date
//   },
//   passwordResetCode: {
//   type: String,
//   sparse: true
// },
// passwordResetExpires: {
//   type: Date,
//   sparse: true
// },
//   deletionRequested: {
//     type: Boolean,
//     default: false
//   },
//   deletionRequestedAt: {
//     type: Date
//   }
// }, {
//   timestamps: true
// });

// // Index for email change functionality
// userSchema.index({ 'pendingEmailChange.newEmail': 1 }, { sparse: true });
// userSchema.index({ 'pendingEmailChange.verificationExpires': 1 }, { sparse: true });

// // Method to clean expired email change requests
// userSchema.methods.cleanExpiredEmailChangeRequests = function() {
//   if (this.pendingEmailChange && 
//       this.pendingEmailChange.verificationExpires && 
//       this.pendingEmailChange.verificationExpires < new Date()) {
//     this.pendingEmailChange = undefined;
//     return this.save();
//   }
//   return Promise.resolve(this);
// };

// // Static method to clean all expired email change requests
// userSchema.statics.cleanAllExpiredEmailChangeRequests = function() {
//   return this.updateMany(
//     {
//       'pendingEmailChange.verificationExpires': { $lt: new Date() }
//     },
//     {
//       $unset: { pendingEmailChange: 1 }
//     }
//   );
// };

// module.exports = mongoose.model('User', userSchema);




// // models/User.js
// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     trim: true, 
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true,
//     index: true
//   },
//   password: {
//     type: String,
//     required: function() {
//       // Password is required only if user doesn't have GitHub ID
//       return !this.githubId;
//     }
//   },
//   phoneNumber: {
//     type: String,
//     trim: true,
//     default: ''
//   },
//   company: {
//     type: String,
//     trim: true,
//     default: ''
//   },
//   role: {
//     type: Number,
//     enum: [1, 2], // 1 = user, 2 = admin
//     default: 1,
//     index: true
//   },
//   isVerified: {
//     type: Boolean,
//     default: false,
//     index: true
//   },
//   verificationCode: {
//     type: String,
//     sparse: true
//   },
//   verificationExpires: {
//     type: Date,
//     sparse: true
//   },
//   pendingEmailChange: {
//     newEmail: {
//       type: String,
//       lowercase: true,
//       trim: true
//     },
//     verificationCode: {
//       type: String
//     },
//     verificationExpires: {
//       type: Date
//     },
//     oldEmail: {
//       type: String,
//       lowercase: true,
//       trim: true
//     }
//   },
//   // GitHub integration
//   githubId: {
//     type: String,
//     sparse: true,
//     unique: true,
//     index: true
//   },
//   // Account status
//   isActive: {
//     type: Boolean,
//     default: true,
//     index: true
//   },
//   lastLogin: {
//     type: Date
//   },
//   isOnboardingComplete: {
//     type: Boolean,
//     default: false,
//     index: true
//   },
//   // IP tracking
//   createdIp: {
//     type: String,
//     trim: true
//   },
//   lastLoginIp: {
//     type: String,
//     trim: true
//   },
//   // Password management
//   passwordChangedAt: {
//     type: Date
//   },
//   passwordResetCode: {
//     type: String,
//     sparse: true
//   },
//   passwordResetExpires: {
//     type: Date,
//     sparse: true
//   },
//   // Account deletion
//   deletionRequested: {
//     type: Boolean,
//     default: false
//   },
//   deletionRequestedAt: {
//     type: Date
//   },
//   // Authentication method tracking
//   authMethod: {
//     type: String,
//     enum: ['email', 'github', 'both'],
//     default: 'email'
//   }
// }, {
//   timestamps: true
// });

// // Indexes for better query performance
// userSchema.index({ 'pendingEmailChange.newEmail': 1 }, { sparse: true });
// userSchema.index({ 'pendingEmailChange.verificationExpires': 1 }, { sparse: true });
// userSchema.index({ githubId: 1, email: 1 });
// userSchema.index({ authMethod: 1 });

// // Virtual to check if user has GitHub linked
// userSchema.virtual('hasGitHub').get(function() {
//   return !!this.githubId;
// });

// // Virtual to check if user can login without password
// userSchema.virtual('canLoginWithoutPassword').get(function() {
//   return this.hasGitHub && this.isVerified;
// });

// // Method to set authentication method
// userSchema.methods.updateAuthMethod = function() {
//   if (this.githubId && this.password) {
//     this.authMethod = 'both';
//   } else if (this.githubId) {
//     this.authMethod = 'github';
//   } else {
//     this.authMethod = 'email';
//   }
// };

// // Pre-save middleware to update auth method
// userSchema.pre('save', function(next) {
//   this.updateAuthMethod();
//   next();
// });

// // Method to clean expired email change requests
// userSchema.methods.cleanExpiredEmailChangeRequests = function() {
//   if (this.pendingEmailChange && 
//       this.pendingEmailChange.verificationExpires && 
//       this.pendingEmailChange.verificationExpires < new Date()) {
//     this.pendingEmailChange = undefined;
//     return this.save();
//   }
//   return Promise.resolve(this);
// };

// // Static method to clean all expired email change requests
// userSchema.statics.cleanAllExpiredEmailChangeRequests = function() {
//   return this.updateMany(
//     {
//       'pendingEmailChange.verificationExpires': { $lt: new Date() }
//     },
//     {
//       $unset: { pendingEmailChange: 1 }
//     }
//   );
// };

// // Static method to find user by email or GitHub ID
// userSchema.statics.findByEmailOrGithub = function(email, githubId) {
//   const query = { $or: [] };
  
//   if (email) {
//     query.$or.push({ email: email.toLowerCase() });
//   }
  
//   if (githubId) {
//     query.$or.push({ githubId: githubId.toString() });
//   }
  
//   return this.findOne(query);
// };

// // Method to safely remove GitHub association
// userSchema.methods.removeGitHub = async function() {
//   this.githubId = undefined;
//   this.updateAuthMethod();
  
//   // If user has no password and is removing GitHub, they need to set a password
//   if (!this.password) {
//     throw new Error('Cannot remove GitHub authentication without setting a password first');
//   }
  
//   return this.save();
// };

// module.exports = mongoose.model('User', userSchema);







// models/User.js

// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     //required: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true
//   },
//   password: {
//     type: String,
    
//   },
//   phoneNumber: {
//     type: String,
//     trim: true
//   },
//   company: {
//     type: String,
//     trim: true
//   },
//   role: {
//     type: Number,
//     default: 1 // 1 = user, 2 = admin, etc.
//   },
//   isVerified: {
//     type: Boolean,
//     default: false
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   isOnboardingComplete: {
//     type: Boolean,
//     default: false
//   },
//     verificationCode: {
//     type: String,
//     sparse: true
//   },
//   verificationExpires: {
//     type: Date,
//     sparse: true
//   },
  
//   // Current GitHub ID (can be null if unlinked)
//   githubId: {
//     type: String,
//     sparse: true // Allows multiple null values but unique non-null values
//   },
  
//   // NEW: Array to store all GitHub IDs ever linked to this account
//   githubIdHistory: [{
//     githubId: {
//       type: String,
//       required: true
//     },
//     username: {
//       type: String,
//       required: true
//     },
//     linkedAt: {
//       type: Date,
//       default: Date.now
//     },
//     unlinkedAt: {
//       type: Date,
//       default: null
//     },
//     isCurrentlyLinked: {
//       type: Boolean,
//       default: true
//     }
//   }],
  
//   // Tracking fields
//   createdIp: String,
//   lastLogin: Date,
//   lastLoginIp: String,
  
//   // Email verification
//   emailVerificationToken: String,
//   emailVerificationExpires: Date,
  
//   // Password reset
//   passwordResetToken: String,
//   passwordResetExpires: Date,
  
//   // Email change verification
//   pendingEmailChange: {
//     newEmail: String,
//     verificationCode: String,
//     expiresAt: Date,
//     createdAt: Date
//   },

//   remainingScans:{
//     type: Number,
//   }
// }, {
//   timestamps: true
// });

// // Index for faster GitHub ID lookups across all users
// userSchema.index({ 'githubIdHistory.githubId': 1 });
// userSchema.index({ githubId: 1 }, { sparse: true });

// // Method to add GitHub ID to history
// userSchema.methods.addGithubToHistory = function(githubData) {
//   const { githubId, username } = githubData;
  
//   // Check if this GitHub ID already exists in history
//   const existingEntry = this.githubIdHistory.find(
//     entry => entry.githubId === githubId
//   );
  
//   if (existingEntry) {
//     // Re-linking the same GitHub account
//     existingEntry.isCurrentlyLinked = true;
//     existingEntry.unlinkedAt = null;
//     existingEntry.linkedAt = new Date(); // Update link time
//   } else {
//     // New GitHub account
//     this.githubIdHistory.push({
//       githubId,
//       username,
//       linkedAt: new Date(),
//       unlinkedAt: null,
//       isCurrentlyLinked: true
//     });
//   }
  
//   // Set current GitHub ID
//   this.githubId = githubId;
// };

// // Method to unlink current GitHub (but keep in history)
// userSchema.methods.unlinkCurrentGithub = function() {
//   if (this.githubId) {
//     // Find current GitHub entry in history and mark as unlinked
//     const currentEntry = this.githubIdHistory.find(
//       entry => entry.githubId === this.githubId && entry.isCurrentlyLinked
//     );
    
//     if (currentEntry) {
//       currentEntry.isCurrentlyLinked = false;
//       currentEntry.unlinkedAt = new Date();
//     }
    
//     // Clear current GitHub ID but keep history
//     this.githubId = null;
//   }
// };

// // Static method to check if GitHub ID is used by any user
// userSchema.statics.isGithubIdUsed = async function(githubId) {
//   const user = await this.findOne({
//     'githubIdHistory.githubId': githubId
//   });
//   return !!user;
// };

// // Static method to find user by any GitHub ID in history
// userSchema.statics.findByGithubId = async function(githubId) {
//   return await this.findOne({
//     'githubIdHistory.githubId': githubId
//   });
// };

// module.exports = mongoose.model('User', userSchema);



// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    //required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  role: {
    type: Number,
    default: 1 // 1 = user, 2 = admin, etc.
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOnboardingComplete: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    sparse: true
  },
  verificationExpires: {
    type: Date,
    sparse: true
  },
  
  // Current GitHub ID (can be null if unlinked)
  githubId: {
    type: String,
    sparse: true // Allows multiple null values but unique non-null values
  },
  
  // NEW: Array to store all GitHub IDs ever linked to this account
  githubIdHistory: [{
    githubId: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    linkedAt: {
      type: Date,
      default: Date.now
    },
    unlinkedAt: {
      type: Date,
      default: null
    },
    isCurrentlyLinked: {
      type: Boolean,
      default: true
    }
  }],
  
  // Tracking fields
  createdIp: String,
  lastLogin: Date,
  lastLoginIp: String,
  
  // Email verification
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Password reset
  passwordResetCode: String,
  passwordResetExpires: Date,
  
  // Email change verification
  pendingEmailChange: {
    newEmail: String,
    verificationCode: String,
    expiresAt: Date,
    createdAt: Date
  },

  remainingScans: {
    type: Number,
    default: 0
  },

  analysisPreferences: {
  codeDuplication: { type: Boolean, default: true },
  expressMiddleware: { type: Boolean, default: true },
  reactHooks: { type: Boolean, default: true },
  propDrilling: { type: Boolean, default: true },
},
}, {
  timestamps: true
});

// Index for faster GitHub ID lookups across all users
userSchema.index({ 'githubIdHistory.githubId': 1 });
userSchema.index({ githubId: 1 }, { sparse: true });
userSchema.index({ referralCode: 1 }, { sparse: true });
userSchema.index({ referredBy: 1 });



// Method to add GitHub ID to history
userSchema.methods.addGithubToHistory = function(githubData) {
  const { githubId, username } = githubData;
  
  // Check if this GitHub ID already exists in history
  const existingEntry = this.githubIdHistory.find(
    entry => entry.githubId === githubId
  );
  
  if (existingEntry) {
    // Re-linking the same GitHub account
    existingEntry.isCurrentlyLinked = true;
    existingEntry.unlinkedAt = null;
    existingEntry.linkedAt = new Date(); // Update link time
  } else {
    // New GitHub account
    this.githubIdHistory.push({
      githubId,
      username,
      linkedAt: new Date(),
      unlinkedAt: null,
      isCurrentlyLinked: true
    });
  }
  
  // Set current GitHub ID
  this.githubId = githubId;
};

// Method to unlink current GitHub (but keep in history)
userSchema.methods.unlinkCurrentGithub = function() {
  if (this.githubId) {
    // Find current GitHub entry in history and mark as unlinked
    const currentEntry = this.githubIdHistory.find(
      entry => entry.githubId === this.githubId && entry.isCurrentlyLinked
    );
    
    if (currentEntry) {
      currentEntry.isCurrentlyLinked = false;
      currentEntry.unlinkedAt = new Date();
    }
    
    // Clear current GitHub ID but keep history
    this.githubId = null;
  }
};


// Static method to check if GitHub ID is used by any user
userSchema.statics.isGithubIdUsed = async function(githubId) {
  const user = await this.findOne({
    'githubIdHistory.githubId': githubId
  });
  return !!user;
};

// Static method to find user by any GitHub ID in history
userSchema.statics.findByGithubId = async function(githubId) {
  return await this.findOne({
    'githubIdHistory.githubId': githubId
  });
};

module.exports = mongoose.model('User', userSchema);