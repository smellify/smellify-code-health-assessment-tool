// // utils/githubUtils.js
// // Utility functions for GitHub ID management

// const User = require('../models/User');
// const GitHubAuth = require('../models/GitHubAuth');

// /**
//  * Check if a GitHub ID has ever been used by any user
//  * @param {string} githubId - The GitHub ID to check
//  * @returns {Promise<Object>} - Usage information
//  */
// async function checkGithubIdUsage(githubId) {
//   try {
//     const user = await User.findByGithubId(githubId);
    
//     if (!user) {
//       return {
//         isUsed: false,
//         userId: null,
//         userEmail: null,
//         currentlyLinked: false,
//         historyEntry: null
//       };
//     }

//     const historyEntry = user.githubIdHistory.find(
//       entry => entry.githubId === githubId
//     );

//     return {
//       isUsed: true,
//       userId: user._id,
//       userEmail: user.email,
//       currentlyLinked: historyEntry?.isCurrentlyLinked || false,
//       historyEntry: historyEntry || null,
//       linkedAt: historyEntry?.linkedAt,
//       unlinkedAt: historyEntry?.unlinkedAt
//     };
//   } catch (error) {
//     console.error('Error checking GitHub ID usage:', error);
//     throw error;
//   }
// }

// /**
//  * Get all GitHub accounts ever linked to a user
//  * @param {string} userId - The user ID
//  * @returns {Promise<Array>} - Array of GitHub history entries
//  */
// async function getUserGithubHistory(userId) {
//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       throw new Error('User not found');
//     }

//     return user.githubIdHistory || [];
//   } catch (error) {
//     console.error('Error getting user GitHub history:', error);
//     throw error;
//   }
// }

// /**
//  * Clean up orphaned GitHub auth records (GitHub auths without corresponding users)
//  * @returns {Promise<Object>} - Cleanup results
//  */
// async function cleanupOrphanedGithubAuths() {
//   try {
//     const allGithubAuths = await GitHubAuth.find({});
//     let cleaned = 0;
//     let errors = 0;

//     for (const githubAuth of allGithubAuths) {
//       try {
//         const user = await User.findById(githubAuth.user);
//         if (!user) {
//           // User doesn't exist - remove orphaned GitHub auth
//           await GitHubAuth.findByIdAndDelete(githubAuth._id);
//           cleaned++;
//           console.log(`Cleaned orphaned GitHub auth for user ID: ${githubAuth.user}`);
//         }
//       } catch (error) {
//         console.error(`Error processing GitHub auth ${githubAuth._id}:`, error);
//         errors++;
//       }
//     }

//     return {
//       totalProcessed: allGithubAuths.length,
//       cleaned,
//       errors
//     };
//   } catch (error) {
//     console.error('Error during GitHub auth cleanup:', error);
//     throw error;
//   }
// }

// /**
//  * Generate comprehensive GitHub usage report
//  * @returns {Promise<Object>} - Usage statistics
//  */
// async function generateGithubUsageReport() {
//   try {
//     const totalUsers = await User.countDocuments({});
//     const usersWithGithub = await User.countDocuments({ githubId: { $ne: null } });
//     const usersWithGithubHistory = await User.countDocuments({ 
//       githubIdHistory: { $exists: true, $not: { $size: 0 } } 
//     });

//     // Count total GitHub IDs in history across all users
//     const pipeline = [
//       { $unwind: '$githubIdHistory' },
//       { $group: { _id: null, totalGithubIds: { $sum: 1 } } }
//     ];
//     const githubIdCount = await User.aggregate(pipeline);
//     const totalGithubIdsInHistory = githubIdCount.length > 0 ? githubIdCount[0].totalGithubIds : 0;

