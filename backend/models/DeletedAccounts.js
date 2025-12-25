//models/DeletedAccounts.js
const mongoose = require('mongoose');

const deletedAccountSchema = new mongoose.Schema({
  originalUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

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
      required: true
    },
    unlinkedAt: {
      type: Date,
      default: null
    },
    isCurrentlyLinked: {
      type: Boolean,
      default: false
    }
  }],

  deletedAt: {
    type: Date,
    default: Date.now
  },

  deletedIp: {
    type: String
  },

  reason: {
    type: String,
    default: "User account deletion"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("DeletedAccount", deletedAccountSchema);
