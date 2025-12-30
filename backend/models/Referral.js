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