//     // Count currently linked vs unlinked
//     const currentlyLinkedPipeline = [
//       { $unwind: '$githubIdHistory' },
//       { $match: { 'githubIdHistory.isCurrentlyLinked': true } },
//       { $group: { _id: null, count: { $sum: 1 } } }
//     ];
//     const linkedCount = await User.aggregate(currentlyLinkedPipeline);
//     const currentlyLinked = linkedCount.length > 0 ? linkedCount[0].count : 0;

//     const unlinkedPipeline = [
//       { $unwind: '$githubIdHistory' },
//       { $match: { 'githubIdHistory.isCurrentlyLinked': false } },
//       { $group: { _id: null, count: { $sum: 1 } } }
//     ];
//     const unlinkedCount = await User.aggregate(unlinkedPipeline);
//     const currentlyUnlinked = unlinkedCount.length > 0 ? unlinkedCount[0].count : 0;

//     return {
//       totalUsers,
//       usersWithCurrentGithub: usersWithGithub,
//       usersWithGithubHistory: usersWithGithubHistory,
//       totalGithubIdsTracked: totalGithubIdsInHistory,
//       currentlyLinkedAccounts: currentlyLinked,
//       unlinkedButTrackedAccounts: currentlyUnlinked,
//       preventedReuseAttempts: currentlyUnlinked // These IDs can't be reused elsewhere
//     };
//   } catch (error) {
//     console.error('Error generating GitHub usage report:', error);
//     throw error;
//   }
// }

// /**
//  * Validate GitHub linking request
//  * @param {string} githubId - GitHub ID to validate
//  * @param {string} requestingUserId - User trying to link the GitHub account
//  * @returns {Promise<Object>} - Validation result
//  */
// async function validateGithubLinking(githubId, requestingUserId) {
//   try {
//     const usage = await checkGithubIdUsage(githubId);
    
//     if (!usage.isUsed) {
//       return {
//         canLink: true,
//         reason: 'GitHub ID is available'
//       };
//     }

//     if (usage.userId.toString() === requestingUserId) {
//       if (usage.currentlyLinked) {
//         return {
//           canLink: false,
//           reason: 'GitHub account is already linked to your account'
//         };
//       } else {
//         return {
//           canLink: true,
//           reason: 'Re-linking your own previously used GitHub account'
//         };
//       }
//     }

//     return {
//       canLink: false,
//       reason: 'GitHub account has been used by another user and cannot be reused'
//     };
    
//   } catch (error) {
//     console.error('Error validating GitHub linking:', error);
//     return {
//       canLink: false,
//       reason: 'Validation error occurred'
//     };
//   }
// }

// module.exports = {
//   checkGithubIdUsage,
//   getUserGithubHistory,
//   cleanupOrphanedGithubAuths,
//   generateGithubUsageReport,
//   validateGithubLinking
// };



//routes/githubAuth.js
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const User = require('../models/User');
const GitHubAuth = require('../models/GitHubAuth');
const TwoFA = require('../models/TwoFA');
const Session = require('../models/Session');
const authMiddleware = require('../middleware/auth');
const UAParser = require('ua-parser-js');
const { sendLoginSuccessEmail, sendSuspiciousLoginAlert, sendGithubLinkedEmail, sendGithubUnlinkedEmail } = require('../utils/sendEmail');
const sendWelcomeEmail = require('../utils/sendWelcomeEmail');
const DeletedAccount = require('../models/DeletedAccounts');
const router = express.Router();

// FIXED: Enhanced helper function to get real client IP
const getClientIp = (req) => {
  // Get the raw IP first
  let ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.ip;

  // Handle IPv6 loopback and local addresses
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    // In development, you might want to use a default IP or get real IP differently
    // For production behind reverse proxy, this should be handled by x-forwarded-for
    ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '127.0.0.1';
  }

  // Clean IPv6 mapped IPv4 addresses (::ffff:192.168.1.1 -> 192.168.1.1)
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  return ip || '127.0.0.1'; // fallback
};

