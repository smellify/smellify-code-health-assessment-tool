//models/GitHubAuth.js
const mongoose = require('mongoose');

const githubAuthSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  githubId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  avatarUrl: {
    type: String,
    trim: true
  },
  profileUrl: {
    type: String,
    trim: true
  },
  // Access tokens (encrypted)
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  tokenExpiry: {
    type: Date
  },
  // GitHub metadata
  publicRepos: {
    type: Number,
    default: 0
  },
  followers: {
    type: Number,
    default: 0
  },
  following: {
    type: Number,
    default: 0
  },
  lastSynced: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GitHubAuth', githubAuthSchema);