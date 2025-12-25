const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  // GitHub Information
  github: {
    username: {
      type: String,
      trim: true,
      lowercase: true
    },
    profileUrl: {
      type: String,
      trim: true
    },
    avatarUrl: {
      type: String,
      trim: true
    }
  },
  // Referral Information
  referralCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  // Profile completion tracking
  isComplete: {
    type: Boolean,
    default: false
  },
  
  
}, {
  timestamps: true
});


module.exports = mongoose.model('UserProfile', userProfileSchema);