// NEW: Helper function to check if GitHub ID is in deleted accounts
const checkGithubInDeletedAccounts = async (githubId) => {
  try {
    const deletedAccount = await DeletedAccount.findOne({
      'githubIdHistory.githubId': githubId.toString()
    });
    
    if (deletedAccount) {
      // Find the specific GitHub entry in the history
      const githubEntry = deletedAccount.githubIdHistory.find(
        entry => entry.githubId === githubId.toString()
      );
      
      return {
        isDeleted: true,
        deletedAccount,
        githubEntry,
        deletedAt: deletedAccount.deletedAt,
        originalEmail: deletedAccount.email
      };
    }
    
    return { isDeleted: false };
  } catch (error) {
    console.error('Error checking GitHub in deleted accounts:', error);
    throw error;
  }
};

/**
 * Step 1: Redirect user to GitHub for authentication (NEW ACCOUNTS/SIGNIN)
 */
router.get('/login', (req, res) => {
  const state = req.query.state || '';
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/github/callback`;
  const githubAuthUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=user:email` +
    `&state=${encodeURIComponent(state)}`;
  res.redirect(githubAuthUrl);
});

/**
 * Step 2: GitHub callback with enhanced GitHub ID tracking and deleted account checks
 */
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).json({ message: 'No code provided' });
  }

  try {
    const clientIp = getClientIp(req);
    const parser = new UAParser(req.headers['user-agent'] || '');
    const deviceInfo = {
      browser: parser.getBrowser().name || 'Unknown',
      os: parser.getOS().name || 'Unknown',
      device: parser.getDevice().model || 'Desktop',
      isMobile: parser.getDevice().type === 'mobile'
    };

    // Exchange code for access token
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error('No access token received from GitHub');

    // Get user info from GitHub
    const githubUserRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` }
    });

    const githubUser = githubUserRes.data;

    // Get user's primary email
    let primaryEmail = null;
    try {
      const emailRes = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `token ${accessToken}` }
      });
      const primary = emailRes.data.find(e => e.primary && e.verified);
      if (primary) primaryEmail = primary.email;
    } catch (err) {
      console.warn('Unable to fetch GitHub email:', err.message);
    }

    if (!primaryEmail && githubUser.email) {
      primaryEmail = githubUser.email;
    }

    if (!primaryEmail) {
      return res.status(400).json({ 
        message: 'Unable to get verified email from GitHub. Please make sure your GitHub email is verified and visible.' 
      });
    }

    // NEW: Check if GitHub ID is in deleted accounts FIRST
    const deletedCheck = await checkGithubInDeletedAccounts(githubUser.id);
    if (deletedCheck.isDeleted) {
      console.log('GitHub ID found in deleted accounts:', githubUser.id, 'from email:', deletedCheck.originalEmail);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      // FIXED: Always show error for deleted GitHub accounts, regardless of context
      return res.redirect(`${frontendUrl}/oauth-error?message=${encodeURIComponent('This GitHub account was previously associated with a deleted account and cannot be used to create new accounts or link to existing accounts.')}`);
    }

    let user;
    let isLinkingToExistingUser = false;

    // Check if state contains JWT (linking to existing user)
    if (state) {
      try {
        const decoded = jwt.verify(state, process.env.JWT_SECRET);
        user = await User.findById(decoded.user_id);
        if (user) {
          isLinkingToExistingUser = true;
          console.log('Linking GitHub to existing authenticated user:', user.email);
        }
      } catch (err) {
        console.warn('Invalid state token for linking:', err.message);
      }
    }

    // ENHANCED: Check if GitHub ID has EVER been used by ANY user
    const userWithGithubHistory = await User.findByGithubId(githubUser.id.toString());
    
    if (userWithGithubHistory) {
      if (isLinkingToExistingUser) {
        // User trying to link GitHub to their account
        if (userWithGithubHistory._id.toString() !== user._id.toString()) {
          // GitHub account was used by a DIFFERENT user (even if previously unlinked)
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          // FIXED: Redirect back to settings instead of login
          return res.redirect(`${frontendUrl}/settings?github=error&message=${encodeURIComponent('This GitHub account has been previously used and cannot be linked to another account.')}`);
        }
        
        // Same user re-linking their own GitHub account
        const currentGithubAuth = await GitHubAuth.findOne({ user: user._id });
        if (currentGithubAuth && currentGithubAuth.githubId !== githubUser.id.toString()) {
          // User has a different GitHub account currently linked
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          // FIXED: Redirect back to settings instead of login
          return res.redirect(`${frontendUrl}/settings?github=error&message=${encodeURIComponent('You already have a different GitHub account linked. Please unlink it first.')}`);
        }

        // Re-link the same GitHub account
        user.addGithubToHistory({
          githubId: githubUser.id.toString(),
          username: githubUser.login
        });
        await user.save();

        // Update GitHub auth record
        await GitHubAuth.findOneAndUpdate(
          { user: user._id },
          {
            githubId: githubUser.id.toString(),
            username: githubUser.login,
            email: primaryEmail,
            name: githubUser.name || githubUser.login,
            avatarUrl: githubUser.avatar_url,
            profileUrl: githubUser.html_url,
            accessToken,
            publicRepos: githubUser.public_repos || 0,
            followers: githubUser.followers || 0,
            following: githubUser.following || 0,
            lastSynced: new Date()
          },
          { upsert: true }
        );

        // ADDED: Send GitHub linked email notification
        try {
          await sendGithubLinkedEmail(user.email, user.name, githubUser.login, deviceInfo, clientIp);
          console.log('GitHub linked email sent successfully');
        } catch (emailError) {
          console.error('Failed to send GitHub linked email:', emailError);
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/settings?github=linked&success=true`);

      } else {
        // Regular OAuth flow - existing user logging in
        user = userWithGithubHistory;
        
        // Check if user's current GitHub ID matches
        const isCurrentlyLinked = user.githubIdHistory.some(
          entry => entry.githubId === githubUser.id.toString() && entry.isCurrentlyLinked
        );

        if (!isCurrentlyLinked) {
          // GitHub ID exists in history but not currently linked - re-link it
          user.addGithubToHistory({
            githubId: githubUser.id.toString(),
            username: githubUser.login
          });
          await user.save();
        }

        // Continue with normal login flow...
        const twoFA = await TwoFA.findOne({ userId: user._id });
        const has2FA = twoFA && twoFA.twoFactorEnabled;

        if (has2FA) {
          // 2FA flow
          const tempToken = jwt.sign({
            githubOAuth: true,
            userId: user._id,
            email: user.email,
            githubData: {
              githubId: githubUser.id.toString(),
              username: githubUser.login,
              name: githubUser.name || githubUser.login,
              avatarUrl: githubUser.avatar_url,
              profileUrl: githubUser.html_url,
              accessToken,
              publicRepos: githubUser.public_repos || 0,
              followers: githubUser.followers || 0,
              following: githubUser.following || 0
            },
            deviceInfo,
            clientIp
          }, process.env.JWT_SECRET, { expiresIn: '10m' });

          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          return res.redirect(`${frontendUrl}/oauth-2fa?tempToken=${tempToken}`);
        }

        // Complete login without 2FA
        user.lastLogin = new Date();
        user.lastLoginIp = clientIp;
        await user.save();

        // Update GitHub auth record
        await GitHubAuth.findOneAndUpdate(
          { user: user._id },
          {
            githubId: githubUser.id.toString(),
            username: githubUser.login,
            email: primaryEmail,
            name: githubUser.name || githubUser.login,
            avatarUrl: githubUser.avatar_url,
            profileUrl: githubUser.html_url,
            accessToken,
            publicRepos: githubUser.public_repos || 0,
            followers: githubUser.followers || 0,
            following: githubUser.following || 0,
            lastSynced: new Date()
          },
          { upsert: true }
        );

        const sessionId = crypto.randomBytes(32).toString('hex');
        await Session.create({
          userId: user._id,
          sessionId,
          userAgent: req.headers['user-agent'] || 'Unknown',
          ipAddress: clientIp,
          deviceInfo
        });

        const tokenPayload = {
          userId: user._id,
          user_id: user._id,
          sessionId,
          email: user.email
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

        try {
          await sendLoginSuccessEmail(user.email, user.name, deviceInfo, clientIp);
        } catch (emailError) {
          console.error('Failed to send GitHub login success email:', emailError);
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=login`);
      }
    }

    // NEW USER CREATION or LINKING NEW GITHUB
    if (isLinkingToExistingUser) {
      // LINKING CASE: User linking a completely new GitHub account
      console.log('Linking new GitHub account to existing user:', user.email);
      
      // Check if user already has a currently linked GitHub account
      if (user.githubId) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/settings?github=error&message=${encodeURIComponent('You already have a GitHub account linked. Please unlink it first before linking a new one.')}`);
      }

      // Add new GitHub to history and set as current
      user.addGithubToHistory({
        githubId: githubUser.id.toString(),
        username: githubUser.login
      });
      await user.save();

      // Create GitHub auth record
      await GitHubAuth.create({
        user: user._id,
        githubId: githubUser.id.toString(),
        username: githubUser.login,
        email: primaryEmail,
        name: githubUser.name || githubUser.login,
        avatarUrl: githubUser.avatar_url,
        profileUrl: githubUser.html_url,
        accessToken,
        publicRepos: githubUser.public_repos || 0,
        followers: githubUser.followers || 0,
        following: githubUser.following || 0,
        lastSynced: new Date()
      });

      console.log('New GitHub account successfully linked to existing user');

      // ADDED: Send GitHub linked email notification
      try {
        await sendGithubLinkedEmail(user.email, user.name, githubUser.login, deviceInfo, clientIp);
        console.log('GitHub linked email sent successfully');
      } catch (emailError) {
        console.error('Failed to send GitHub linked email:', emailError);
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/settings?github=linked&success=true`);

    } else {
      // Check if email already exists (user trying to use GitHub with existing email)
      const existingUserByEmail = await User.findOne({ email: primaryEmail });
      if (existingUserByEmail) {
        // User exists by email - link GitHub to existing account
        user = existingUserByEmail;
        
        // Add GitHub to history
        user.addGithubToHistory({
          githubId: githubUser.id.toString(),
          username: githubUser.login
        });
        user.lastLogin = new Date();
        user.lastLoginIp = clientIp;
        await user.save();

        // Create/update GitHub auth record
        await GitHubAuth.findOneAndUpdate(
          { user: user._id },
          {
            githubId: githubUser.id.toString(),
            username: githubUser.login,
            email: primaryEmail,
            name: githubUser.name || githubUser.login,
            avatarUrl: githubUser.avatar_url,
            profileUrl: githubUser.html_url,
            accessToken,
            publicRepos: githubUser.public_repos || 0,
            followers: githubUser.followers || 0,
            following: githubUser.following || 0,
            lastSynced: new Date()
          },
          { upsert: true }
        );

        // Continue with normal login flow (2FA check, etc.)
        const twoFA = await TwoFA.findOne({ userId: user._id });
        const has2FA = twoFA && twoFA.twoFactorEnabled;

        if (has2FA) {
          const tempToken = jwt.sign({
            githubOAuth: true,
            userId: user._id,
            email: user.email,
            githubData: {
              githubId: githubUser.id.toString(),
              username: githubUser.login,
              name: githubUser.name || githubUser.login,
              avatarUrl: githubUser.avatar_url,
              profileUrl: githubUser.html_url,
              accessToken,
              publicRepos: githubUser.public_repos || 0,
              followers: githubUser.followers || 0,
              following: githubUser.following || 0
            },
            deviceInfo,
            clientIp
          }, process.env.JWT_SECRET, { expiresIn: '10m' });

          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          return res.redirect(`${frontendUrl}/oauth-2fa?tempToken=${tempToken}`);
        }

        // Complete login
        const sessionId = crypto.randomBytes(32).toString('hex');
        await Session.create({
          userId: user._id,
          sessionId,
          userAgent: req.headers['user-agent'] || 'Unknown',
          ipAddress: clientIp,
          deviceInfo
        });

        const tokenPayload = {
          userId: user._id,
          user_id: user._id,
          sessionId,
          email: user.email
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

        try {
          await sendLoginSuccessEmail(user.email, user.name, deviceInfo, clientIp);
        } catch (emailError) {
          console.error('Failed to send GitHub login success email:', emailError);
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=login`);

      } else {
        // BRAND NEW USER CREATION
        console.log('Creating new user for GitHub OAuth:', primaryEmail);
        
        // FIXED: Check if the email is in deleted accounts and show error instead of redirecting to login
        const deletedByEmail = await DeletedAccount.findOne({ email: primaryEmail });
        if (deletedByEmail) {
          console.log('Email found in deleted accounts, preventing new account creation:', primaryEmail);
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          return res.redirect(`${frontendUrl}/oauth-error?message=${encodeURIComponent('This email address was previously associated with a deleted account and cannot be used to create new accounts.')}`);
        }
        
        user = await User.create({
          name: githubUser.name || githubUser.login,
          email: primaryEmail,
          isVerified: true,
          role: 1,
          isActive: true,
          lastLogin: new Date(),
          createdIp: clientIp,
          lastLoginIp: clientIp,
          // Initialize with GitHub ID and history
          githubId: githubUser.id.toString(),
          githubIdHistory: [{
            githubId: githubUser.id.toString(),
            username: githubUser.login,
            linkedAt: new Date(),
            unlinkedAt: null,
            isCurrentlyLinked: true
          }]
        });

        console.log('New user created via GitHub OAuth with ID history:', user._id);

        // Create GitHub auth record
        await GitHubAuth.create({
          user: user._id,
          githubId: githubUser.id.toString(),
          username: githubUser.login,
          email: primaryEmail,
          name: githubUser.name || githubUser.login,
          avatarUrl: githubUser.avatar_url,
          profileUrl: githubUser.html_url,
          accessToken,
          publicRepos: githubUser.public_repos || 0,
          followers: githubUser.followers || 0,
          following: githubUser.following || 0,
          lastSynced: new Date()
        });

        try {
          await sendWelcomeEmail(user.email, user.name);
        } catch (emailError) {
          console.error('Failed to send GitHub signup welcome email:', emailError);
        }

        const sessionId = crypto.randomBytes(32).toString('hex');
        await Session.create({
          userId: user._id,
          sessionId,
          userAgent: req.headers['user-agent'] || 'Unknown',
          ipAddress: clientIp,
          deviceInfo
        });

        const tokenPayload = {
          userId: user._id,
          user_id: user._id,
          sessionId,
          email: user.email
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=signup`);
      }
    }

  } catch (err) {
    console.error('GitHub OAuth error:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/oauth-error?message=${encodeURIComponent('GitHub authentication failed')}`);
  }
});

