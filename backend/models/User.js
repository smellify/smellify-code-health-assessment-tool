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