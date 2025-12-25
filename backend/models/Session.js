
// models/Session.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  sessionId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastActive: { 
    type: Date, 
    default: Date.now 
  },
  userAgent: String,
  ipAddress: String,
  deviceInfo: {
    browser: String,
    os: String,
    device: String,
    isMobile: Boolean
  }
});

// Auto-delete expired sessions (older than 30 days)
sessionSchema.index({ lastActive: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Session', sessionSchema);