/**
 * Step 3: FIXED - Return auth URL instead of redirecting
 */
router.get('/link', authMiddleware, async (req, res) => {
  try {
    // Create state token with the authenticated user's ID
    const state = jwt.sign({ user_id: req.user.user_id }, process.env.JWT_SECRET, {
      expiresIn: '10m'
    });
    
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/github/callback`;
    const githubAuthUrl =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=user:email` +
      `&state=${encodeURIComponent(state)}`;
      
    console.log('Generating GitHub auth URL for authenticated user:', req.user.user_id);

    // Return the auth URL instead of redirecting
    res.json({ 
      authUrl: githubAuthUrl,
      message: 'GitHub auth URL generated successfully'
    });
    
  } catch (error) {
    console.error('Error generating GitHub auth URL:', error);
    res.status(500).json({ message: 'Failed to generate GitHub auth URL' });
  }
});

/**
 * Step 4: UPDATED - Unlink GitHub with email notification
 */
router.delete('/unlink', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const clientIp = getClientIp(req);
    const parser = new UAParser(req.headers['user-agent'] || '');
    const deviceInfo = {
      browser: parser.getBrowser().name || 'Unknown',
      os: parser.getOS().name || 'Unknown',
      device: parser.getDevice().model || 'Desktop',
      isMobile: parser.getDevice().type === 'mobile'
    };
    
    // Get user to update GitHub history
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get current GitHub auth for logging
    const githubAuth = await GitHubAuth.findOne({ user: userId });
    
    if (githubAuth) {
      console.log('Unlinking GitHub account:', githubAuth.username, 'from user:', userId);
      
      // Store GitHub username for email notification
      const githubUsername = githubAuth.username;
      
      // Update user's GitHub history (mark as unlinked but keep the ID)
      user.unlinkCurrentGithub();
      await user.save();
      
      // Remove GitHub auth record (but ID stays in user's history)
      await GitHubAuth.findOneAndDelete({ user: userId });
      
      // ADDED: Send GitHub unlinked email notification
      try {
        await sendGithubUnlinkedEmail(user.email, user.name, githubUsername, deviceInfo, clientIp);
        console.log('GitHub unlinked email sent successfully');
      } catch (emailError) {
        console.error('Failed to send GitHub unlinked email:', emailError);
      }
      
      console.log('GitHub account unlinked successfully, ID preserved in history for user:', userId);
      res.json({ 
        message: 'GitHub account unlinked successfully',
        preservedInHistory: true
      });
    } else {
      res.status(404).json({ message: 'No GitHub account found to unlink' });
    }
  } catch (err) {
    console.error('GitHub unlink error:', err);
    res.status(500).json({ message: 'Failed to unlink GitHub account' });
  }
});

/**
 * Step 5: Get GitHub auth status with history info
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const githubAuth = await GitHubAuth.findOne({ user: userId });
    const user = await User.findById(userId);
    
    if (githubAuth) {
      res.json({
        isLinked: true,
        github: {
          username: githubAuth.username,
          name: githubAuth.name,
          email: githubAuth.email,
          avatarUrl: githubAuth.avatarUrl,
          profileUrl: githubAuth.profileUrl,
          publicRepos: githubAuth.publicRepos || 0,
          followers: githubAuth.followers || 0,
          following: githubAuth.following || 0,
          lastSynced: githubAuth.lastSynced
        },
        // Include history information (optional - you might not want to expose this to frontend)
        githubHistory: user?.githubIdHistory?.length || 0
      });
    } else {
      res.json({ 
        isLinked: false, 
        github: null,
        githubHistory: user?.githubIdHistory?.length || 0
      });
    }
  } catch (err) {
    console.error('GitHub status error:', err);
    res.status(500).json({ message: 'Failed to get GitHub status' });
  }
});

/**
 * NEW: Admin route to view GitHub ID usage (optional)
 */
router.get('/admin/github-usage/:githubId', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin (assuming role 2+ is admin)
    const user = await User.findById(req.user.user_id);
    if (!user || user.role < 2) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const githubId = req.params.githubId;
    
    // Check in active users
    const userWithGithub = await User.findByGithubId(githubId);
    
    // Check in deleted accounts
    const deletedCheck = await checkGithubInDeletedAccounts(githubId);
    
    if (userWithGithub) {
      const githubEntry = userWithGithub.githubIdHistory.find(
        entry => entry.githubId === githubId
      );
      
      res.json({
        used: true,
        status: 'active',
        userId: userWithGithub._id,
        userEmail: userWithGithub.email,
        githubInfo: githubEntry,
        isCurrentlyLinked: githubEntry?.isCurrentlyLinked || false
      });
    } else if (deletedCheck.isDeleted) {
      res.json({
        used: true,
        status: 'deleted',
        deletedAt: deletedCheck.deletedAt,
        originalEmail: deletedCheck.originalEmail,
        githubInfo: deletedCheck.githubEntry
      });
    } else {
      res.json({ used: false, status: 'available' });
    }
    
  } catch (err) {
    console.error('GitHub usage check error:', err);
    res.status(500).json({ message: 'Failed to check GitHub usage' });
  }
});

/**
 * Step 6: Handle 2FA verification for GitHub OAuth users (unchanged)
 */
router.post('/verify-2fa', async (req, res) => {
  try {
    const { tempToken, twoFactorCode } = req.body;

    if (!tempToken || !twoFactorCode) {
      return res.status(400).json({ message: 'Temporary token and 2FA code are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired temporary token' });
    }

    if (!decoded.githubOAuth) {
      return res.status(400).json({ message: 'Invalid temporary token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const twoFA = await TwoFA.findOne({ userId: user._id });
    if (!twoFA || !twoFA.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled for this account' });
    }

    // Verify 2FA code
    let isValidCode = false;
    let usedBackupCode = null;

    // Check backup codes first
    for (let backupCode of twoFA.twoFactorBackupCodes) {
      if (!backupCode.used && backupCode.code === twoFactorCode.toUpperCase()) {
        backupCode.used = true;
        backupCode.usedAt = new Date();
        await twoFA.save();
        isValidCode = true;
        usedBackupCode = backupCode.code;
        break;
      }
    }

    // If not a backup code, verify TOTP
    if (!isValidCode) {
      isValidCode = speakeasy.totp.verify({
        secret: twoFA.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });
    }

    if (!isValidCode) {
      return res.status(400).json({ 
        message: 'Invalid two-factor authentication code. Please try again.' 
      });
    }

    // 2FA verification successful - complete the GitHub OAuth login
    const { githubData, deviceInfo, clientIp } = decoded;

    // Update user's GitHub history and current info
    user.addGithubToHistory({
      githubId: githubData.githubId,
      username: githubData.username
    });
    user.lastLogin = new Date();
    user.lastLoginIp = clientIp;
    await user.save();

    // Update GitHub auth record
    await GitHubAuth.findOneAndUpdate(
      { user: user._id },
      {
        githubId: githubData.githubId,
        username: githubData.username,
        name: githubData.name,
        avatarUrl: githubData.avatarUrl,
        profileUrl: githubData.profileUrl,
        accessToken: githubData.accessToken,
        publicRepos: githubData.publicRepos,
        followers: githubData.followers,
        following: githubData.following,
        lastSynced: new Date()
      },
      { upsert: true }
    );

    // Generate session
    const sessionId = crypto.randomBytes(32).toString('hex');
    await Session.create({
      userId: user._id,
      sessionId,
      userAgent: deviceInfo.browser || 'Unknown',
      ipAddress: clientIp,
      deviceInfo
    });

    // Generate final JWT token
    const tokenPayload = {
      userId: user._id,
      user_id: user._id,
      sessionId,
      email: user.email
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send login success email
    try {
      await sendLoginSuccessEmail(
        user.email,
        user.name,
        deviceInfo,
        clientIp
      );
      console.log('GitHub OAuth 2FA login success email sent');
    } catch (emailError) {
      console.error('Failed to send GitHub OAuth 2FA login success email:', emailError);
    }

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        company: user.company,
        role: user.role,
        isOnboardingComplete: user.isOnboardingComplete
      },
      message: 'GitHub OAuth with 2FA verification successful',
      usedBackupCode
    });

  } catch (error) {
    console.error('GitHub OAuth 2FA verification error:', error);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
});

module.exports = router;