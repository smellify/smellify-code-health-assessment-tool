// //routes/githubAuth.js
// const express = require('express');
// const axios = require('axios');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// const User = require('../models/User');
// const GitHubAuth = require('../models/GitHubAuth');
// const Session = require('../models/Session'); // Add this import
// const authMiddleware = require('../middleware/auth');
// const UAParser = require('ua-parser-js'); // Add this import if not already present
// const { sendLoginSuccessEmail, sendSuspiciousLoginAlert } = require('../utils/sendEmail');
// const sendWelcomeEmail = require('../utils/sendWelcomeEmail');

// const router = express.Router();

// // Helper function to get client IP (consistent with your other routes)
// const getClientIp = (req) => {
//   return req.headers['x-forwarded-for']?.split(',')[0] || 
//          req.headers['x-real-ip'] || 
//          req.connection.remoteAddress || 
//          req.socket.remoteAddress ||
//          (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
//          req.ip;
// };

// /**
//  * Step 1: Redirect user to GitHub for authentication
//  */
// router.get('/login', (req, res) => {
//   const state = req.query.state || ''; // can hold JWT for linking
//   const clientId = process.env.GITHUB_CLIENT_ID;
//   const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/github/callback`;
//   const githubAuthUrl =
//     `https://github.com/login/oauth/authorize` +
//     `?client_id=${clientId}` +
//     `&redirect_uri=${encodeURIComponent(redirectUri)}` +
//     `&scope=user:email` +
//     `&state=${encodeURIComponent(state)}`;
//   res.redirect(githubAuthUrl);
// });

// /**
//  * Step 2: GitHub redirects back here with ?code=...&state=...
//  */
// router.get('/callback', async (req, res) => {
//   const { code, state } = req.query;

//   if (!code) {
//     return res.status(400).json({ message: 'No code provided' });
//   }

//   try {
//     // Get client IP using consistent helper
//     const clientIp = getClientIp(req);
    
//     // Parse user agent for device info
//     const parser = new UAParser(req.headers['user-agent'] || '');
//     const deviceInfo = {
//       browser: parser.getBrowser().name || 'Unknown',
//       os: parser.getOS().name || 'Unknown',
//       device: parser.getDevice().model || 'Desktop',
//       isMobile: parser.getDevice().type === 'mobile'
//     };

//     // 1. Exchange code for access token
//     const tokenRes = await axios.post(
//       'https://github.com/login/oauth/access_token',
//       {
//         client_id: process.env.GITHUB_CLIENT_ID,
//         client_secret: process.env.GITHUB_CLIENT_SECRET,
//         code
//       },
//       { headers: { Accept: 'application/json' } }
//     );

//     const accessToken = tokenRes.data.access_token;
//     if (!accessToken) throw new Error('No access token received from GitHub');

//     // 2. Get user info from GitHub
//     const githubUserRes = await axios.get('https://api.github.com/user', {
//       headers: { Authorization: `token ${accessToken}` }
//     });

//     const githubUser = githubUserRes.data;

//     // 3. Get user's primary email
//     let primaryEmail = null;
//     try {
//       const emailRes = await axios.get('https://api.github.com/user/emails', {
//         headers: { Authorization: `token ${accessToken}` }
//       });
//       const primary = emailRes.data.find(e => e.primary && e.verified);
//       if (primary) primaryEmail = primary.email;
//     } catch (err) {
//       console.warn('Unable to fetch GitHub email:', err.message);
//     }

//     // Fallback if email is public in profile
//     if (!primaryEmail && githubUser.email) {
//       primaryEmail = githubUser.email;
//     }

//     if (!primaryEmail) {
//       return res.status(400).json({ 
//         message: 'Unable to get verified email from GitHub. Please make sure your GitHub email is verified and visible.' 
//       });
//     }

//     let user;
//     let isLinkingToExistingUser = false;

//     // 4. If state contains JWT, we're linking to existing user
//     if (state) {
//       try {
//         const decoded = jwt.verify(state, process.env.JWT_SECRET);
//         user = await User.findById(decoded.user_id);
//         if (user) {
//           isLinkingToExistingUser = true;
//           console.log('Linking GitHub to existing user:', user.email);
//         }
//       } catch (err) {
//         console.warn('Invalid state token:', err.message);
//       }
//     }

//     // 5. Check if GitHub account is already linked
//     const existingGithubAuth = await GitHubAuth.findOne({ githubId: githubUser.id.toString() });
    
//     if (existingGithubAuth) {
//       // GitHub account already exists
//       if (isLinkingToExistingUser) {
//         // User trying to link GitHub to their account, but GitHub is already linked to someone else
//         if (existingGithubAuth.user.toString() !== user._id.toString()) {
//           return res.status(400).json({ 
//             message: 'This GitHub account is already linked to another user account.' 
//           });
//         }
//         // Already linked to same user - just redirect
//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/settings?github=already-linked&success=true`);
//       } else {
//         // User trying to sign in/up with GitHub - find the existing user and log them in
//         user = await User.findById(existingGithubAuth.user);
//         if (!user) {
//           // User was deleted but GitHub auth still exists - clean up and create new
//           await GitHubAuth.findOneAndDelete({ githubId: githubUser.id.toString() });
//         } else {
//           // Existing user found - log them in
//           user.lastLogin = new Date();
//           user.lastLoginIp = clientIp; // Use consistent IP helper
//           await user.save();

//           // Update GitHub auth with latest info
//           await GitHubAuth.findOneAndUpdate(
//             { user: user._id },
//             {
//               username: githubUser.login,
//               name: githubUser.name || githubUser.login,
//               avatarUrl: githubUser.avatar_url,
//               profileUrl: githubUser.html_url,
//               accessToken,
//               publicRepos: githubUser.public_repos || 0,
//               followers: githubUser.followers || 0,
//               following: githubUser.following || 0,
//               lastSynced: new Date()
//             }
//           );

//           // Generate unique session ID
//           const sessionId = crypto.randomBytes(32).toString('hex');
          
//           // Create session record (consistent with regular login)
//           await Session.create({
//             userId: user._id,
//             sessionId,
//             userAgent: req.headers['user-agent'] || 'Unknown',
//             ipAddress: clientIp,
//             deviceInfo
//           });

//           // Generate JWT with session ID (consistent with regular login)
//           const tokenPayload = {
//             userId: user._id,
//             user_id: user._id, // Keep for backward compatibility
//             sessionId,
//             email: user.email
//           };

//           const token = jwt.sign(
//             tokenPayload,
//             process.env.JWT_SECRET,
//             { expiresIn: '7d' } // Match regular login expiry
//           );

//           // Send login success email for existing user login via GitHub
//           try {
//             await sendLoginSuccessEmail(
//               user.email,
//               user.name,
//               deviceInfo,
//               clientIp
//             );
//             console.log('GitHub login success email sent');
//           } catch (emailError) {
//             console.error('Failed to send GitHub login success email:', emailError);
//             // Don't fail the login process if email fails
//           }

//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//           return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=login`);
//         }
//       }
//     }

//     // 6. If no user from state, check by email or create new user
//     if (!user) {
//       // Check if user exists by email
//       user = await User.findOne({ email: primaryEmail });
      
//       if (user) {
//         // User exists with this email - link GitHub account
//         console.log('Found existing user by email, linking GitHub:', user.email);
//         if (!user.githubId) {
//           user.githubId = githubUser.id.toString();
//         }
//         if (!user.name && githubUser.name) {
//           user.name = githubUser.name;
//         }
//         user.lastLogin = new Date();
//         user.lastLoginIp = clientIp; // Use consistent IP helper
//         await user.save();

//         // Send login success email for existing user linking GitHub
//         try {
//           await sendLoginSuccessEmail(
//             user.email,
//             user.name,
//             deviceInfo,
//             clientIp
//           );
//           console.log('GitHub linking login success email sent');
//         } catch (emailError) {
//           console.error('Failed to send GitHub linking login success email:', emailError);
//           // Don't fail the process if email fails
//         }
//       } else {
//         // Create new user for GitHub signup
//         console.log('Creating new user for GitHub OAuth:', primaryEmail);
//         user = await User.create({
//           name: githubUser.name || githubUser.login,
//           email: primaryEmail,
//           isVerified: true, // GitHub emails are considered verified
//           role: 1, // Default user role
//           githubId: githubUser.id.toString(),
//           isActive: true,
//           lastLogin: new Date(),
//           createdIp: clientIp, // Use consistent IP helper
//           lastLoginIp: clientIp // Set initial login IP
//         });
//         console.log('New user created:', user._id);

//         // Send welcome email for new user created via GitHub
//         try {
//           await sendWelcomeEmail(user.email, user.name);
//           console.log('GitHub signup welcome email sent');
//         } catch (emailError) {
//           console.error('Failed to send GitHub signup welcome email:', emailError);
//           // Don't fail the signup process if email fails
//         }
//       }
//     } else {
//       // Update existing user's login info (for linking case)
//       user.lastLogin = new Date();
//       user.lastLoginIp = clientIp; // Use consistent IP helper
//       if (!user.githubId) {
//         user.githubId = githubUser.id.toString();
//       }
//       await user.save();
//     }

//     // 7. Create or update GitHubAuth record
//     console.log('Creating/updating GitHubAuth for user:', user._id);
//     const githubAuthData = {
//       user: user._id,
//       githubId: githubUser.id.toString(),
//       username: githubUser.login,
//       email: primaryEmail,
//       name: githubUser.name || githubUser.login,
//       avatarUrl: githubUser.avatar_url,
//       profileUrl: githubUser.html_url,
//       accessToken,
//       publicRepos: githubUser.public_repos || 0,
//       followers: githubUser.followers || 0,
//       following: githubUser.following || 0,
//       lastSynced: new Date()
//     };

//     await GitHubAuth.findOneAndUpdate(
//       { user: user._id },
//       githubAuthData,
//       { upsert: true, new: true }
//     );

//     console.log('GitHubAuth record created/updated for user:', user._id);

//     // 8. Generate unique session ID for new sessions
//     const sessionId = crypto.randomBytes(32).toString('hex');
    
//     // Create session record (consistent with regular login)
//     await Session.create({
//       userId: user._id,
//       sessionId,
//       userAgent: req.headers['user-agent'] || 'Unknown',
//       ipAddress: clientIp,
//       deviceInfo
//     });

//     // 9. Generate JWT for the frontend with consistent payload
//     const tokenPayload = {
//       userId: user._id,
//       user_id: user._id, // Keep for backward compatibility
//       sessionId,
//       email: user.email
//     };

//     const token = jwt.sign(
//       tokenPayload,
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' } // Match regular login expiry
//     );

//     // Send appropriate email notification
//     try {
//       if (isLinkingToExistingUser) {
//         // For linking case, send suspicious login alert (since it's a new OAuth connection)
//         await sendSuspiciousLoginAlert(
//           user.email,
//           user.name,
//           deviceInfo,
//           clientIp
//         );
//         console.log('GitHub linking suspicious login alert sent');
//       } else {
//         // For regular login/signup via GitHub, send login success email
//         await sendLoginSuccessEmail(
//           user.email,
//           user.name,
//           deviceInfo,
//           clientIp
//         );
//         console.log('GitHub OAuth login success email sent');
//       }
//     } catch (emailError) {
//       console.error('Failed to send GitHub OAuth email notification:', emailError);
//       // Don't fail the OAuth process if email fails
//     }

//     // 10. Redirect to frontend with token
//     const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//     const redirectUrl = isLinkingToExistingUser 
//       ? `${frontendUrl}/settings?github=linked&success=true`
//       : `${frontendUrl}/oauth-success?token=${token}&type=signup`;
    
//     res.redirect(redirectUrl);

//   } catch (err) {
//     console.error('GitHub OAuth error:', err);
//     const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//     res.redirect(`${frontendUrl}/oauth-error?message=${encodeURIComponent('GitHub authentication failed')}`);
//   }
// });

// /**
//  * Step 3: Linking GitHub from logged-in profile
//  */
// router.get('/link', authMiddleware, (req, res) => {
//   const state = jwt.sign({ user_id: req.user.user_id }, process.env.JWT_SECRET, {
//     expiresIn: '5m'
//   });
//   const clientId = process.env.GITHUB_CLIENT_ID;
//   const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/github/callback`;
//   const githubAuthUrl =
//     `https://github.com/login/oauth/authorize` +
//     `?client_id=${clientId}` +
//     `&redirect_uri=${encodeURIComponent(redirectUri)}` +
//     `&scope=user:email` +
//     `&state=${encodeURIComponent(state)}`;
//   res.redirect(githubAuthUrl);
// });

// /**
//  * Step 4: Unlink GitHub from user account
//  */
// router.delete('/unlink', authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user.user_id;
    
//     // Remove GitHub auth record
//     await GitHubAuth.findOneAndDelete({ user: userId });
    
//     // Remove GitHub ID from user record
//     await User.findByIdAndUpdate(userId, { $unset: { githubId: 1 } });
    
//     res.json({ message: 'GitHub account unlinked successfully' });
//   } catch (err) {
//     console.error('GitHub unlink error:', err);
//     res.status(500).json({ message: 'Failed to unlink GitHub account' });
//   }
// });

// /**
//  * Step 5: Get GitHub auth status
//  */
// router.get('/status', authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user.user_id;
//     const githubAuth = await GitHubAuth.findOne({ user: userId });
    
//     if (githubAuth) {
//       res.json({
//         isLinked: true,
//         github: {
//           username: githubAuth.username,
//           name: githubAuth.name,
//           avatarUrl: githubAuth.avatarUrl,
//           profileUrl: githubAuth.profileUrl,
//           publicRepos: githubAuth.publicRepos,
//           followers: githubAuth.followers,
//           following: githubAuth.following,
//           lastSynced: githubAuth.lastSynced
//         }
//       });
//     } else {
//       res.json({ isLinked: false });
//     }
//   } catch (err) {
//     console.error('GitHub status error:', err);
//     res.status(500).json({ message: 'Failed to get GitHub status' });
//   }
// });

// module.exports = router;






// //routes/githubAuth.js
// const express = require('express');
// const axios = require('axios');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// const speakeasy = require('speakeasy');
// const User = require('../models/User');
// const GitHubAuth = require('../models/GitHubAuth');
// const TwoFA = require('../models/TwoFA');
// const Session = require('../models/Session');
// const authMiddleware = require('../middleware/auth');
// const UAParser = require('ua-parser-js');
// const { sendLoginSuccessEmail, sendSuspiciousLoginAlert } = require('../utils/sendEmail');
// const sendWelcomeEmail = require('../utils/sendWelcomeEmail');

// const router = express.Router();

// // Helper function to get client IP (consistent with your other routes)
// const getClientIp = (req) => {
//   return req.headers['x-forwarded-for']?.split(',')[0] || 
//          req.headers['x-real-ip'] || 
//          req.connection.remoteAddress || 
//          req.socket.remoteAddress ||
//          (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
//          req.ip;
// };

// /**
//  * Step 1: Redirect user to GitHub for authentication (NEW ACCOUNTS/SIGNIN)
//  */
// router.get('/login', (req, res) => {
//   const state = req.query.state || ''; // can hold JWT for linking
//   const clientId = process.env.GITHUB_CLIENT_ID;
//   const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/github/callback`;
//   const githubAuthUrl =
//     `https://github.com/login/oauth/authorize` +
//     `?client_id=${clientId}` +
//     `&redirect_uri=${encodeURIComponent(redirectUri)}` +
//     `&scope=user:email` +
//     `&state=${encodeURIComponent(state)}`;
//   res.redirect(githubAuthUrl);
// });

// /**
//  * Step 2: GitHub redirects back here with ?code=...&state=...
//  */
// router.get('/callback', async (req, res) => {
//   const { code, state } = req.query;

//   if (!code) {
//     return res.status(400).json({ message: 'No code provided' });
//   }

//   try {
//     // Get client IP using consistent helper
//     const clientIp = getClientIp(req);
    
//     // Parse user agent for device info
//     const parser = new UAParser(req.headers['user-agent'] || '');
//     const deviceInfo = {
//       browser: parser.getBrowser().name || 'Unknown',
//       os: parser.getOS().name || 'Unknown',
//       device: parser.getDevice().model || 'Desktop',
//       isMobile: parser.getDevice().type === 'mobile'
//     };

//     // 1. Exchange code for access token
//     const tokenRes = await axios.post(
//       'https://github.com/login/oauth/access_token',
//       {
//         client_id: process.env.GITHUB_CLIENT_ID,
//         client_secret: process.env.GITHUB_CLIENT_SECRET,
//         code
//       },
//       { headers: { Accept: 'application/json' } }
//     );

//     const accessToken = tokenRes.data.access_token;
//     if (!accessToken) throw new Error('No access token received from GitHub');

//     // 2. Get user info from GitHub
//     const githubUserRes = await axios.get('https://api.github.com/user', {
//       headers: { Authorization: `token ${accessToken}` }
//     });

//     const githubUser = githubUserRes.data;

//     // 3. Get user's primary email
//     let primaryEmail = null;
//     try {
//       const emailRes = await axios.get('https://api.github.com/user/emails', {
//         headers: { Authorization: `token ${accessToken}` }
//       });
//       const primary = emailRes.data.find(e => e.primary && e.verified);
//       if (primary) primaryEmail = primary.email;
//     } catch (err) {
//       console.warn('Unable to fetch GitHub email:', err.message);
//     }

//     // Fallback if email is public in profile
//     if (!primaryEmail && githubUser.email) {
//       primaryEmail = githubUser.email;
//     }

//     if (!primaryEmail) {
//       return res.status(400).json({ 
//         message: 'Unable to get verified email from GitHub. Please make sure your GitHub email is verified and visible.' 
//       });
//     }

//     let user;
//     let isLinkingToExistingUser = false;

//     // 4. FIXED: Check if state contains JWT (linking to existing user)
//     if (state) {
//       try {
//         const decoded = jwt.verify(state, process.env.JWT_SECRET);
//         user = await User.findById(decoded.user_id);
//         if (user) {
//           isLinkingToExistingUser = true;
//           console.log('Linking GitHub to existing authenticated user:', user.email);
//         }
//       } catch (err) {
//         console.warn('Invalid state token for linking:', err.message);
//         // Invalid state token - treat as regular OAuth flow
//       }
//     }

//     // 5. Check if GitHub account is already linked to ANY user
//     const existingGithubAuth = await GitHubAuth.findOne({ githubId: githubUser.id.toString() });
    
//     if (existingGithubAuth) {
//       // GitHub account already exists in our system
//       if (isLinkingToExistingUser) {
//         // User trying to link GitHub to their account, but GitHub is already linked
//         if (existingGithubAuth.user.toString() !== user._id.toString()) {
//           // GitHub account is linked to a DIFFERENT user
//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//           return res.redirect(`${frontendUrl}/settings?github=error&message=${encodeURIComponent('This GitHub account is already linked to another user account.')}`);
//         }
//         // GitHub account is already linked to the SAME user - success
//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/settings?github=already-linked&success=true`);
//       } else {
//         // Regular OAuth flow - user trying to sign in with existing GitHub account
//         user = await User.findById(existingGithubAuth.user);
//         if (!user) {
//           // User was deleted but GitHub auth still exists - clean up and create new
//           await GitHubAuth.findOneAndDelete({ githubId: githubUser.id.toString() });
//         } else {
//           // EXISTING USER LOGIN VIA GITHUB - Check for 2FA
//           const twoFA = await TwoFA.findOne({ userId: user._id });
//           const has2FA = twoFA && twoFA.twoFactorEnabled;

//           if (has2FA) {
//             // User has 2FA enabled - redirect to frontend with special flag for 2FA
//             const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            
//             // Create a temporary token that stores GitHub OAuth data for 2FA completion
//             const tempToken = jwt.sign({
//               githubOAuth: true,
//               userId: user._id,
//               email: user.email,
//               githubData: {
//                 githubId: githubUser.id.toString(),
//                 username: githubUser.login,
//                 name: githubUser.name || githubUser.login,
//                 avatarUrl: githubUser.avatar_url,
//                 profileUrl: githubUser.html_url,
//                 accessToken,
//                 publicRepos: githubUser.public_repos || 0,
//                 followers: githubUser.followers || 0,
//                 following: githubUser.following || 0
//               },
//               deviceInfo,
//               clientIp
//             }, process.env.JWT_SECRET, { expiresIn: '10m' });

//             return res.redirect(`${frontendUrl}/oauth-2fa?tempToken=${tempToken}`);
//           }

//           // No 2FA required - proceed with normal login
//           user.lastLogin = new Date();
//           user.lastLoginIp = clientIp;
//           await user.save();

//           // Update GitHub auth with latest info
//           await GitHubAuth.findOneAndUpdate(
//             { user: user._id },
//             {
//               username: githubUser.login,
//               name: githubUser.name || githubUser.login,
//               avatarUrl: githubUser.avatar_url,
//               profileUrl: githubUser.html_url,
//               accessToken,
//               publicRepos: githubUser.public_repos || 0,
//               followers: githubUser.followers || 0,
//               following: githubUser.following || 0,
//               lastSynced: new Date()
//             }
//           );

//           // Generate unique session ID
//           const sessionId = crypto.randomBytes(32).toString('hex');
          
//           // Create session record
//           await Session.create({
//             userId: user._id,
//             sessionId,
//             userAgent: req.headers['user-agent'] || 'Unknown',
//             ipAddress: clientIp,
//             deviceInfo
//           });

//           // Generate JWT with session ID
//           const tokenPayload = {
//             userId: user._id,
//             user_id: user._id,
//             sessionId,
//             email: user.email
//           };

//           const token = jwt.sign(
//             tokenPayload,
//             process.env.JWT_SECRET,
//             { expiresIn: '7d' }
//           );

//           // Send login success email for existing user login via GitHub
//           try {
//             await sendLoginSuccessEmail(
//               user.email,
//               user.name,
//               deviceInfo,
//               clientIp
//             );
//             console.log('GitHub existing user login success email sent');
//           } catch (emailError) {
//             console.error('Failed to send GitHub login success email:', emailError);
//           }

//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//           return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=login`);
//         }
//       }
//     }

//     // 6. FIXED: Handle new user creation or linking properly
//     if (isLinkingToExistingUser) {
//       // LINKING CASE: We have an authenticated user from state token
//       console.log('Linking new GitHub account to existing user:', user.email);
      
//       // Check if user already has a different GitHub account linked
//       const existingUserGithub = await GitHubAuth.findOne({ user: user._id });
//       if (existingUserGithub) {
//         // User already has a GitHub account linked
//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/settings?github=error&message=${encodeURIComponent('You already have a GitHub account linked. Please unlink it first before linking a new one.')}`);
//       }

//       // Update user's GitHub ID if not set
//       if (!user.githubId) {
//         user.githubId = githubUser.id.toString();
//         await user.save();
//       }

//       // Create new GitHub auth record for linking
//       await GitHubAuth.create({
//         user: user._id,
//         githubId: githubUser.id.toString(),
//         username: githubUser.login,
//         email: primaryEmail,
//         name: githubUser.name || githubUser.login,
//         avatarUrl: githubUser.avatar_url,
//         profileUrl: githubUser.html_url,
//         accessToken,
//         publicRepos: githubUser.public_repos || 0,
//         followers: githubUser.followers || 0,
//         following: githubUser.following || 0,
//         lastSynced: new Date()
//       });

//       console.log('GitHub account successfully linked to existing user');

//       // Send notification email for account linking
//       try {
//         await sendSuspiciousLoginAlert(
//           user.email,
//           user.name,
//           deviceInfo,
//           clientIp
//         );
//         console.log('GitHub linking notification email sent');
//       } catch (emailError) {
//         console.error('Failed to send GitHub linking notification email:', emailError);
//       }

//       const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//       return res.redirect(`${frontendUrl}/settings?github=linked&success=true`);

//     } else {
//       // REGULAR OAUTH FLOW: Check by email or create new user
//       user = await User.findOne({ email: primaryEmail });
      
//       if (user) {
//         // EXISTING USER BY EMAIL - Link GitHub to existing email-based account
//         console.log('Found existing user by email, linking GitHub:', user.email);
        
//         // Check if user already has a different GitHub account linked
//         const existingUserGithub = await GitHubAuth.findOne({ user: user._id });
//         if (existingUserGithub && existingUserGithub.githubId !== githubUser.id.toString()) {
//           // User has a different GitHub account already linked
//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//           return res.redirect(`${frontendUrl}/oauth-error?message=${encodeURIComponent('Your email is associated with a different GitHub account. Please use your existing GitHub account or contact support.')}`);
//         }

//         // Update user with GitHub info
//         if (!user.githubId) {
//           user.githubId = githubUser.id.toString();
//         }
//         if (!user.name && githubUser.name) {
//           user.name = githubUser.name;
//         }
//         user.lastLogin = new Date();
//         user.lastLoginIp = clientIp;
//         await user.save();

//         // Create/update GitHub auth record
//         await GitHubAuth.findOneAndUpdate(
//           { user: user._id },
//           {
//             githubId: githubUser.id.toString(),
//             username: githubUser.login,
//             email: primaryEmail,
//             name: githubUser.name || githubUser.login,
//             avatarUrl: githubUser.avatar_url,
//             profileUrl: githubUser.html_url,
//             accessToken,
//             publicRepos: githubUser.public_repos || 0,
//             followers: githubUser.followers || 0,
//             following: githubUser.following || 0,
//             lastSynced: new Date()
//           },
//           { upsert: true }
//         );

//         // Check for 2FA before completing login
//         const twoFA = await TwoFA.findOne({ userId: user._id });
//         const has2FA = twoFA && twoFA.twoFactorEnabled;

//         if (has2FA) {
//           // User has 2FA enabled - redirect to 2FA verification
//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          
//           const tempToken = jwt.sign({
//             githubOAuth: true,
//             userId: user._id,
//             email: user.email,
//             githubData: {
//               githubId: githubUser.id.toString(),
//               username: githubUser.login,
//               name: githubUser.name || githubUser.login,
//               avatarUrl: githubUser.avatar_url,
//               profileUrl: githubUser.html_url,
//               accessToken,
//               publicRepos: githubUser.public_repos || 0,
//               followers: githubUser.followers || 0,
//               following: githubUser.following || 0
//             },
//             deviceInfo,
//             clientIp
//           }, process.env.JWT_SECRET, { expiresIn: '10m' });

//           return res.redirect(`${frontendUrl}/oauth-2fa?tempToken=${tempToken}`);
//         }

//         // No 2FA - complete login
//         const sessionId = crypto.randomBytes(32).toString('hex');
        
//         await Session.create({
//           userId: user._id,
//           sessionId,
//           userAgent: req.headers['user-agent'] || 'Unknown',
//           ipAddress: clientIp,
//           deviceInfo
//         });

//         const tokenPayload = {
//           userId: user._id,
//           user_id: user._id,
//           sessionId,
//           email: user.email
//         };

//         const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

//         try {
//           await sendLoginSuccessEmail(user.email, user.name, deviceInfo, clientIp);
//           console.log('GitHub email-based login success email sent');
//         } catch (emailError) {
//           console.error('Failed to send GitHub login success email:', emailError);
//         }

//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=login`);

//       } else {
//         // NEW USER CREATION via GitHub OAuth
//         console.log('Creating new user for GitHub OAuth:', primaryEmail);
//         user = await User.create({
//           name: githubUser.name || githubUser.login,
//           email: primaryEmail,
//           isVerified: true, // GitHub emails are considered verified
//           role: 1, // Default user role
//           githubId: githubUser.id.toString(),
//           isActive: true,
//           lastLogin: new Date(),
//           createdIp: clientIp,
//           lastLoginIp: clientIp
//         });
//         console.log('New user created via GitHub OAuth:', user._id);

//         // Create GitHub auth record for new user
//         await GitHubAuth.create({
//           user: user._id,
//           githubId: githubUser.id.toString(),
//           username: githubUser.login,
//           email: primaryEmail,
//           name: githubUser.name || githubUser.login,
//           avatarUrl: githubUser.avatar_url,
//           profileUrl: githubUser.html_url,
//           accessToken,
//           publicRepos: githubUser.public_repos || 0,
//           followers: githubUser.followers || 0,
//           following: githubUser.following || 0,
//           lastSynced: new Date()
//         });

//         // Send welcome email for new user created via GitHub
//         try {
//           await sendWelcomeEmail(user.email, user.name);
//           console.log('GitHub signup welcome email sent');
//         } catch (emailError) {
//           console.error('Failed to send GitHub signup welcome email:', emailError);
//         }

//         // Create session for new user
//         const sessionId = crypto.randomBytes(32).toString('hex');
        
//         await Session.create({
//           userId: user._id,
//           sessionId,
//           userAgent: req.headers['user-agent'] || 'Unknown',
//           ipAddress: clientIp,
//           deviceInfo
//         });

//         // Generate JWT for new user
//         const tokenPayload = {
//           userId: user._id,
//           user_id: user._id,
//           sessionId,
//           email: user.email
//         };

//         const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=signup`);
//       }
//     }

//   } catch (err) {
//     console.error('GitHub OAuth error:', err);
//     const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//     res.redirect(`${frontendUrl}/oauth-error?message=${encodeURIComponent('GitHub authentication failed')}`);
//   }
// });

// /**
//  * Step 3: FIXED - Linking GitHub from logged-in profile (PROTECTED ROUTE)
//  */
// /**
//  * FIXED: GitHub linking from logged-in profile (PROTECTED ROUTE)
//  * Returns auth URL instead of redirecting
//  */
// router.get('/link', authMiddleware, (req, res) => {
//   try {
//     // Create state token with the authenticated user's ID
//     const state = jwt.sign({ user_id: req.user.user_id }, process.env.JWT_SECRET, {
//       expiresIn: '10m' // Time for user to complete OAuth flow
//     });
    
//     const clientId = process.env.GITHUB_CLIENT_ID;
//     const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/github/callback`;
//     const githubAuthUrl =
//       `https://github.com/login/oauth/authorize` +
//       `?client_id=${clientId}` +
//       `&redirect_uri=${encodeURIComponent(redirectUri)}` +
//       `&scope=user:email` +
//       `&state=${encodeURIComponent(state)}`;
      
//     console.log('Generating GitHub auth URL for authenticated user:', req.user.user_id);
    
//     // Return the auth URL instead of redirecting
//     res.json({ 
//       authUrl: githubAuthUrl,
//       message: 'GitHub auth URL generated successfully'
//     });
    
//   } catch (error) {
//     console.error('Error generating GitHub auth URL:', error);
//     res.status(500).json({ message: 'Failed to generate GitHub auth URL' });
//   }
// });

// /**
//  * Step 4: Unlink GitHub from user account
//  */
// router.delete('/unlink', authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user.user_id;
    
//     // Remove GitHub auth record
//     const deletedGithubAuth = await GitHubAuth.findOneAndDelete({ user: userId });
    
//     // Remove GitHub ID from user record
//     await User.findByIdAndUpdate(userId, { $unset: { githubId: 1 } });
    
//     if (deletedGithubAuth) {
//       console.log('GitHub account unlinked successfully for user:', userId);
//       res.json({ message: 'GitHub account unlinked successfully' });
//     } else {
//       res.status(404).json({ message: 'No GitHub account found to unlink' });
//     }
//   } catch (err) {
//     console.error('GitHub unlink error:', err);
//     res.status(500).json({ message: 'Failed to unlink GitHub account' });
//   }
// });

// /**
//  * Step 5: FIXED - Get GitHub auth status (returns detailed profile info)
//  */
// router.get('/status', authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user.user_id;
//     const githubAuth = await GitHubAuth.findOne({ user: userId });
    
//     if (githubAuth) {
//       res.json({
//         isLinked: true,
//         github: {
//           username: githubAuth.username,
//           name: githubAuth.name,
//           email: githubAuth.email,
//           avatarUrl: githubAuth.avatarUrl,
//           profileUrl: githubAuth.profileUrl,
//           publicRepos: githubAuth.publicRepos || 0,
//           followers: githubAuth.followers || 0,
//           following: githubAuth.following || 0,
//           lastSynced: githubAuth.lastSynced
//         }
//       });
//     } else {
//       res.json({ isLinked: false, github: null });
//     }
//   } catch (err) {
//     console.error('GitHub status error:', err);
//     res.status(500).json({ message: 'Failed to get GitHub status' });
//   }
// });

// /**
//  * Step 6: Handle 2FA verification for GitHub OAuth users
//  */
// router.post('/verify-2fa', async (req, res) => {
//   try {
//     const { tempToken, twoFactorCode } = req.body;

//     if (!tempToken || !twoFactorCode) {
//       return res.status(400).json({ message: 'Temporary token and 2FA code are required' });
//     }

//     // Verify the temporary token
//     let decoded;
//     try {
//       decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
//     } catch (err) {
//       return res.status(400).json({ message: 'Invalid or expired temporary token' });
//     }

//     if (!decoded.githubOAuth) {
//       return res.status(400).json({ message: 'Invalid temporary token' });
//     }

//     // Get user and 2FA settings
//     const user = await User.findById(decoded.userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const TwoFA = require('../models/TwoFA');
//     const twoFA = await TwoFA.findOne({ userId: user._id });
//     if (!twoFA || !twoFA.twoFactorEnabled) {
//       return res.status(400).json({ message: '2FA is not enabled for this account' });
//     }

//     // Verify 2FA code
//     let isValidCode = false;
//     let usedBackupCode = null;

//     // First check if it's a backup code
//     for (let backupCode of twoFA.twoFactorBackupCodes) {
//       if (!backupCode.used && backupCode.code === twoFactorCode.toUpperCase()) {
//         backupCode.used = true;
//         backupCode.usedAt = new Date();
//         await twoFA.save();
//         isValidCode = true;
//         usedBackupCode = backupCode.code;
//         break;
//       }
//     }

//     // If not a backup code, verify TOTP
//     if (!isValidCode) {
//       const speakeasy = require('speakeasy'); // Add this import at the top
//       isValidCode = speakeasy.totp.verify({
//         secret: twoFA.twoFactorSecret,
//         encoding: 'base32',
//         token: twoFactorCode,
//         window: 2 // Allow 2 time steps before/after current time
//       });
//     }

//     if (!isValidCode) {
//       return res.status(400).json({ 
//         message: 'Invalid two-factor authentication code. Please try again.' 
//       });
//     }

//     // 2FA verification successful - complete the GitHub OAuth login
//     const { githubData, deviceInfo, clientIp } = decoded;

//     // Update user's last login
//     user.lastLogin = new Date();
//     user.lastLoginIp = clientIp;
//     await user.save();

//     // Update GitHub auth with latest info
//     await GitHubAuth.findOneAndUpdate(
//       { user: user._id },
//       {
//         githubId: githubData.githubId,
//         username: githubData.username,
//         name: githubData.name,
//         avatarUrl: githubData.avatarUrl,
//         profileUrl: githubData.profileUrl,
//         accessToken: githubData.accessToken,
//         publicRepos: githubData.publicRepos,
//         followers: githubData.followers,
//         following: githubData.following,
//         lastSynced: new Date()
//       },
//       { upsert: true }
//     );

//     // Generate unique session ID
//     const sessionId = crypto.randomBytes(32).toString('hex');
    
//     // Create session record
//     await Session.create({
//       userId: user._id,
//       sessionId,
//       userAgent: deviceInfo.browser || 'Unknown',
//       ipAddress: clientIp,
//       deviceInfo
//     });

//     // Generate final JWT token
//     const tokenPayload = {
//       userId: user._id,
//       user_id: user._id,
//       sessionId,
//       email: user.email
//     };

//     const token = jwt.sign(
//       tokenPayload,
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     // Send login success email
//     try {
//       await sendLoginSuccessEmail(
//         user.email,
//         user.name,
//         deviceInfo,
//         clientIp
//       );
//       console.log('GitHub OAuth 2FA login success email sent');
//     } catch (emailError) {
//       console.error('Failed to send GitHub OAuth 2FA login success email:', emailError);
//     }

//     res.json({
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         phoneNumber: user.phoneNumber,
//         company: user.company,
//         role: user.role,
//         isOnboardingComplete: user.isOnboardingComplete
//       },
//       message: 'GitHub OAuth with 2FA verification successful',
//       usedBackupCode
//     });

//   } catch (error) {
//     console.error('GitHub OAuth 2FA verification error:', error);
//     res.status(500).json({ message: 'Verification failed. Please try again.' });
//   }
// });

// module.exports = router;


// //routes/githubAuth.js
// const express = require('express');
// const axios = require('axios');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// const speakeasy = require('speakeasy');
// const User = require('../models/User');
// const GitHubAuth = require('../models/GitHubAuth');
// const TwoFA = require('../models/TwoFA');
// const Session = require('../models/Session');
// const authMiddleware = require('../middleware/auth');
// const UAParser = require('ua-parser-js');
// const { sendLoginSuccessEmail, sendSuspiciousLoginAlert, sendGithubLinkedEmail,sendGithubUnlinkedEmail } = require('../utils/sendEmail');
// const sendWelcomeEmail = require('../utils/sendWelcomeEmail');

// const router = express.Router();

// // Helper function to get client IP
// const getClientIp = (req) => {
//   return req.headers['x-forwarded-for']?.split(',')[0] || 
//          req.headers['x-real-ip'] || 
//          req.connection.remoteAddress || 
//          req.socket.remoteAddress ||
//          (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
//          req.ip;
// };

// /**
//  * Step 1: Redirect user to GitHub for authentication (NEW ACCOUNTS/SIGNIN)
//  */
// router.get('/login', (req, res) => {
//   const state = req.query.state || '';
//   const clientId = process.env.GITHUB_CLIENT_ID;
//   const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/github/callback`;
//   const githubAuthUrl =
//     `https://github.com/login/oauth/authorize` +
//     `?client_id=${clientId}` +
//     `&redirect_uri=${encodeURIComponent(redirectUri)}` +
//     `&scope=user:email` +
//     `&state=${encodeURIComponent(state)}`;
//   res.redirect(githubAuthUrl);
// });

// /**
//  * Step 2: GitHub callback with enhanced GitHub ID tracking
//  */
// router.get('/callback', async (req, res) => {
//   const { code, state } = req.query;

//   if (!code) {
//     return res.status(400).json({ message: 'No code provided' });
//   }

//   try {
//     const clientIp = getClientIp(req);
//     const parser = new UAParser(req.headers['user-agent'] || '');
//     const deviceInfo = {
//       browser: parser.getBrowser().name || 'Unknown',
//       os: parser.getOS().name || 'Unknown',
//       device: parser.getDevice().model || 'Desktop',
//       isMobile: parser.getDevice().type === 'mobile'
//     };

//     // Exchange code for access token
//     const tokenRes = await axios.post(
//       'https://github.com/login/oauth/access_token',
//       {
//         client_id: process.env.GITHUB_CLIENT_ID,
//         client_secret: process.env.GITHUB_CLIENT_SECRET,
//         code
//       },
//       { headers: { Accept: 'application/json' } }
//     );

//     const accessToken = tokenRes.data.access_token;
//     if (!accessToken) throw new Error('No access token received from GitHub');

//     // Get user info from GitHub
//     const githubUserRes = await axios.get('https://api.github.com/user', {
//       headers: { Authorization: `token ${accessToken}` }
//     });

//     const githubUser = githubUserRes.data;

//     // Get user's primary email
//     let primaryEmail = null;
//     try {
//       const emailRes = await axios.get('https://api.github.com/user/emails', {
//         headers: { Authorization: `token ${accessToken}` }
//       });
//       const primary = emailRes.data.find(e => e.primary && e.verified);
//       if (primary) primaryEmail = primary.email;
//     } catch (err) {
//       console.warn('Unable to fetch GitHub email:', err.message);
//     }

//     if (!primaryEmail && githubUser.email) {
//       primaryEmail = githubUser.email;
//     }

//     if (!primaryEmail) {
//       return res.status(400).json({ 
//         message: 'Unable to get verified email from GitHub. Please make sure your GitHub email is verified and visible.' 
//       });
//     }

//     let user;
//     let isLinkingToExistingUser = false;

//     // Check if state contains JWT (linking to existing user)
//     if (state) {
//       try {
//         const decoded = jwt.verify(state, process.env.JWT_SECRET);
//         user = await User.findById(decoded.user_id);
//         if (user) {
//           isLinkingToExistingUser = true;
//           console.log('Linking GitHub to existing authenticated user:', user.email);
//         }
//       } catch (err) {
//         console.warn('Invalid state token for linking:', err.message);
//       }
//     }

//     // ENHANCED: Check if GitHub ID has EVER been used by ANY user
//     const userWithGithubHistory = await User.findByGithubId(githubUser.id.toString());
    
//     if (userWithGithubHistory) {
//       if (isLinkingToExistingUser) {
//         // User trying to link GitHub to their account
//         if (userWithGithubHistory._id.toString() !== user._id.toString()) {
//           // GitHub account was used by a DIFFERENT user (even if previously unlinked)
//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//           return res.redirect(`${frontendUrl}/settings?github=error&message=${encodeURIComponent('This GitHub account has been previously used and cannot be linked to another account.')}`);
//         }
        
//         // Same user re-linking their own GitHub account
//         const currentGithubAuth = await GitHubAuth.findOne({ user: user._id });
//         if (currentGithubAuth && currentGithubAuth.githubId !== githubUser.id.toString()) {
//           // User has a different GitHub account currently linked
//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//           return res.redirect(`${frontendUrl}/settings?github=error&message=${encodeURIComponent('You already have a different GitHub account linked. Please unlink it first.')}`);
//         }

//         // Re-link the same GitHub account
//         user.addGithubToHistory({
//           githubId: githubUser.id.toString(),
//           username: githubUser.login
//         });
//         await user.save();

//         // Update GitHub auth record
//         await GitHubAuth.findOneAndUpdate(
//           { user: user._id },
//           {
//             githubId: githubUser.id.toString(),
//             username: githubUser.login,
//             email: primaryEmail,
//             name: githubUser.name || githubUser.login,
//             avatarUrl: githubUser.avatar_url,
//             profileUrl: githubUser.html_url,
//             accessToken,
//             publicRepos: githubUser.public_repos || 0,
//             followers: githubUser.followers || 0,
//             following: githubUser.following || 0,
//             lastSynced: new Date()
//           },
//           { upsert: true }
//         );

//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/settings?github=linked&success=true`);

//       } else {
//         // Regular OAuth flow - existing user logging in
//         user = userWithGithubHistory;
        
//         // Check if user's current GitHub ID matches
//         const isCurrentlyLinked = user.githubIdHistory.some(
//           entry => entry.githubId === githubUser.id.toString() && entry.isCurrentlyLinked
//         );

//         if (!isCurrentlyLinked) {
//           // GitHub ID exists in history but not currently linked - re-link it
//           user.addGithubToHistory({
//             githubId: githubUser.id.toString(),
//             username: githubUser.login
//           });
//           await user.save();
//         }

//         // Continue with normal login flow...
//         const twoFA = await TwoFA.findOne({ userId: user._id });
//         const has2FA = twoFA && twoFA.twoFactorEnabled;

//         if (has2FA) {
//           // 2FA flow
//           const tempToken = jwt.sign({
//             githubOAuth: true,
//             userId: user._id,
//             email: user.email,
//             githubData: {
//               githubId: githubUser.id.toString(),
//               username: githubUser.login,
//               name: githubUser.name || githubUser.login,
//               avatarUrl: githubUser.avatar_url,
//               profileUrl: githubUser.html_url,
//               accessToken,
//               publicRepos: githubUser.public_repos || 0,
//               followers: githubUser.followers || 0,
//               following: githubUser.following || 0
//             },
//             deviceInfo,
//             clientIp
//           }, process.env.JWT_SECRET, { expiresIn: '10m' });

//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//           return res.redirect(`${frontendUrl}/oauth-2fa?tempToken=${tempToken}`);
//         }

//         // Complete login without 2FA
//         user.lastLogin = new Date();
//         user.lastLoginIp = clientIp;
//         await user.save();

//         // Update GitHub auth record
//         await GitHubAuth.findOneAndUpdate(
//           { user: user._id },
//           {
//             githubId: githubUser.id.toString(),
//             username: githubUser.login,
//             email: primaryEmail,
//             name: githubUser.name || githubUser.login,
//             avatarUrl: githubUser.avatar_url,
//             profileUrl: githubUser.html_url,
//             accessToken,
//             publicRepos: githubUser.public_repos || 0,
//             followers: githubUser.followers || 0,
//             following: githubUser.following || 0,
//             lastSynced: new Date()
//           },
//           { upsert: true }
//         );

//         const sessionId = crypto.randomBytes(32).toString('hex');
//         await Session.create({
//           userId: user._id,
//           sessionId,
//           userAgent: req.headers['user-agent'] || 'Unknown',
//           ipAddress: clientIp,
//           deviceInfo
//         });

//         const tokenPayload = {
//           userId: user._id,
//           user_id: user._id,
//           sessionId,
//           email: user.email
//         };

//         const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

//         try {
//           await sendLoginSuccessEmail(user.email, user.name, deviceInfo, clientIp);
//         } catch (emailError) {
//           console.error('Failed to send GitHub login success email:', emailError);
//         }

//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=login`);
//       }
//     }

//     // NEW USER CREATION or LINKING NEW GITHUB
//     if (isLinkingToExistingUser) {
//       // LINKING CASE: User linking a completely new GitHub account
//       console.log('Linking new GitHub account to existing user:', user.email);
      
//       // Check if user already has a currently linked GitHub account
//       if (user.githubId) {
//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/settings?github=error&message=${encodeURIComponent('You already have a GitHub account linked. Please unlink it first before linking a new one.')}`);
//       }

//       // Add new GitHub to history and set as current
//       user.addGithubToHistory({
//         githubId: githubUser.id.toString(),
//         username: githubUser.login
//       });
//       await user.save();

//       // Create GitHub auth record
//       await GitHubAuth.create({
//         user: user._id,
//         githubId: githubUser.id.toString(),
//         username: githubUser.login,
//         email: primaryEmail,
//         name: githubUser.name || githubUser.login,
//         avatarUrl: githubUser.avatar_url,
//         profileUrl: githubUser.html_url,
//         accessToken,
//         publicRepos: githubUser.public_repos || 0,
//         followers: githubUser.followers || 0,
//         following: githubUser.following || 0,
//         lastSynced: new Date()
//       });

//       console.log('New GitHub account successfully linked to existing user');

//       try {
//         await sendSuspiciousLoginAlert(user.email, user.name, deviceInfo, clientIp);
//       } catch (emailError) {
//         console.error('Failed to send GitHub linking notification email:', emailError);
//       }

//       const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//       return res.redirect(`${frontendUrl}/settings?github=linked&success=true`);

//     } else {
//       // Check if email already exists (user trying to use GitHub with existing email)
//       const existingUserByEmail = await User.findOne({ email: primaryEmail });
//       if (existingUserByEmail) {
//         // User exists by email - link GitHub to existing account
//         user = existingUserByEmail;
        
//         // Add GitHub to history
//         user.addGithubToHistory({
//           githubId: githubUser.id.toString(),
//           username: githubUser.login
//         });
//         user.lastLogin = new Date();
//         user.lastLoginIp = clientIp;
//         await user.save();

//         // Create/update GitHub auth record
//         await GitHubAuth.findOneAndUpdate(
//           { user: user._id },
//           {
//             githubId: githubUser.id.toString(),
//             username: githubUser.login,
//             email: primaryEmail,
//             name: githubUser.name || githubUser.login,
//             avatarUrl: githubUser.avatar_url,
//             profileUrl: githubUser.html_url,
//             accessToken,
//             publicRepos: githubUser.public_repos || 0,
//             followers: githubUser.followers || 0,
//             following: githubUser.following || 0,
//             lastSynced: new Date()
//           },
//           { upsert: true }
//         );

//         // Continue with normal login flow (2FA check, etc.)
//         const twoFA = await TwoFA.findOne({ userId: user._id });
//         const has2FA = twoFA && twoFA.twoFactorEnabled;

//         if (has2FA) {
//           const tempToken = jwt.sign({
//             githubOAuth: true,
//             userId: user._id,
//             email: user.email,
//             githubData: {
//               githubId: githubUser.id.toString(),
//               username: githubUser.login,
//               name: githubUser.name || githubUser.login,
//               avatarUrl: githubUser.avatar_url,
//               profileUrl: githubUser.html_url,
//               accessToken,
//               publicRepos: githubUser.public_repos || 0,
//               followers: githubUser.followers || 0,
//               following: githubUser.following || 0
//             },
//             deviceInfo,
//             clientIp
//           }, process.env.JWT_SECRET, { expiresIn: '10m' });

//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//           return res.redirect(`${frontendUrl}/oauth-2fa?tempToken=${tempToken}`);
//         }

//         // Complete login
//         const sessionId = crypto.randomBytes(32).toString('hex');
//         await Session.create({
//           userId: user._id,
//           sessionId,
//           userAgent: req.headers['user-agent'] || 'Unknown',
//           ipAddress: clientIp,
//           deviceInfo
//         });

//         const tokenPayload = {
//           userId: user._id,
//           user_id: user._id,
//           sessionId,
//           email: user.email
//         };

//         const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

//         try {
//           await sendLoginSuccessEmail(user.email, user.name, deviceInfo, clientIp);
//         } catch (emailError) {
//           console.error('Failed to send GitHub login success email:', emailError);
//         }

//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=login`);

//       } else {
//         // BRAND NEW USER CREATION
//         console.log('Creating new user for GitHub OAuth:', primaryEmail);
//         user = await User.create({
//           name: githubUser.name || githubUser.login,
//           email: primaryEmail,
//           isVerified: true,
//           role: 1,
//           isActive: true,
//           lastLogin: new Date(),
//           createdIp: clientIp,
//           lastLoginIp: clientIp,
//           // Initialize with GitHub ID and history
//           githubId: githubUser.id.toString(),
//           githubIdHistory: [{
//             githubId: githubUser.id.toString(),
//             username: githubUser.login,
//             linkedAt: new Date(),
//             unlinkedAt: null,
//             isCurrentlyLinked: true
//           }]
//         });

//         console.log('New user created via GitHub OAuth with ID history:', user._id);

//         // Create GitHub auth record
//         await GitHubAuth.create({
//           user: user._id,
//           githubId: githubUser.id.toString(),
//           username: githubUser.login,
//           email: primaryEmail,
//           name: githubUser.name || githubUser.login,
//           avatarUrl: githubUser.avatar_url,
//           profileUrl: githubUser.html_url,
//           accessToken,
//           publicRepos: githubUser.public_repos || 0,
//           followers: githubUser.followers || 0,
//           following: githubUser.following || 0,
//           lastSynced: new Date()
//         });

//         try {
//           await sendWelcomeEmail(user.email, user.name);
//         } catch (emailError) {
//           console.error('Failed to send GitHub signup welcome email:', emailError);
//         }

//         const sessionId = crypto.randomBytes(32).toString('hex');
//         await Session.create({
//           userId: user._id,
//           sessionId,
//           userAgent: req.headers['user-agent'] || 'Unknown',
//           ipAddress: clientIp,
//           deviceInfo
//         });

//         const tokenPayload = {
//           userId: user._id,
//           user_id: user._id,
//           sessionId,
//           email: user.email
//         };

//         const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=signup`);
//       }
//     }

//   } catch (err) {
//     console.error('GitHub OAuth error:', err);
//     const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//     res.redirect(`${frontendUrl}/oauth-error?message=${encodeURIComponent('GitHub authentication failed')}`);
//   }
// });

// /**
//  * Step 3: FIXED - Return auth URL instead of redirecting
//  */
// router.get('/link', authMiddleware, (req, res) => {
//   try {
//     // Create state token with the authenticated user's ID
//     const state = jwt.sign({ user_id: req.user.user_id }, process.env.JWT_SECRET, {
//       expiresIn: '10m'
//     });
    
//     const clientId = process.env.GITHUB_CLIENT_ID;
//     const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/github/callback`;
//     const githubAuthUrl =
//       `https://github.com/login/oauth/authorize` +
//       `?client_id=${clientId}` +
//       `&redirect_uri=${encodeURIComponent(redirectUri)}` +
//       `&scope=user:email` +
//       `&state=${encodeURIComponent(state)}`;
      
//     console.log('Generating GitHub auth URL for authenticated user:', req.user.user_id);

//     // Return the auth URL instead of redirecting
//     res.json({ 
//       authUrl: githubAuthUrl,
//       message: 'GitHub auth URL generated successfully'
//     });
    
//   } catch (error) {
//     console.error('Error generating GitHub auth URL:', error);
//     res.status(500).json({ message: 'Failed to generate GitHub auth URL' });
//   }
// });

// /**
//  * Step 4: UPDATED - Unlink GitHub but keep ID in history
//  */
// router.delete('/unlink', authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user.user_id;
    
//     // Get user to update GitHub history
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Get current GitHub auth for logging
//     const githubAuth = await GitHubAuth.findOne({ user: userId });
    
//     if (githubAuth) {
//       console.log('Unlinking GitHub account:', githubAuth.username, 'from user:', userId);
      
//       // Update user's GitHub history (mark as unlinked but keep the ID)
//       user.unlinkCurrentGithub();
//       await user.save();
      
//       // Remove GitHub auth record (but ID stays in user's history)
//       await GitHubAuth.findOneAndDelete({ user: userId });
      
//       console.log('GitHub account unlinked successfully, ID preserved in history for user:', userId);
//       res.json({ 
//         message: 'GitHub account unlinked successfully',
//         preservedInHistory: true
//       });
//     } else {
//       res.status(404).json({ message: 'No GitHub account found to unlink' });
//     }
//   } catch (err) {
//     console.error('GitHub unlink error:', err);
//     res.status(500).json({ message: 'Failed to unlink GitHub account' });
//   }
// });

// /**
//  * Step 5: Get GitHub auth status with history info
//  */
// router.get('/status', authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user.user_id;
//     const githubAuth = await GitHubAuth.findOne({ user: userId });
//     const user = await User.findById(userId);
    
//     if (githubAuth) {
//       res.json({
//         isLinked: true,
//         github: {
//           username: githubAuth.username,
//           name: githubAuth.name,
//           email: githubAuth.email,
//           avatarUrl: githubAuth.avatarUrl,
//           profileUrl: githubAuth.profileUrl,
//           publicRepos: githubAuth.publicRepos || 0,
//           followers: githubAuth.followers || 0,
//           following: githubAuth.following || 0,
//           lastSynced: githubAuth.lastSynced
//         },
//         // Include history information (optional - you might not want to expose this to frontend)
//         githubHistory: user?.githubIdHistory?.length || 0
//       });
//     } else {
//       res.json({ 
//         isLinked: false, 
//         github: null,
//         githubHistory: user?.githubIdHistory?.length || 0
//       });
//     }
//   } catch (err) {
//     console.error('GitHub status error:', err);
//     res.status(500).json({ message: 'Failed to get GitHub status' });
//   }
// });

// /**
//  * NEW: Admin route to view GitHub ID usage (optional)
//  */
// router.get('/admin/github-usage/:githubId', authMiddleware, async (req, res) => {
//   try {
//     // Check if user is admin (assuming role 2+ is admin)
//     const user = await User.findById(req.user.user_id);
//     if (!user || user.role < 2) {
//       return res.status(403).json({ message: 'Admin access required' });
//     }

//     const githubId = req.params.githubId;
//     const userWithGithub = await User.findByGithubId(githubId);
    
//     if (userWithGithub) {
//       const githubEntry = userWithGithub.githubIdHistory.find(
//         entry => entry.githubId === githubId
//       );
      
//       res.json({
//         used: true,
//         userId: userWithGithub._id,
//         userEmail: userWithGithub.email,
//         githubInfo: githubEntry,
//         isCurrentlyLinked: githubEntry?.isCurrentlyLinked || false
//       });
//     } else {
//       res.json({ used: false });
//     }
    
//   } catch (err) {
//     console.error('GitHub usage check error:', err);
//     res.status(500).json({ message: 'Failed to check GitHub usage' });
//   }
// });

// /**
//  * Step 6: Handle 2FA verification for GitHub OAuth users (unchanged)
//  */
// router.post('/verify-2fa', async (req, res) => {
//   try {
//     const { tempToken, twoFactorCode } = req.body;

//     if (!tempToken || !twoFactorCode) {
//       return res.status(400).json({ message: 'Temporary token and 2FA code are required' });
//     }

//     let decoded;
//     try {
//       decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
//     } catch (err) {
//       return res.status(400).json({ message: 'Invalid or expired temporary token' });
//     }

//     if (!decoded.githubOAuth) {
//       return res.status(400).json({ message: 'Invalid temporary token' });
//     }

//     const user = await User.findById(decoded.userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const twoFA = await TwoFA.findOne({ userId: user._id });
//     if (!twoFA || !twoFA.twoFactorEnabled) {
//       return res.status(400).json({ message: '2FA is not enabled for this account' });
//     }

//     // Verify 2FA code
//     let isValidCode = false;
//     let usedBackupCode = null;

//     // Check backup codes first
//     for (let backupCode of twoFA.twoFactorBackupCodes) {
//       if (!backupCode.used && backupCode.code === twoFactorCode.toUpperCase()) {
//         backupCode.used = true;
//         backupCode.usedAt = new Date();
//         await twoFA.save();
//         isValidCode = true;
//         usedBackupCode = backupCode.code;
//         break;
//       }
//     }

//     // If not a backup code, verify TOTP
//     if (!isValidCode) {
//       isValidCode = speakeasy.totp.verify({
//         secret: twoFA.twoFactorSecret,
//         encoding: 'base32',
//         token: twoFactorCode,
//         window: 2
//       });
//     }

//     if (!isValidCode) {
//       return res.status(400).json({ 
//         message: 'Invalid two-factor authentication code. Please try again.' 
//       });
//     }

//     // 2FA verification successful - complete the GitHub OAuth login
//     const { githubData, deviceInfo, clientIp } = decoded;

//     // Update user's GitHub history and current info
//     user.addGithubToHistory({
//       githubId: githubData.githubId,
//       username: githubData.username
//     });
//     user.lastLogin = new Date();
//     user.lastLoginIp = clientIp;
//     await user.save();

//     // Update GitHub auth record
//     await GitHubAuth.findOneAndUpdate(
//       { user: user._id },
//       {
//         githubId: githubData.githubId,
//         username: githubData.username,
//         name: githubData.name,
//         avatarUrl: githubData.avatarUrl,
//         profileUrl: githubData.profileUrl,
//         accessToken: githubData.accessToken,
//         publicRepos: githubData.publicRepos,
//         followers: githubData.followers,
//         following: githubData.following,
//         lastSynced: new Date()
//       },
//       { upsert: true }
//     );

//     // Generate session
//     const sessionId = crypto.randomBytes(32).toString('hex');
//     await Session.create({
//       userId: user._id,
//       sessionId,
//       userAgent: deviceInfo.browser || 'Unknown',
//       ipAddress: clientIp,
//       deviceInfo
//     });

//     // Generate final JWT token
//     const tokenPayload = {
//       userId: user._id,
//       user_id: user._id,
//       sessionId,
//       email: user.email
//     };

//     const token = jwt.sign(
//       tokenPayload,
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     // Send login success email
//     try {
//       await sendLoginSuccessEmail(
//         user.email,
//         user.name,
//         deviceInfo,
//         clientIp
//       );
//       console.log('GitHub OAuth 2FA login success email sent');
//     } catch (emailError) {
//       console.error('Failed to send GitHub OAuth 2FA login success email:', emailError);
//     }

//     res.json({
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         phoneNumber: user.phoneNumber,
//         company: user.company,
//         role: user.role,
//         isOnboardingComplete: user.isOnboardingComplete
//       },
//       message: 'GitHub OAuth with 2FA verification successful',
//       usedBackupCode
//     });

//   } catch (error) {
//     console.error('GitHub OAuth 2FA verification error:', error);
//     res.status(500).json({ message: 'Verification failed. Please try again.' });
//   }
// });

// module.exports = router;



// //routes/githubAuth.js
// const express = require('express');
// const axios = require('axios');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// const speakeasy = require('speakeasy');
// const User = require('../models/User');
// const GitHubAuth = require('../models/GitHubAuth');
// const TwoFA = require('../models/TwoFA');
// const Session = require('../models/Session');
// const authMiddleware = require('../middleware/auth');
// const UAParser = require('ua-parser-js');
// const { sendLoginSuccessEmail, sendSuspiciousLoginAlert, sendGithubLinkedEmail, sendGithubUnlinkedEmail } = require('../utils/sendEmail');
// const sendWelcomeEmail = require('../utils/sendWelcomeEmail');
// const DeletedAccount = require('../models/DeletedAccounts');
// const router = express.Router();

// // FIXED: Enhanced helper function to get real client IP
// const getClientIp = (req) => {
//   // Get the raw IP first
//   let ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
//            req.headers['x-real-ip'] || 
//            req.connection.remoteAddress || 
//            req.socket.remoteAddress ||
//            (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
//            req.ip;

//   // Handle IPv6 loopback and local addresses
//   if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
//     // In development, you might want to use a default IP or get real IP differently
//     // For production behind reverse proxy, this should be handled by x-forwarded-for
//     ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '127.0.0.1';
//   }

//   // Clean IPv6 mapped IPv4 addresses (::ffff:192.168.1.1 -> 192.168.1.1)
//   if (ip && ip.startsWith('::ffff:')) {
//     ip = ip.substring(7);
//   }

//   return ip || '127.0.0.1'; // fallback
// };

// /**
//  * Step 1: Redirect user to GitHub for authentication (NEW ACCOUNTS/SIGNIN)
//  */
// router.get('/login', (req, res) => {
//   const state = req.query.state || '';
//   const clientId = process.env.GITHUB_CLIENT_ID;
//   const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/github/callback`;
//   const githubAuthUrl =
//     `https://github.com/login/oauth/authorize` +
//     `?client_id=${clientId}` +
//     `&redirect_uri=${encodeURIComponent(redirectUri)}` +
//     `&scope=user:email` +
//     `&state=${encodeURIComponent(state)}`;
//   res.redirect(githubAuthUrl);
// });

// /**
//  * Step 2: GitHub callback with enhanced GitHub ID tracking
//  */
// router.get('/callback', async (req, res) => {
//   const { code, state } = req.query;

//   if (!code) {
//     return res.status(400).json({ message: 'No code provided' });
//   }

//   try {
//     const clientIp = getClientIp(req);
//     const parser = new UAParser(req.headers['user-agent'] || '');
//     const deviceInfo = {
//       browser: parser.getBrowser().name || 'Unknown',
//       os: parser.getOS().name || 'Unknown',
//       device: parser.getDevice().model || 'Desktop',
//       isMobile: parser.getDevice().type === 'mobile'
//     };

//     // Exchange code for access token
//     const tokenRes = await axios.post(
//       'https://github.com/login/oauth/access_token',
//       {
//         client_id: process.env.GITHUB_CLIENT_ID,
//         client_secret: process.env.GITHUB_CLIENT_SECRET,
//         code
//       },
//       { headers: { Accept: 'application/json' } }
//     );

//     const accessToken = tokenRes.data.access_token;
//     if (!accessToken) throw new Error('No access token received from GitHub');

//     // Get user info from GitHub
//     const githubUserRes = await axios.get('https://api.github.com/user', {
//       headers: { Authorization: `token ${accessToken}` }
//     });

//     const githubUser = githubUserRes.data;

//     // Get user's primary email
//     let primaryEmail = null;
//     try {
//       const emailRes = await axios.get('https://api.github.com/user/emails', {
//         headers: { Authorization: `token ${accessToken}` }
//       });
//       const primary = emailRes.data.find(e => e.primary && e.verified);
//       if (primary) primaryEmail = primary.email;
//     } catch (err) {
//       console.warn('Unable to fetch GitHub email:', err.message);
//     }

//     if (!primaryEmail && githubUser.email) {
//       primaryEmail = githubUser.email;
//     }

//     if (!primaryEmail) {
//       return res.status(400).json({ 
//         message: 'Unable to get verified email from GitHub. Please make sure your GitHub email is verified and visible.' 
//       });
//     }

//     let user;
//     let isLinkingToExistingUser = false;

//     // Check if state contains JWT (linking to existing user)
//     if (state) {
//       try {
//         const decoded = jwt.verify(state, process.env.JWT_SECRET);
//         user = await User.findById(decoded.user_id);
//         if (user) {
//           isLinkingToExistingUser = true;
//           console.log('Linking GitHub to existing authenticated user:', user.email);
//         }
//       } catch (err) {
//         console.warn('Invalid state token for linking:', err.message);
//       }
//     }

//     // ENHANCED: Check if GitHub ID has EVER been used by ANY user
//     const userWithGithubHistory = await User.findByGithubId(githubUser.id.toString());
    
//     if (userWithGithubHistory) {
//       if (isLinkingToExistingUser) {
//         // User trying to link GitHub to their account
//         if (userWithGithubHistory._id.toString() !== user._id.toString()) {
//           // GitHub account was used by a DIFFERENT user (even if previously unlinked)
//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//           return res.redirect(`${frontendUrl}/settings?github=error&message=${encodeURIComponent('This GitHub account has been previously used and cannot be linked to another account.')}`);
//         }
        
//         // Same user re-linking their own GitHub account
//         const currentGithubAuth = await GitHubAuth.findOne({ user: user._id });
//         if (currentGithubAuth && currentGithubAuth.githubId !== githubUser.id.toString()) {
//           // User has a different GitHub account currently linked
//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//           return res.redirect(`${frontendUrl}/settings?github=error&message=${encodeURIComponent('You already have a different GitHub account linked. Please unlink it first.')}`);
//         }

//         // Re-link the same GitHub account
//         user.addGithubToHistory({
//           githubId: githubUser.id.toString(),
//           username: githubUser.login
//         });
//         await user.save();

//         // Update GitHub auth record
//         await GitHubAuth.findOneAndUpdate(
//           { user: user._id },
//           {
//             githubId: githubUser.id.toString(),
//             username: githubUser.login,
//             email: primaryEmail,
//             name: githubUser.name || githubUser.login,
//             avatarUrl: githubUser.avatar_url,
//             profileUrl: githubUser.html_url,
//             accessToken,
//             publicRepos: githubUser.public_repos || 0,
//             followers: githubUser.followers || 0,
//             following: githubUser.following || 0,
//             lastSynced: new Date()
//           },
//           { upsert: true }
//         );

//         // ADDED: Send GitHub linked email notification
//         try {
//           await sendGithubLinkedEmail(user.email, user.name, githubUser.login, deviceInfo, clientIp);
//           console.log('GitHub linked email sent successfully');
//         } catch (emailError) {
//           console.error('Failed to send GitHub linked email:', emailError);
//         }

//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/settings?github=linked&success=true`);

//       } else {
//         // Regular OAuth flow - existing user logging in
//         user = userWithGithubHistory;
        
//         // Check if user's current GitHub ID matches
//         const isCurrentlyLinked = user.githubIdHistory.some(
//           entry => entry.githubId === githubUser.id.toString() && entry.isCurrentlyLinked
//         );

//         if (!isCurrentlyLinked) {
//           // GitHub ID exists in history but not currently linked - re-link it
//           user.addGithubToHistory({
//             githubId: githubUser.id.toString(),
//             username: githubUser.login
//           });
//           await user.save();
//         }

//         // Continue with normal login flow...
//         const twoFA = await TwoFA.findOne({ userId: user._id });
//         const has2FA = twoFA && twoFA.twoFactorEnabled;

//         if (has2FA) {
//           // 2FA flow
//           const tempToken = jwt.sign({
//             githubOAuth: true,
//             userId: user._id,
//             email: user.email,
//             githubData: {
//               githubId: githubUser.id.toString(),
//               username: githubUser.login,
//               name: githubUser.name || githubUser.login,
//               avatarUrl: githubUser.avatar_url,
//               profileUrl: githubUser.html_url,
//               accessToken,
//               publicRepos: githubUser.public_repos || 0,
//               followers: githubUser.followers || 0,
//               following: githubUser.following || 0
//             },
//             deviceInfo,
//             clientIp
//           }, process.env.JWT_SECRET, { expiresIn: '10m' });

//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//           return res.redirect(`${frontendUrl}/oauth-2fa?tempToken=${tempToken}`);
//         }

//         // Complete login without 2FA
//         user.lastLogin = new Date();
//         user.lastLoginIp = clientIp;
//         await user.save();

//         // Update GitHub auth record
//         await GitHubAuth.findOneAndUpdate(
//           { user: user._id },
//           {
//             githubId: githubUser.id.toString(),
//             username: githubUser.login,
//             email: primaryEmail,
//             name: githubUser.name || githubUser.login,
//             avatarUrl: githubUser.avatar_url,
//             profileUrl: githubUser.html_url,
//             accessToken,
//             publicRepos: githubUser.public_repos || 0,
//             followers: githubUser.followers || 0,
//             following: githubUser.following || 0,
//             lastSynced: new Date()
//           },
//           { upsert: true }
//         );

//         const sessionId = crypto.randomBytes(32).toString('hex');
//         await Session.create({
//           userId: user._id,
//           sessionId,
//           userAgent: req.headers['user-agent'] || 'Unknown',
//           ipAddress: clientIp,
//           deviceInfo
//         });

//         const tokenPayload = {
//           userId: user._id,
//           user_id: user._id,
//           sessionId,
//           email: user.email
//         };

//         const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

//         try {
//           await sendLoginSuccessEmail(user.email, user.name, deviceInfo, clientIp);
//         } catch (emailError) {
//           console.error('Failed to send GitHub login success email:', emailError);
//         }

//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=login`);
//       }
//     }

//     // NEW USER CREATION or LINKING NEW GITHUB
//     if (isLinkingToExistingUser) {
//       // LINKING CASE: User linking a completely new GitHub account
//       console.log('Linking new GitHub account to existing user:', user.email);
      
//       // Check if user already has a currently linked GitHub account
//       if (user.githubId) {
//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/settings?github=error&message=${encodeURIComponent('You already have a GitHub account linked. Please unlink it first before linking a new one.')}`);
//       }

//       // Add new GitHub to history and set as current
//       user.addGithubToHistory({
//         githubId: githubUser.id.toString(),
//         username: githubUser.login
//       });
//       await user.save();

//       // Create GitHub auth record
//       await GitHubAuth.create({
//         user: user._id,
//         githubId: githubUser.id.toString(),
//         username: githubUser.login,
//         email: primaryEmail,
//         name: githubUser.name || githubUser.login,
//         avatarUrl: githubUser.avatar_url,
//         profileUrl: githubUser.html_url,
//         accessToken,
//         publicRepos: githubUser.public_repos || 0,
//         followers: githubUser.followers || 0,
//         following: githubUser.following || 0,
//         lastSynced: new Date()
//       });

//       console.log('New GitHub account successfully linked to existing user');

//       // ADDED: Send GitHub linked email notification
//       try {
//         await sendGithubLinkedEmail(user.email, user.name, githubUser.login, deviceInfo, clientIp);
//         console.log('GitHub linked email sent successfully');
//       } catch (emailError) {
//         console.error('Failed to send GitHub linked email:', emailError);
//       }

//       const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//       return res.redirect(`${frontendUrl}/settings?github=linked&success=true`);

//     } else {
//       // Check if email already exists (user trying to use GitHub with existing email)
//       const existingUserByEmail = await User.findOne({ email: primaryEmail });
//       if (existingUserByEmail) {
//         // User exists by email - link GitHub to existing account
//         user = existingUserByEmail;
        
//         // Add GitHub to history
//         user.addGithubToHistory({
//           githubId: githubUser.id.toString(),
//           username: githubUser.login
//         });
//         user.lastLogin = new Date();
//         user.lastLoginIp = clientIp;
//         await user.save();

//         // Create/update GitHub auth record
//         await GitHubAuth.findOneAndUpdate(
//           { user: user._id },
//           {
//             githubId: githubUser.id.toString(),
//             username: githubUser.login,
//             email: primaryEmail,
//             name: githubUser.name || githubUser.login,
//             avatarUrl: githubUser.avatar_url,
//             profileUrl: githubUser.html_url,
//             accessToken,
//             publicRepos: githubUser.public_repos || 0,
//             followers: githubUser.followers || 0,
//             following: githubUser.following || 0,
//             lastSynced: new Date()
//           },
//           { upsert: true }
//         );

//         // Continue with normal login flow (2FA check, etc.)
//         const twoFA = await TwoFA.findOne({ userId: user._id });
//         const has2FA = twoFA && twoFA.twoFactorEnabled;

//         if (has2FA) {
//           const tempToken = jwt.sign({
//             githubOAuth: true,
//             userId: user._id,
//             email: user.email,
//             githubData: {
//               githubId: githubUser.id.toString(),
//               username: githubUser.login,
//               name: githubUser.name || githubUser.login,
//               avatarUrl: githubUser.avatar_url,
//               profileUrl: githubUser.html_url,
//               accessToken,
//               publicRepos: githubUser.public_repos || 0,
//               followers: githubUser.followers || 0,
//               following: githubUser.following || 0
//             },
//             deviceInfo,
//             clientIp
//           }, process.env.JWT_SECRET, { expiresIn: '10m' });

//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//           return res.redirect(`${frontendUrl}/oauth-2fa?tempToken=${tempToken}`);
//         }

//         // Complete login
//         const sessionId = crypto.randomBytes(32).toString('hex');
//         await Session.create({
//           userId: user._id,
//           sessionId,
//           userAgent: req.headers['user-agent'] || 'Unknown',
//           ipAddress: clientIp,
//           deviceInfo
//         });

//         const tokenPayload = {
//           userId: user._id,
//           user_id: user._id,
//           sessionId,
//           email: user.email
//         };

//         const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

//         try {
//           await sendLoginSuccessEmail(user.email, user.name, deviceInfo, clientIp);
//         } catch (emailError) {
//           console.error('Failed to send GitHub login success email:', emailError);
//         }

//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=login`);

//       } else {
//         // BRAND NEW USER CREATION
//         console.log('Creating new user for GitHub OAuth:', primaryEmail);
//         user = await User.create({
//           name: githubUser.name || githubUser.login,
//           email: primaryEmail,
//           isVerified: true,
//           role: 1,
//           isActive: true,
//           lastLogin: new Date(),
//           createdIp: clientIp,
//           lastLoginIp: clientIp,
//           // Initialize with GitHub ID and history
//           githubId: githubUser.id.toString(),
//           githubIdHistory: [{
//             githubId: githubUser.id.toString(),
//             username: githubUser.login,
//             linkedAt: new Date(),
//             unlinkedAt: null,
//             isCurrentlyLinked: true
//           }]
//         });

//         console.log('New user created via GitHub OAuth with ID history:', user._id);

//         // Create GitHub auth record
//         await GitHubAuth.create({
//           user: user._id,
//           githubId: githubUser.id.toString(),
//           username: githubUser.login,
//           email: primaryEmail,
//           name: githubUser.name || githubUser.login,
//           avatarUrl: githubUser.avatar_url,
//           profileUrl: githubUser.html_url,
//           accessToken,
//           publicRepos: githubUser.public_repos || 0,
//           followers: githubUser.followers || 0,
//           following: githubUser.following || 0,
//           lastSynced: new Date()
//         });

//         try {
//           await sendWelcomeEmail(user.email, user.name);
//         } catch (emailError) {
//           console.error('Failed to send GitHub signup welcome email:', emailError);
//         }

//         const sessionId = crypto.randomBytes(32).toString('hex');
//         await Session.create({
//           userId: user._id,
//           sessionId,
//           userAgent: req.headers['user-agent'] || 'Unknown',
//           ipAddress: clientIp,
//           deviceInfo
//         });

//         const tokenPayload = {
//           userId: user._id,
//           user_id: user._id,
//           sessionId,
//           email: user.email
//         };

//         const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=signup`);
//       }
//     }

//   } catch (err) {
//     console.error('GitHub OAuth error:', err);
//     const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//     res.redirect(`${frontendUrl}/oauth-error?message=${encodeURIComponent('GitHub authentication failed')}`);
//   }
// });

// /**
//  * Step 3: FIXED - Return auth URL instead of redirecting
//  */
// router.get('/link', authMiddleware, (req, res) => {
//   try {
//     // Create state token with the authenticated user's ID
//     const state = jwt.sign({ user_id: req.user.user_id }, process.env.JWT_SECRET, {
//       expiresIn: '10m'
//     });
    
//     const clientId = process.env.GITHUB_CLIENT_ID;
//     const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/github/callback`;
//     const githubAuthUrl =
//       `https://github.com/login/oauth/authorize` +
//       `?client_id=${clientId}` +
//       `&redirect_uri=${encodeURIComponent(redirectUri)}` +
//       `&scope=user:email` +
//       `&state=${encodeURIComponent(state)}`;
      
//     console.log('Generating GitHub auth URL for authenticated user:', req.user.user_id);

//     // Return the auth URL instead of redirecting
//     res.json({ 
//       authUrl: githubAuthUrl,
//       message: 'GitHub auth URL generated successfully'
//     });
    
//   } catch (error) {
//     console.error('Error generating GitHub auth URL:', error);
//     res.status(500).json({ message: 'Failed to generate GitHub auth URL' });
//   }
// });

// /**
//  * Step 4: UPDATED - Unlink GitHub with email notification
//  */
// router.delete('/unlink', authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user.user_id;
//     const clientIp = getClientIp(req);
//     const parser = new UAParser(req.headers['user-agent'] || '');
//     const deviceInfo = {
//       browser: parser.getBrowser().name || 'Unknown',
//       os: parser.getOS().name || 'Unknown',
//       device: parser.getDevice().model || 'Desktop',
//       isMobile: parser.getDevice().type === 'mobile'
//     };
    
//     // Get user to update GitHub history
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Get current GitHub auth for logging
//     const githubAuth = await GitHubAuth.findOne({ user: userId });
    
//     if (githubAuth) {
//       console.log('Unlinking GitHub account:', githubAuth.username, 'from user:', userId);
      
//       // Store GitHub username for email notification
//       const githubUsername = githubAuth.username;
      
//       // Update user's GitHub history (mark as unlinked but keep the ID)
//       user.unlinkCurrentGithub();
//       await user.save();
      
//       // Remove GitHub auth record (but ID stays in user's history)
//       await GitHubAuth.findOneAndDelete({ user: userId });
      
//       // ADDED: Send GitHub unlinked email notification
//       try {
//         await sendGithubUnlinkedEmail(user.email, user.name, githubUsername, deviceInfo, clientIp);
//         console.log('GitHub unlinked email sent successfully');
//       } catch (emailError) {
//         console.error('Failed to send GitHub unlinked email:', emailError);
//       }
      
//       console.log('GitHub account unlinked successfully, ID preserved in history for user:', userId);
//       res.json({ 
//         message: 'GitHub account unlinked successfully',
//         preservedInHistory: true
//       });
//     } else {
//       res.status(404).json({ message: 'No GitHub account found to unlink' });
//     }
//   } catch (err) {
//     console.error('GitHub unlink error:', err);
//     res.status(500).json({ message: 'Failed to unlink GitHub account' });
//   }
// });

// /**
//  * Step 5: Get GitHub auth status with history info
//  */
// router.get('/status', authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user.user_id;
//     const githubAuth = await GitHubAuth.findOne({ user: userId });
//     const user = await User.findById(userId);
    
//     if (githubAuth) {
//       res.json({
//         isLinked: true,
//         github: {
//           username: githubAuth.username,
//           name: githubAuth.name,
//           email: githubAuth.email,
//           avatarUrl: githubAuth.avatarUrl,
//           profileUrl: githubAuth.profileUrl,
//           publicRepos: githubAuth.publicRepos || 0,
//           followers: githubAuth.followers || 0,
//           following: githubAuth.following || 0,
//           lastSynced: githubAuth.lastSynced
//         },
//         // Include history information (optional - you might not want to expose this to frontend)
//         githubHistory: user?.githubIdHistory?.length || 0
//       });
//     } else {
//       res.json({ 
//         isLinked: false, 
//         github: null,
//         githubHistory: user?.githubIdHistory?.length || 0
//       });
//     }
//   } catch (err) {
//     console.error('GitHub status error:', err);
//     res.status(500).json({ message: 'Failed to get GitHub status' });
//   }
// });

// /**
//  * NEW: Admin route to view GitHub ID usage (optional)
//  */
// router.get('/admin/github-usage/:githubId', authMiddleware, async (req, res) => {
//   try {
//     // Check if user is admin (assuming role 2+ is admin)
//     const user = await User.findById(req.user.user_id);
//     if (!user || user.role < 2) {
//       return res.status(403).json({ message: 'Admin access required' });
//     }

//     const githubId = req.params.githubId;
//     const userWithGithub = await User.findByGithubId(githubId);
    
//     if (userWithGithub) {
//       const githubEntry = userWithGithub.githubIdHistory.find(
//         entry => entry.githubId === githubId
//       );
      
//       res.json({
//         used: true,
//         userId: userWithGithub._id,
//         userEmail: userWithGithub.email,
//         githubInfo: githubEntry,
//         isCurrentlyLinked: githubEntry?.isCurrentlyLinked || false
//       });
//     } else {
//       res.json({ used: false });
//     }
    
//   } catch (err) {
//     console.error('GitHub usage check error:', err);
//     res.status(500).json({ message: 'Failed to check GitHub usage' });
//   }
// });






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
const Project = require('../models/repository');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const projectFunctions = require('./projects').functions;
const {
  ensureExtractedDir,
  validateMernProject,
  cleanupProject,
  removeNodeModulesRecursively,
  createSonarPropertiesFile,
  runSonarQubeAnalysis,
  fetchSonarQubeResults,
  
} = projectFunctions;
const { analyzeDuplication } = require('../services/smells/duplication');
const https = require('https');
const AdmZip = require('adm-zip');
const ReferralService = require('../services/referralService');

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
//real
// router.get('/login', (req, res) => {
//   const state = req.query.state || '';
//   const clientId = process.env.GITHUB_CLIENT_ID;
//   const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/github/callback`;
//   const githubAuthUrl =
//     `https://github.com/login/oauth/authorize` +
//     `?client_id=${clientId}` +
//     `&redirect_uri=${encodeURIComponent(redirectUri)}` +
//     `&scope=user:email` +
//     `&state=${encodeURIComponent(state)}`;
//   res.redirect(githubAuthUrl);
// });

// /**
//  * Step 2: GitHub callback with enhanced GitHub ID tracking and deleted account checks
//  */
// /**
//  * Step 2: GitHub callback with session-based error/success messaging
//  */
// // At the top of your githubAuth.js file, add express-session if not already configured
// // You'll need to install: npm install express-session

// /**
//  * Step 2: GitHub callback with session-based error/success messaging
//  */
// router.get('/callback', async (req, res) => {
//   const { code, state } = req.query;

//   if (!code) {
//     return res.status(400).json({ message: 'No code provided' });
//   }

//   try {
//     const clientIp = getClientIp(req);
//     const parser = new UAParser(req.headers['user-agent'] || '');
//     const deviceInfo = {
//       browser: parser.getBrowser().name || 'Unknown',
//       os: parser.getOS().name || 'Unknown',
//       device: parser.getDevice().model || 'Desktop',
//       isMobile: parser.getDevice().type === 'mobile'
//     };

//     // Check if this is a linking operation by trying to decode the state
//     let isLinkingToExistingUser = false;
//     let linkingUser = null;
    
//     if (state) {
//       try {
//         const decoded = jwt.verify(state, process.env.JWT_SECRET);
//         linkingUser = await User.findById(decoded.user_id);
//         if (linkingUser) {
//           isLinkingToExistingUser = true;
//           console.log('Linking GitHub to existing authenticated user:', linkingUser.email);
//         }
//       } catch (err) {
//         console.warn('Invalid state token for linking:', err.message);
//       }
//     }

//     // Exchange code for access token
//     const tokenRes = await axios.post(
//       'https://github.com/login/oauth/access_token',
//       {
//         client_id: process.env.GITHUB_CLIENT_ID,
//         client_secret: process.env.GITHUB_CLIENT_SECRET,
//         code
//       },
//       { headers: { Accept: 'application/json' } }
//     );

//     const accessToken = tokenRes.data.access_token;
//     if (!accessToken) throw new Error('No access token received from GitHub');

//     // Get user info from GitHub
//     const githubUserRes = await axios.get('https://api.github.com/user', {
//       headers: { Authorization: `token ${accessToken}` }
//     });

//     const githubUser = githubUserRes.data;

//     // Get user's primary email
//     let primaryEmail = null;
//     try {
//       const emailRes = await axios.get('https://api.github.com/user/emails', {
//         headers: { Authorization: `token ${accessToken}` }
//       });
//       const primary = emailRes.data.find(e => e.primary && e.verified);
//       if (primary) primaryEmail = primary.email;
//     } catch (err) {
//       console.warn('Unable to fetch GitHub email:', err.message);
//     }

//     if (!primaryEmail && githubUser.email) {
//       primaryEmail = githubUser.email;
//     }

//     if (!primaryEmail) {
//       if (isLinkingToExistingUser) {
//         // Store error in session for settings page
//         req.session.githubError = 'Unable to get verified email from GitHub. Please make sure your GitHub email is verified and visible.';
//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/settings`);
//       }
//       return res.status(400).json({ 
//         message: 'Unable to get verified email from GitHub. Please make sure your GitHub email is verified and visible.' 
//       });
//     }

//     // Check if GitHub ID is in deleted accounts FIRST
//     const deletedCheck = await checkGithubInDeletedAccounts(githubUser.id);
//     if (deletedCheck.isDeleted) {
//       console.log('GitHub ID found in deleted accounts:', githubUser.id, 'from email:', deletedCheck.originalEmail);
//       const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
//       if (isLinkingToExistingUser) {
//         // Store error in session for settings page
//         req.session.githubError = 'This GitHub account was previously associated with a deleted account and cannot be linked to your account.';
//         return res.redirect(`${frontendUrl}/settings`);
//       } else {
//         // Store error in session for login/signup page
//         req.session.oauthError = 'This GitHub account was previously associated with a deleted account and cannot be used to sign in or create new accounts. If you think this is an error, please contact support.';
//         return res.redirect(`${frontendUrl}/login`);
//       }
//     }

//     let user;

//     // Check if state contains JWT (linking to existing user)
//     if (isLinkingToExistingUser) {
//       user = linkingUser;
//     }

//     // Check if GitHub ID has EVER been used by ANY user
//     const userWithGithubHistory = await User.findByGithubId(githubUser.id.toString());
    
//     if (userWithGithubHistory) {
//       if (isLinkingToExistingUser) {
//         // User trying to link GitHub to their account
//         if (userWithGithubHistory._id.toString() !== user._id.toString()) {
//           // GitHub account was used by a DIFFERENT user
//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//           req.session.githubError = 'This GitHub account has been previously used and cannot be linked to another account.';
//           return res.redirect(`${frontendUrl}/settings`);
//         }
        
//         // Same user re-linking their own GitHub account
//         const currentGithubAuth = await GitHubAuth.findOne({ user: user._id });
//         if (currentGithubAuth && currentGithubAuth.githubId !== githubUser.id.toString()) {
//           // User has a different GitHub account currently linked
//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//           req.session.githubError = 'You already have a different GitHub account linked. Please unlink it first.';
//           return res.redirect(`${frontendUrl}/settings`);
//         }

//         // Re-link the same GitHub account
//         user.addGithubToHistory({
//           githubId: githubUser.id.toString(),
//           username: githubUser.login
//         });
//         await user.save();

//         // Update GitHub auth record
//         await GitHubAuth.findOneAndUpdate(
//           { user: user._id },
//           {
//             githubId: githubUser.id.toString(),
//             username: githubUser.login,
//             email: primaryEmail,
//             name: githubUser.name || githubUser.login,
//             avatarUrl: githubUser.avatar_url,
//             profileUrl: githubUser.html_url,
//             accessToken,
//             publicRepos: githubUser.public_repos || 0,
//             followers: githubUser.followers || 0,
//             following: githubUser.following || 0,
//             lastSynced: new Date()
//           },
//           { upsert: true }
//         );

//         try {
//           await sendGithubLinkedEmail(user.email, user.name, githubUser.login, deviceInfo, clientIp);
//           console.log('GitHub linked email sent successfully');
//         } catch (emailError) {
//           console.error('Failed to send GitHub linked email:', emailError);
//         }

//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         req.session.githubSuccess = 'GitHub account linked successfully!';
//         return res.redirect(`${frontendUrl}/settings`);

//       } else {
//         // Regular OAuth flow - existing user logging in
//         // ... (rest of the login flow remains the same)
//         user = userWithGithubHistory;
        
//         const isCurrentlyLinked = user.githubIdHistory.some(
//           entry => entry.githubId === githubUser.id.toString() && entry.isCurrentlyLinked
//         );

//         if (!isCurrentlyLinked) {
//           user.addGithubToHistory({
//             githubId: githubUser.id.toString(),
//             username: githubUser.login
//           });
//           await user.save();
//         }

//         const twoFA = await TwoFA.findOne({ userId: user._id });
//         const has2FA = twoFA && twoFA.twoFactorEnabled;

//         if (has2FA) {
//           const tempToken = jwt.sign({
//             githubOAuth: true,
//             userId: user._id,
//             email: user.email,
//             githubData: {
//               githubId: githubUser.id.toString(),
//               username: githubUser.login,
//               name: githubUser.name || githubUser.login,
//               avatarUrl: githubUser.avatar_url,
//               profileUrl: githubUser.html_url,
//               accessToken,
//               publicRepos: githubUser.public_repos || 0,
//               followers: githubUser.followers || 0,
//               following: githubUser.following || 0
//             },
//             deviceInfo,
//             clientIp
//           }, process.env.JWT_SECRET, { expiresIn: '10m' });

//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//           return res.redirect(`${frontendUrl}/oauth-2fa?tempToken=${tempToken}`);
//         }

//         user.lastLogin = new Date();
//         user.lastLoginIp = clientIp;
//         await user.save();

//         await GitHubAuth.findOneAndUpdate(
//           { user: user._id },
//           {
//             githubId: githubUser.id.toString(),
//             username: githubUser.login,
//             email: primaryEmail,
//             name: githubUser.name || githubUser.login,
//             avatarUrl: githubUser.avatar_url,
//             profileUrl: githubUser.html_url,
//             accessToken,
//             publicRepos: githubUser.public_repos || 0,
//             followers: githubUser.followers || 0,
//             following: githubUser.following || 0,
//             lastSynced: new Date()
//           },
//           { upsert: true }
//         );

//         const sessionId = crypto.randomBytes(32).toString('hex');
//         await Session.create({
//           userId: user._id,
//           sessionId,
//           userAgent: req.headers['user-agent'] || 'Unknown',
//           ipAddress: clientIp,
//           deviceInfo
//         });

//         const tokenPayload = {
//           userId: user._id,
//           user_id: user._id,
//           sessionId,
//           email: user.email
//         };

//         const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

//         try {
//           await sendLoginSuccessEmail(user.email, user.name, deviceInfo, clientIp);
//         } catch (emailError) {
//           console.error('Failed to send GitHub login success email:', emailError);
//         }

//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=login`);
//       }
//     }

//     // NEW USER CREATION or LINKING NEW GITHUB
//     if (isLinkingToExistingUser) {
//       // LINKING CASE: User linking a completely new GitHub account
//       console.log('Linking new GitHub account to existing user:', user.email);
      
//       // Check if user already has a currently linked GitHub account
//       if (user.githubId) {
//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         req.session.githubError = 'You already have a GitHub account linked. Please unlink it first before linking a new one.';
//         return res.redirect(`${frontendUrl}/settings`);
//       }

//       // Check if the email is in deleted accounts for linking
//       const deletedByEmail = await DeletedAccount.findOne({ email: primaryEmail });
//       if (deletedByEmail) {
//         console.log('Email found in deleted accounts during linking, preventing link:', primaryEmail);
//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         req.session.githubError = 'This GitHub account\'s email was previously associated with a deleted account and cannot be linked.';
//         return res.redirect(`${frontendUrl}/settings`);
//       }

//       // Add new GitHub to history and set as current
//       user.addGithubToHistory({
//         githubId: githubUser.id.toString(),
//         username: githubUser.login
//       });
//       await user.save();

//       // Create GitHub auth record
//       await GitHubAuth.create({
//         user: user._id,
//         githubId: githubUser.id.toString(),
//         username: githubUser.login,
//         email: primaryEmail,
//         name: githubUser.name || githubUser.login,
//         avatarUrl: githubUser.avatar_url,
//         profileUrl: githubUser.html_url,
//         accessToken,
//         publicRepos: githubUser.public_repos || 0,
//         followers: githubUser.followers || 0,
//         following: githubUser.following || 0,
//         lastSynced: new Date()
//       });

//       console.log('New GitHub account successfully linked to existing user');

//       try {
//         await sendGithubLinkedEmail(user.email, user.name, githubUser.login, deviceInfo, clientIp);
//         console.log('GitHub linked email sent successfully');
//       } catch (emailError) {
//         console.error('Failed to send GitHub linked email:', emailError);
//       }

//       const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//       req.session.githubSuccess = 'GitHub account linked successfully!';
//       return res.redirect(`${frontendUrl}/settings`);

//     } else {
//       // Rest of the user creation/login logic remains the same...
//       // (Keep the existing logic for non-linking operations)
      
//       const existingUserByEmail = await User.findOne({ email: primaryEmail });
//       if (existingUserByEmail) {
//         user = existingUserByEmail;
        
//         user.addGithubToHistory({
//           githubId: githubUser.id.toString(),
//           username: githubUser.login
//         });
//         user.lastLogin = new Date();
//         user.lastLoginIp = clientIp;
//         await user.save();

//         await GitHubAuth.findOneAndUpdate(
//           { user: user._id },
//           {
//             githubId: githubUser.id.toString(),
//             username: githubUser.login,
//             email: primaryEmail,
//             name: githubUser.name || githubUser.login,
//             avatarUrl: githubUser.avatar_url,
//             profileUrl: githubUser.html_url,
//             accessToken,
//             publicRepos: githubUser.public_repos || 0,
//             followers: githubUser.followers || 0,
//             following: githubUser.following || 0,
//             lastSynced: new Date()
//           },
//           { upsert: true }
//         );

//         const twoFA = await TwoFA.findOne({ userId: user._id });
//         const has2FA = twoFA && twoFA.twoFactorEnabled;

//         if (has2FA) {
//           const tempToken = jwt.sign({
//             githubOAuth: true,
//             userId: user._id,
//             email: user.email,
//             githubData: {
//               githubId: githubUser.id.toString(),
//               username: githubUser.login,
//               name: githubUser.name || githubUser.login,
//               avatarUrl: githubUser.avatar_url,
//               profileUrl: githubUser.html_url,
//               accessToken,
//               publicRepos: githubUser.public_repos || 0,
//               followers: githubUser.followers || 0,
//               following: githubUser.following || 0
//             },
//             deviceInfo,
//             clientIp
//           }, process.env.JWT_SECRET, { expiresIn: '10m' });

//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//           return res.redirect(`${frontendUrl}/oauth-2fa?tempToken=${tempToken}`);
//         }

//         const sessionId = crypto.randomBytes(32).toString('hex');
//         await Session.create({
//           userId: user._id,
//           sessionId,
//           userAgent: req.headers['user-agent'] || 'Unknown',
//           ipAddress: clientIp,
//           deviceInfo
//         });

//         const tokenPayload = {
//           userId: user._id,
//           user_id: user._id,
//           sessionId,
//           email: user.email
//         };

//         const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

//         try {
//           await sendLoginSuccessEmail(user.email, user.name, deviceInfo, clientIp);
//         } catch (emailError) {
//           console.error('Failed to send GitHub login success email:', emailError);
//         }

//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=login`);

//       } else {
//         // BRAND NEW USER CREATION
//         console.log('Creating new user for GitHub OAuth:', primaryEmail);
        
//         const deletedByEmail = await DeletedAccount.findOne({ email: primaryEmail });
//         if (deletedByEmail) {
//           console.log('Email found in deleted accounts, preventing new account creation:', primaryEmail);
//           const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//           return res.redirect(`${frontendUrl}/oauth-error?message=${encodeURIComponent('This email address was previously associated with a deleted account and cannot be used to create new accounts.')}`);
//         }
        
//         user = await User.create({
//           name: githubUser.name || githubUser.login,
//           email: primaryEmail,
//           isVerified: true,
//           role: 1,
//           isActive: true,
//           lastLogin: new Date(),
//           createdIp: clientIp,
//           lastLoginIp: clientIp,
//           githubId: githubUser.id.toString(),
//           githubIdHistory: [{
//             githubId: githubUser.id.toString(),
//             username: githubUser.login,
//             linkedAt: new Date(),
//             unlinkedAt: null,
//             isCurrentlyLinked: true
//           }]
//         });

//         console.log('New user created via GitHub OAuth with ID history:', user._id);

//         await GitHubAuth.create({
//           user: user._id,
//           githubId: githubUser.id.toString(),
//           username: githubUser.login,
//           email: primaryEmail,
//           name: githubUser.name || githubUser.login,
//           avatarUrl: githubUser.avatar_url,
//           profileUrl: githubUser.html_url,
//           accessToken,
//           publicRepos: githubUser.public_repos || 0,
//           followers: githubUser.followers || 0,
//           following: githubUser.following || 0,
//           lastSynced: new Date()
//         });

//         try {
//           await sendWelcomeEmail(user.email, user.name);
//         } catch (emailError) {
//           console.error('Failed to send GitHub signup welcome email:', emailError);
//         }

//         const sessionId = crypto.randomBytes(32).toString('hex');
//         await Session.create({
//           userId: user._id,
//           sessionId,
//           userAgent: req.headers['user-agent'] || 'Unknown',
//           ipAddress: clientIp,
//           deviceInfo
//         });

//         const tokenPayload = {
//           userId: user._id,
//           user_id: user._id,
//           sessionId,
//           email: user.email
//         };

//         const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//         return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=signup`);
//       }
//     }

//   } catch (err) {
//     console.error('GitHub OAuth error:', err);
//     const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
//     // Check if this was a linking operation in the error case
//     if (state) {
//       try {
//         const decoded = jwt.verify(state, process.env.JWT_SECRET);
//         if (decoded.user_id) {
//           // This was a linking operation - store error in session
//           req.session.githubError = 'GitHub authentication failed. Please try again.';
//           return res.redirect(`${frontendUrl}/settings`);
//         }
//       } catch (stateErr) {
//         // State token invalid, treat as regular OAuth error
//       }
//     }
    
//     // Regular OAuth error - store in session for login page
//     req.session.oauthError = 'GitHub authentication failed. Please try again.';
//     res.redirect(`${frontendUrl}/login`);
//   }
// });

/**
 * NEW: API endpoint to get and clear session messages for both settings and login/signup pages
 */
router.get('/session-message', (req, res) => {
  try {
    const message = {
      // For settings page (GitHub linking)
      error: req.session.githubError || null,
      success: req.session.githubSuccess || null,
      // For login/signup page (OAuth login/signup)
      oauthError: req.session.oauthError || null
    };
    
    // Clear messages after reading them
    delete req.session.githubError;
    delete req.session.githubSuccess;
    delete req.session.oauthError;
    
    res.json(message);
  } catch (error) {
    console.error('Error getting session message:', error);
    res.status(500).json({ error: null, success: null, oauthError: null });
  }
});




// routes/github.js - Fixed GitHub OAuth with referral support



// GitHub OAuth login endpoint - capture referral code



// // Endpoint for frontend to get OAuth session data
// router.get('/session-message', (req, res) => {
//   try {
//     const message = {
//       // For settings page (GitHub linking)
//       error: req.session.githubError || null,
//       success: req.session.githubSuccess || null,
//       // For login/signup page (OAuth login/signup)
//       oauthError: req.session.oauthError || null
//     };
    
//     // Clear messages after reading them
//     delete req.session.githubError;
//     delete req.session.githubSuccess;
//     delete req.session.oauthError;
    
//     res.json(message);
//   } catch (error) {
//     console.error('Error getting session message:', error);
//     res.status(500).json({ error: null, success: null, oauthError: null });
//   }
// });



router.get('/login', (req, res) => {
  const { ref } = req.query; // Get referral code from query parameter
  const state = req.query.state || '';
  
  // Store referral code in session for after OAuth callback
  if (ref) {
    req.session.pendingReferralCode = ref;
  }
  
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

// GitHub OAuth callback - handle referral code application
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    req.session.oauthError = 'No authorization code received from GitHub';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/login`);
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

    // Check if this is a linking operation by trying to decode the state
    let isLinkingToExistingUser = false;
    let linkingUser = null;
    
    if (state) {
      try {
        const decoded = jwt.verify(state, process.env.JWT_SECRET);
        linkingUser = await User.findById(decoded.user_id);
        if (linkingUser) {
          isLinkingToExistingUser = true;
          console.log('Linking GitHub to existing authenticated user:', linkingUser.email);
        }
      } catch (err) {
        console.warn('Invalid state token for linking:', err.message);
      }
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
      redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/github/callback`
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const { access_token, error: tokenError } = tokenResponse.data;
    
    if (tokenError || !access_token) {
      console.error('GitHub token exchange error:', tokenError);
      if (isLinkingToExistingUser) {
        req.session.githubError = 'Failed to authenticate with GitHub';
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/settings`);
      }
      req.session.oauthError = 'Failed to authenticate with GitHub';
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login`);
    }

    // Get user info from GitHub
    const [userResponse, emailResponse] = await Promise.all([
      axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${access_token}` }
      }),
      axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${access_token}` }
      })
    ]);

    const githubUser = userResponse.data;
    const emails = emailResponse.data;
    
    // Find primary email
    const primaryEmail = emails.find(email => email.primary && email.verified);
    
    if (!primaryEmail) {
      if (isLinkingToExistingUser) {
        req.session.githubError = 'No verified primary email found in your GitHub account';
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/settings`);
      }
      req.session.oauthError = 'No verified primary email found in your GitHub account';
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login`);
    }

    // Check if GitHub ID is in deleted accounts FIRST (before any other checks)
    const deletedCheck = await checkGithubInDeletedAccounts(githubUser.id);
    if (deletedCheck && deletedCheck.isDeleted) {
      console.log('GitHub ID found in deleted accounts:', githubUser.id);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      if (isLinkingToExistingUser) {
        req.session.githubError = 'This GitHub account was previously associated with a deleted account and cannot be linked to your account.';
        return res.redirect(`${frontendUrl}/settings`);
      }
      req.session.oauthError = 'This GitHub account was previously associated with a deleted account and cannot be used to sign in or create new accounts.';
      return res.redirect(`${frontendUrl}/login`);
    }

    // Get referral code from session (only for non-linking operations)
    const pendingReferralCode = !isLinkingToExistingUser ? req.session.pendingReferralCode : null;
    let validatedReferral = null;
    
    // Validate referral code if present (only for signup/login, not linking)
    if (pendingReferralCode) {
      try {
        validatedReferral = await ReferralService.validateReferralCode(pendingReferralCode);
        console.log(`Valid referral code ${pendingReferralCode} for GitHub signup`);
      } catch (error) {
        console.error('Referral validation error during GitHub OAuth:', error);
        req.session.oauthError = `Invalid referral code: ${error.message}`;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login`);
      }
    }

    // Handle linking to existing user first
    if (isLinkingToExistingUser) {
      // Check if GitHub account was used by another user
      const userWithGithubHistory = await User.findByGithubId(githubUser.id.toString());
      
      if (userWithGithubHistory && userWithGithubHistory._id.toString() !== linkingUser._id.toString()) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        req.session.githubError = 'This GitHub account has been previously used and cannot be linked to another account.';
        return res.redirect(`${frontendUrl}/settings`);
      }

      // Check if user already has a different GitHub account linked
      const currentGithubAuth = await GitHubAuth.findOne({ user: linkingUser._id });
      if (currentGithubAuth && currentGithubAuth.githubId !== githubUser.id.toString()) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        req.session.githubError = 'You already have a different GitHub account linked. Please unlink it first.';
        return res.redirect(`${frontendUrl}/settings`);
      }

      // Check if the GitHub email is in deleted accounts (for linking)
      const deletedByEmail = await DeletedAccount.findOne({ email: primaryEmail.email.toLowerCase() });
      if (deletedByEmail) {
        console.log('GitHub email found in deleted accounts during linking, preventing link:', primaryEmail.email);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        req.session.githubError = 'This GitHub account\'s email was previously associated with a deleted account and cannot be linked.';
        return res.redirect(`${frontendUrl}/settings`);
      }

      // Link GitHub to existing user
      linkingUser.addGithubToHistory({
        githubId: githubUser.id.toString(),
        username: githubUser.login
      });
      await linkingUser.save();

      // Update GitHub auth record
      await GitHubAuth.findOneAndUpdate(
        { user: linkingUser._id },
        {
          githubId: githubUser.id.toString(),
          username: githubUser.login,
          email: primaryEmail.email.toLowerCase(),
          name: githubUser.name || githubUser.login,
          avatarUrl: githubUser.avatar_url,
          profileUrl: githubUser.html_url,
          accessToken: access_token,
          publicRepos: githubUser.public_repos || 0,
          followers: githubUser.followers || 0,
          following: githubUser.following || 0,
          lastSynced: new Date()
        },
        { upsert: true }
      );

      try {
        await sendGithubLinkedEmail(linkingUser.email, linkingUser.name, githubUser.login, deviceInfo, clientIp);
        console.log('GitHub linked email sent successfully');
      } catch (emailError) {
        console.error('Failed to send GitHub linked email:', emailError);
      }

      req.session.githubSuccess = 'GitHub account linked successfully!';
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/settings`);
    }

    // Regular OAuth flow (login/signup) - not linking
    // Check if user exists by GitHub ID first
    let user = await User.findByGithubId(githubUser.id.toString());
    if (!user.isActive) {
  req.session.oauthError = 'Your account has been suspended. Please contact support for assistance.';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return res.redirect(`${frontendUrl}/login`);
}

    if (user) {
      // Existing user logging in with GitHub
      console.log(`GitHub login for existing user: ${user.email}`);
      
      // Update GitHub history
      user.addGithubToHistory({
        githubId: githubUser.id.toString(),
        username: githubUser.login
      });

      // Check for 2FA
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
            accessToken: access_token,
            publicRepos: githubUser.public_repos || 0,
            followers: githubUser.followers || 0,
            following: githubUser.following || 0
          },
          deviceInfo,
          clientIp,
          referralCode: pendingReferralCode || null
        }, process.env.JWT_SECRET, { expiresIn: '10m' });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/oauth-2fa?tempToken=${tempToken}`);
      }

      // Update last login and GitHub auth
      user.lastLogin = new Date();
      user.lastLoginIp = clientIp;
      await user.save();

      await GitHubAuth.findOneAndUpdate(
        { user: user._id },
        {
          githubId: githubUser.id.toString(),
          username: githubUser.login,
          email: primaryEmail.email.toLowerCase(),
          name: githubUser.name || githubUser.login,
          avatarUrl: githubUser.avatar_url,
          profileUrl: githubUser.html_url,
          accessToken: access_token,
          publicRepos: githubUser.public_repos || 0,
          followers: githubUser.followers || 0,
          following: githubUser.following || 0,
          lastSynced: new Date()
        },
        { upsert: true }
      );

      // Create session
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

      // Clear referral code from session
      delete req.session.pendingReferralCode;

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=login`);

    } else {
      // Check if user exists by email
      user = await User.findOne({ email: primaryEmail.email.toLowerCase() });
      
      if (user) {
        // Existing user with different GitHub account
        console.log(`Linking new GitHub ${githubUser.login} to existing email user: ${user.email}`);
        
        // Add GitHub to history
        user.addGithubToHistory({
          githubId: githubUser.id.toString(),
          username: githubUser.login
        });

        // Check for 2FA
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
              accessToken: access_token,
              publicRepos: githubUser.public_repos || 0,
              followers: githubUser.followers || 0,
              following: githubUser.following || 0
            },
            deviceInfo,
            clientIp,
            referralCode: pendingReferralCode || null
          }, process.env.JWT_SECRET, { expiresIn: '10m' });

          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          return res.redirect(`${frontendUrl}/oauth-2fa?tempToken=${tempToken}`);
        }

        // Update user
        user.lastLogin = new Date();
        user.lastLoginIp = clientIp;
        await user.save();

        // Update/create GitHub auth
        await GitHubAuth.findOneAndUpdate(
          { user: user._id },
          {
            githubId: githubUser.id.toString(),
            username: githubUser.login,
            email: primaryEmail.email.toLowerCase(),
            name: githubUser.name || githubUser.login,
            avatarUrl: githubUser.avatar_url,
            profileUrl: githubUser.html_url,
            accessToken: access_token,
            publicRepos: githubUser.public_repos || 0,
            followers: githubUser.followers || 0,
            following: githubUser.following || 0,
            lastSynced: new Date()
          },
          { upsert: true }
        );

        // Create session
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

        // Clear referral code from session
        delete req.session.pendingReferralCode;

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=login`);

      } else {
        // Brand new user creation
        console.log('Creating new user via GitHub OAuth:', primaryEmail.email);

        // Check if email is in deleted accounts
        const deletedByEmail = await DeletedAccount.findOne({ email: primaryEmail.email.toLowerCase() });
        if (deletedByEmail) {
          console.log('Email found in deleted accounts, preventing new account creation:', primaryEmail.email);
          req.session.oauthError = 'This email address was previously associated with a deleted account and cannot be used to create new accounts.';
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          return res.redirect(`${frontendUrl}/login`);
        }
        
        // Create new user
        user = new User({
          name: githubUser.name || githubUser.login,
          email: primaryEmail.email.toLowerCase(),
          isVerified: true, // GitHub users are considered verified
          role: 1,
          isActive: true,
          lastLogin: new Date(),
          createdIp: clientIp,
          lastLoginIp: clientIp,
          githubId: githubUser.id.toString(),
          githubIdHistory: [{
            githubId: githubUser.id.toString(),
            username: githubUser.login,
            linkedAt: new Date(),
            unlinkedAt: null,
            isCurrentlyLinked: true
          }],
          remainingScans: 0 // Will be set after applying referral or default
        });
        
        await user.save();
        console.log(`Created new user via GitHub: ${user.email}`);

        // Create GitHub auth record
        await GitHubAuth.create({
          user: user._id,
          githubId: githubUser.id.toString(),
          username: githubUser.login,
          email: primaryEmail.email.toLowerCase(),
          name: githubUser.name || githubUser.login,
          avatarUrl: githubUser.avatar_url,
          profileUrl: githubUser.html_url,
          accessToken: access_token,
          publicRepos: githubUser.public_repos || 0,
          followers: githubUser.followers || 0,
          following: githubUser.following || 0,
          lastSynced: new Date()
        });
        
        // Apply referral code if provided and validated
        let referralApplied = false;
        if (pendingReferralCode && validatedReferral) {
          try {
            await ReferralService.applyReferralCode(pendingReferralCode, user._id, true);
            referralApplied = true;
            console.log(`Applied referral code ${pendingReferralCode} to new GitHub user ${user.email}`);
          } catch (referralError) {
            console.error('Error applying referral code to GitHub user:', referralError);
            // Don't fail the OAuth flow if referral application fails
          }
        }

        // Send welcome email
        try {
          await sendWelcomeEmail(user.email, user.name);
        } catch (emailError) {
          console.error('Failed to send GitHub signup welcome email:', emailError);
        }

        // Create session
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

        // Clear referral code from session
        delete req.session.pendingReferralCode;

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/oauth-success?token=${token}&type=signup${referralApplied ? '&referral=applied' : ''}`);
      }
    }

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Check if this was a linking operation in the error case
    if (state) {
      try {
        const decoded = jwt.verify(state, process.env.JWT_SECRET);
        if (decoded.user_id) {
          // This was a linking operation - store error in session
          req.session.githubError = 'GitHub authentication failed. Please try again.';
          return res.redirect(`${frontendUrl}/settings`);
        }
      } catch (stateErr) {
        // State token invalid, treat as regular OAuth error
      }
    }
    
    // Regular OAuth error
    req.session.oauthError = 'Authentication failed. Please try again.';
    res.redirect(`${frontendUrl}/login`);
  }
});




/**
 * Step 3: FIXED - Return auth URL instead of redirecting
 */
router.get('/link', authMiddleware, (req, res) => {
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


// Add these routes to your existing githubAuth.js file

/**
 * Get user's GitHub repositories
 */
router.get('/repositories', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const githubAuth = await GitHubAuth.findOne({ user: userId });
    
    if (!githubAuth) {
      return res.status(404).json({ 
        success: false, 
        message: 'GitHub account not connected' 
      });
    }

    // Fetch repositories from GitHub API
    const reposResponse = await axios.get('https://api.github.com/user/repos', {
      headers: {
        'Authorization': `token ${githubAuth.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      params: {
        sort: 'updated',
        per_page: 100,
        affiliation: 'owner'
      }
    });

    // Filter and format repositories
    const repositories = reposResponse.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      language: repo.language,
      stargazersCount: repo.stargazers_count,
      forksCount: repo.forks_count,
      updatedAt: repo.updated_at,
      size: repo.size,
      defaultBranch: repo.default_branch,
      isPrivate: repo.private,
      htmlUrl: repo.html_url,
      cloneUrl: repo.clone_url
    }));

    // Filter for potential MERN stack projects (optional)
    const mernRepos = repositories.filter(repo => {
      const lang = repo.language?.toLowerCase();
      const name = repo.name.toLowerCase();
      const desc = repo.description?.toLowerCase() || '';
      
      return lang === 'javascript' || 
             lang === 'typescript' ||
             name.includes('react') ||
             name.includes('node') ||
             name.includes('express') ||
             desc.includes('react') ||
             desc.includes('node') ||
             desc.includes('express') ||
             desc.includes('mongodb') ||
             desc.includes('mern');
    });

    res.json({
      success: true,
      repositories: repositories,
      mernRepos: mernRepos,
      total: repositories.length
    });

  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'GitHub authentication expired. Please reconnect your account.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch repositories'
    });
  }
});

/**
 * Import a GitHub repository as a project
 */
// router.post('/import-repository', authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user.user_id;
//     const { repositoryId, repositoryName, repositoryFullName, description, cloneUrl } = req.body;

//     if (!repositoryId || !repositoryName || !cloneUrl) {
//       return res.status(400).json({
//         success: false,
//         message: 'Repository ID, name, and clone URL are required'
//       });
//     }

//     const githubAuth = await GitHubAuth.findOne({ user: userId });
//     if (!githubAuth) {
//       return res.status(404).json({
//         success: false,
//         message: 'GitHub account not connected'
//       });
//     }

//     // Check if this repository has already been imported
//     const existingProject = await Project.findOne({
//       user: userId,
//       'githubInfo.repositoryId': repositoryId
//     });

//     // if (existingProject) {
//     //   return res.status(409).json({
//     //     success: false,
//     //     message: 'This repository has already been imported'
//     //   });
//     // }

//     // Create project record
//     const project = new Project({
//       user: userId,
//       source: 'github',
//       projectName: repositoryName,
//       description: description || `Imported from GitHub: ${repositoryFullName}`,
//       analysisStatus: 'pending',
//       githubInfo: {
//         repositoryId: repositoryId,
//         repositoryName: repositoryName,
//         repositoryFullName: repositoryFullName,
//         cloneUrl: cloneUrl,
//         importedAt: new Date()
//       }
//     });

//     await project.save();

//     res.json({
//       success: true,
//       message: 'Repository imported successfully',
//       project: {
//         id: project._id,
//         name: project.projectName,
//         source: project.source,
//         status: project.analysisStatus,
//         createdAt: project.createdAt,
//         githubInfo: project.githubInfo
//       }
//     });

//     // TODO: Trigger background job to clone repository and analyze code
//     console.log(`GitHub repository imported: ${repositoryFullName} by user ${userId}`);

//   } catch (error) {
//     console.error('Error importing GitHub repository:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to import repository'
//     });
//   }
// });



// Helper function to remove .git directory and other git-related files


// Required imports at the top of your file
// const downloadFile = async (url, filePath, headers = {}) => {
//   return new Promise((resolve, reject) => {
//     const file = fsSync.createWriteStream(filePath);
    
//     const request = https.get(url, { headers }, (response) => {
//       if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
//         console.log(`Redirecting to: ${response.headers.location}`);
//         file.close();
//         return downloadFile(response.headers.location, filePath, headers)
//           .then(resolve)
//           .catch(reject);
//       }
      
//       if (response.statusCode !== 200) {
//         file.close();
//         return reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
//       }
      
//       response.pipe(file);
      
//       file.on('finish', () => {
//         file.close();
//         resolve();
//       });
      
//       file.on('error', (error) => {
//         file.close();
//         fsSync.unlink(filePath, () => {});
//         reject(error);
//       });
//     });
    
//     request.on('error', (error) => {
//       file.close();
//       reject(error);
//     });
    
//     request.setTimeout(300000, () => {
//       request.abort();
//       file.close();
//       reject(new Error('Download timeout'));
//     });
//   });
// };

// const moveDirectoryContents = async (sourceDir, targetDir) => {
//   try {
//     const items = await fs.readdir(sourceDir);
    
//     for (const item of items) {
//       const sourcePath = path.join(sourceDir, item);
//       const targetPath = path.join(targetDir, item);
      
//       try {
//         await fs.rename(sourcePath, targetPath);
//       } catch (error) {
//         const stats = await fs.stat(sourcePath);
//         if (stats.isDirectory()) {
//           await fs.mkdir(targetPath, { recursive: true });
//           await moveDirectoryContents(sourcePath, targetPath);
//           await fs.rm(sourcePath, { recursive: true, force: true });
//         } else {
//           await fs.copyFile(sourcePath, targetPath);
//           await fs.unlink(sourcePath);
//         }
//       }
//     }
//   } catch (error) {
//     console.error('Error moving directory contents:', error);
//     throw error;
//   }
// };

// // Enhanced function to find package.json files recursively
// const findPackageJsonFiles = async (dirPath, maxDepth = 40, currentDepth = 0) => {
//   const packageJsonFiles = [];
  
//   if (currentDepth > maxDepth) {
//     return packageJsonFiles;
//   }
  
//   try {
//     const items = await fs.readdir(dirPath, { withFileTypes: true });
    
//     for (const item of items) {
//       const fullPath = path.join(dirPath, item.name);
      
//       if (item.isFile() && item.name === 'package.json') {
//         packageJsonFiles.push(fullPath);
//       } else if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
//         const subPackageFiles = await findPackageJsonFiles(fullPath, maxDepth, currentDepth + 1);
//         packageJsonFiles.push(...subPackageFiles);
//       }
//     }
//   } catch (error) {
//     console.error(`Error reading directory ${dirPath}:`, error);
//   }
  
//   return packageJsonFiles;
// };

// // Enhanced function to detect non-JavaScript backend files
// const detectNonJSBackendFiles = async (dirPath, maxDepth = 30, currentDepth = 0) => {
//   const nonJSBackendFiles = [];
  
//   if (currentDepth > maxDepth) {
//     return nonJSBackendFiles;
//   }
  
//   // Common non-JavaScript backend file patterns
//   const backendPatterns = {
//     python: ['.py', 'requirements.txt', 'Pipfile', 'pyproject.toml', 'setup.py'],
//     java: ['.java', 'pom.xml', 'build.gradle', 'gradle.properties'],
//     php: ['.php', 'composer.json', 'composer.lock'],
//     csharp: ['.cs', '.csproj', '.sln', 'packages.config'],
//     go: ['.go', 'go.mod', 'go.sum'],
//     ruby: ['.rb', 'Gemfile', 'Gemfile.lock'],
//     rust: ['.rs', 'Cargo.toml', 'Cargo.lock']
//   };
  
//   try {
//     const items = await fs.readdir(dirPath, { withFileTypes: true });
    
//     for (const item of items) {
//       const fullPath = path.join(dirPath, item.name);
      
//       if (item.isFile()) {
//         // Check file extensions and specific files
//         for (const [language, patterns] of Object.entries(backendPatterns)) {
//           for (const pattern of patterns) {
//             if (pattern.startsWith('.') && item.name.endsWith(pattern)) {
//               nonJSBackendFiles.push({ file: fullPath, language, pattern });
//             } else if (!pattern.startsWith('.') && item.name === pattern) {
//               nonJSBackendFiles.push({ file: fullPath, language, pattern });
//             }
//           }
//         }
//       } else if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
//         const subBackendFiles = await detectNonJSBackendFiles(fullPath, maxDepth, currentDepth + 1);
//         nonJSBackendFiles.push(...subBackendFiles);
//       }
//     }
//   } catch (error) {
//     console.error(`Error detecting backend files in ${dirPath}:`, error);
//   }
  
//   return nonJSBackendFiles;
// };

// // Enhanced function to find the actual project root
// const findProjectRoot = async (extractedPath) => {
//   const packageJsonFiles = await findPackageJsonFiles(extractedPath);
  
//   if (packageJsonFiles.length === 0) {
//     return null;
//   }
  
//   // Strategy: Find the most likely project root
//   // 1. Look for typical MERN structure patterns
//   // 2. Prioritize directories with both frontend/backend or client/server
//   // 3. Fall back to the shallowest package.json
  
//   const projectRoots = new Set();
//   const structureAnalysis = {};
  
//   for (const packageJsonPath of packageJsonFiles) {
//     const dir = path.dirname(packageJsonPath);
//     const relativePath = path.relative(extractedPath, dir);
//     const depth = relativePath === '' ? 0 : relativePath.split(path.sep).length;
    
//     try {
//       const packageContent = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
//       const parentDir = path.dirname(dir);
//       const siblingDirs = await fs.readdir(parentDir, { withFileTypes: true });
//       const siblingNames = siblingDirs.filter(d => d.isDirectory()).map(d => d.name);
      
//       // Analyze directory structure
//       const dirName = path.basename(dir);
//       const hasTypicalFrontendStructure = siblingNames.some(name => 
//         ['backend', 'server', 'api'].includes(name.toLowerCase())
//       );
//       const hasTypicalBackendStructure = siblingNames.some(name => 
//         ['frontend', 'client', 'web', 'ui'].includes(name.toLowerCase())
//       );
      
//       structureAnalysis[dir] = {
//         depth,
//         dirName,
//         packageJson: packageContent,
//         siblings: siblingNames,
//         hasTypicalFrontendStructure,
//         hasTypicalBackendStructure,
//         isMernLike: hasTypicalFrontendStructure || hasTypicalBackendStructure
//       };
      
//       // If this looks like a MERN structure, consider its parent as project root
//       if (hasTypicalFrontendStructure || hasTypicalBackendStructure) {
//         projectRoots.add(parentDir);
//       } else {
//         projectRoots.add(dir);
//       }
//     } catch (error) {
//       console.error(`Error analyzing package.json at ${packageJsonPath}:`, error);
//     }
//   }
  
//   // Choose the best project root
//   if (projectRoots.size === 0) {
//     return path.dirname(packageJsonFiles[0]); // Fallback to first package.json
//   }
  
//   // Prefer roots with MERN-like structure, then shallowest
//   const rootsArray = Array.from(projectRoots).map(root => ({
//     path: root,
//     depth: path.relative(extractedPath, root).split(path.sep).length,
//     hasMernStructure: Object.values(structureAnalysis).some(analysis => 
//       path.dirname(analysis.dirName) === root && analysis.isMernLike
//     )
//   }));
  
//   rootsArray.sort((a, b) => {
//     if (a.hasMernStructure && !b.hasMernStructure) return -1;
//     if (!a.hasMernStructure && b.hasMernStructure) return 1;
//     return a.depth - b.depth;
//   });
  
//   return rootsArray[0].path;
// };

// // Enhanced validation function
// const validateProject = async (projectPath) => {
//   try {
//     console.log(`Starting validation of project at: ${projectPath}`);
    
//     // Find all package.json files
//     const packageJsonFiles = await findPackageJsonFiles(projectPath);
//     console.log(`Found ${packageJsonFiles.length} package.json files`);
    
//     if (packageJsonFiles.length === 0) {
//       throw new Error('Invalid project structure: No package.json files found in the repository');
//     }
    
//     // Detect non-JavaScript backend files
//     const nonJSBackendFiles = await detectNonJSBackendFiles(projectPath);
//     console.log(`Found ${nonJSBackendFiles.length} non-JavaScript backend files`);
    
//     // Group non-JS files by language
//     const backendLanguages = [...new Set(nonJSBackendFiles.map(f => f.language))];
    
//     // If we have significant non-JavaScript backend files, reject
//     if (nonJSBackendFiles.length > 0) {
//       const pythonFiles = nonJSBackendFiles.filter(f => f.language === 'python');
//       const javaFiles = nonJSBackendFiles.filter(f => f.language === 'java');
//       const phpFiles = nonJSBackendFiles.filter(f => f.language === 'php');
//       const csharpFiles = nonJSBackendFiles.filter(f => f.language === 'csharp');
      
//       // Be more strict - any backend files in other languages should be rejected
//       if (pythonFiles.length > 0 || javaFiles.length > 0 || phpFiles.length > 0 || csharpFiles.length > 0) {
//         throw new Error(
//           `Invalid project structure: This repository contains ${backendLanguages.join(', ')} backend files. ` +
//           `Only MERN stack projects (MongoDB, Express.js, React, Node.js) are supported. ` +
//           `Found ${nonJSBackendFiles.length} non-JavaScript backend files.`
//         );
//       }
//     }
    
//     // Find the most likely project root
//     const actualProjectRoot = await findProjectRoot(projectPath);
//     if (!actualProjectRoot) {
//       throw new Error('Could not determine project root directory');
//     }
    
//     console.log(`Determined project root: ${actualProjectRoot}`);
    
//     // Move project files to the top level if they're nested
//     if (actualProjectRoot !== projectPath) {
//       console.log(`Moving project files from ${actualProjectRoot} to ${projectPath}`);
//       await moveDirectoryContents(actualProjectRoot, projectPath);
//     }
    
//     // Re-analyze the structure after potential restructuring
//     const items = await fs.readdir(projectPath);
//     const hasPackageJson = items.includes('package.json');
//     const hasSrcDirectory = items.includes('src');
    
//     // Analyze project type from the main package.json
//     let type = 'unknown';
//     let mainPackageJson = null;
    
//     if (hasPackageJson) {
//       const packageJsonPath = path.join(projectPath, 'package.json');
//       const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
//       mainPackageJson = JSON.parse(packageJsonContent);
      
//       const deps = { ...mainPackageJson.dependencies, ...mainPackageJson.devDependencies };
      
//       // More sophisticated type detection
//       if (deps.react || deps['@types/react'] || deps['react-dom']) {
//         if (deps.express || deps.mongoose || deps['@nestjs/core']) {
//           type = 'mern'; // Full-stack
//         } else {
//           type = 'react'; // Frontend only
//         }
//       } else if (deps.express) {
//         if (deps.mongoose) {
//           type = 'mern'; // Backend with MongoDB
//         } else {
//           type = 'express'; // Express backend
//         }
//       } else if (deps.next) {
//         type = 'nextjs';
//       } else if (deps.vue || deps['@vue/core']) {
//         type = 'vue';
//       } else if (mainPackageJson.scripts && Object.keys(mainPackageJson.scripts).length > 0) {
//         type = 'node'; // Generic Node.js project
//       }
//     }
    
//     // Additional validation for MERN projects
//     const warnings = [];
    
//     // Check for typical MERN structure
//     const hasTypicalFolders = items.some(item => 
//       ['frontend', 'backend', 'client', 'server', 'api'].includes(item.toLowerCase())
//     );
    
//     if (type === 'unknown') {
//       warnings.push('Could not determine project type from dependencies');
//     }
    
//     if (!hasSrcDirectory && !hasTypicalFolders && type === 'react') {
//       warnings.push('React project found but no src directory detected');
//     }
    
//     console.log(`Project validation completed - Type: ${type}, Warnings: ${warnings.length}`);
    
//     return {
//       type: type,
//       warnings: warnings,
//       structure: items,
//       hasSrcDirectory: hasSrcDirectory,
//       hasTypicalFolders: hasTypicalFolders,
//       actualProjectRoot: actualProjectRoot,
//       packageJsonCount: packageJsonFiles.length,
//       mainPackageJson: mainPackageJson,
//       fileTypeAnalysis: {
//         hasPackageJson: hasPackageJson,
//         totalFiles: items.length,
//         nonJSBackendFiles: nonJSBackendFiles.length,
//         backendLanguages: backendLanguages
//       }
//     };
//   } catch (error) {
//     console.error('Validation error:', error);
//     throw new Error(`Validation failed: ${error.message}`);
//   }
// };

// const downloadGitHubRepository = async (repositoryFullName, targetPath, accessToken = null) => {
//   try {
//     console.log(`Downloading repository as ZIP to: ${targetPath}`);
    
//     await fs.mkdir(targetPath, { recursive: true });
    
//     const repoInfoUrl = `https://api.github.com/repos/${repositoryFullName}`;
//     console.log(`Getting repository info from: ${repoInfoUrl}`);
    
//     const apiHeaders = {
//       'User-Agent': 'Smellify-Backend',
//       'Accept': 'application/vnd.github.v3+json'
//     };
    
//     if (accessToken) {
//       apiHeaders['Authorization'] = `Bearer ${accessToken}`;
//     }
    
//     const repoInfo = await new Promise((resolve, reject) => {
//       https.get(repoInfoUrl, { headers: apiHeaders }, (response) => {
//         let data = '';
        
//         response.on('data', chunk => {
//           data += chunk;
//         });
        
//         response.on('end', () => {
//           if (response.statusCode === 200) {
//             try {
//               resolve(JSON.parse(data));
//             } catch (error) {
//               reject(new Error(`Failed to parse repository info: ${error.message}`));
//             }
//           } else {
//             reject(new Error(`Failed to get repository info: HTTP ${response.statusCode}`));
//           }
//         });
//       }).on('error', reject);
//     });
    
//     const defaultBranch = repoInfo.default_branch || 'main';
//     console.log(`Repository default branch: ${defaultBranch}`);
    
//     const downloadUrl = `https://codeload.github.com/${repositoryFullName}/zip/refs/heads/${defaultBranch}`;
//     console.log(`Downloading from: ${downloadUrl}`);
    
//     const headers = {
//       'User-Agent': 'Smellify-Backend'
//     };
    
//     const zipPath = path.join(targetPath, 'repo.zip');
//     await downloadFile(downloadUrl, zipPath, headers);
    
//     console.log(`Repository downloaded as ZIP: ${zipPath}`);
    
//     const AdmZip = require('adm-zip');
    
//     const zip = new AdmZip(zipPath);
//     const entries = zip.getEntries();
    
//     if (entries.length === 0) {
//       throw new Error('Downloaded ZIP file is empty');
//     }
    
//     const tempExtractPath = path.join(targetPath, 'temp-extract');
//     await fs.mkdir(tempExtractPath, { recursive: true });
    
//     zip.extractAllTo(tempExtractPath, true);
    
//     const tempItems = await fs.readdir(tempExtractPath);
//     const repoFolder = tempItems.find(item => !item.startsWith('.') && !item.includes('__MACOSX'));
    
//     if (!repoFolder) {
//       throw new Error('No repository folder found in extracted ZIP');
//     }
    
//     const repoFolderPath = path.join(tempExtractPath, repoFolder);
    
//     await moveDirectoryContents(repoFolderPath, targetPath);
    
//     await fs.rm(tempExtractPath, { recursive: true, force: true });
//     await fs.unlink(zipPath);
    
//     const extractedItems = await fs.readdir(targetPath);
//     const validItems = extractedItems.filter(item => 
//       !item.startsWith('.') && 
//       !item.includes('temp-')
//     );
    
//     if (validItems.length === 0) {
//       throw new Error('No valid files found after extraction');
//     }
    
//     console.log(`Successfully downloaded and extracted repository with ${validItems.length} items`);
    
//     return {
//       success: true,
//       extractedPath: targetPath,
//       itemCount: validItems.length
//     };
    
//   } catch (error) {
//     console.error('GitHub API download error:', error);
    
//     try {
//       await fs.rm(targetPath, { recursive: true, force: true });
//     } catch (cleanupError) {
//       console.error('Error cleaning up download:', cleanupError);
//     }
    
//     throw new Error(`Failed to download repository: ${error.message}`);
//   }
// };

// const processGitHubRepository = async (repositoryFullName, accessToken, repositoryName, description, userId) => {
//   try {
//     const projectDir = path.join(__dirname, '..', 'uploads', `github_${Date.now()}_${repositoryName}`);
    
//     const downloadResult = await downloadGitHubRepository(repositoryFullName, projectDir, accessToken);
    
//     const validation = await validateProject(projectDir);
//     const cleanup = await cleanupProject(projectDir);
    
//     return {
//       downloadedPath: projectDir,
//       validation: validation,
//       cleanup: cleanup
//     };
//   } catch (error) {
//     console.error('Error processing GitHub repository:', error);
//     throw error;
//   }
// };

// // Updated import-repository route
// router.post('/import-repository', authMiddleware, async (req, res) => {
//   let project = null;
//   let projectDir = null;
  
//   try {
//     const userId = req.user.user_id;
//     const { repositoryId, repositoryName, repositoryFullName, description, cloneUrl } = req.body;

//     if (!repositoryId || !repositoryName || !repositoryFullName) {
//       return res.status(400).json({
//         success: false,
//         message: 'Repository ID, name, and full name are required'
//       });
//     }

//     const githubAuth = await GitHubAuth.findOne({ user: userId });
//     if (!githubAuth) {
//       return res.status(404).json({
//         success: false,
//         message: 'GitHub account not connected'
//       });
//     }

//     console.log(`Starting import process for repository: ${repositoryFullName}`);

//     const processResult = await processGitHubRepository(
//       repositoryFullName,
//       githubAuth.accessToken,
//       repositoryName,
//       description,
//       userId
//     );

//     projectDir = processResult.downloadedPath;

//     console.log(`Repository processing completed successfully for: ${repositoryFullName}`);

//     project = new Project({
//       user: userId,
//       source: 'github',
//       extractedPath: processResult.downloadedPath,
//       projectName: repositoryName,
//       description: description || `Imported from GitHub: ${repositoryFullName}`,
//       analysisStatus: 'processing',
//       projectType: processResult.validation.type,
//       validationResult: processResult.validation,
//       cleanupResult: processResult.cleanup,
//       githubInfo: {
//         repositoryId: repositoryId,
//         repositoryName: repositoryName,
//         repositoryFullName: repositoryFullName,
//         cloneUrl: cloneUrl,
//         importedAt: new Date()
//       }
//     });

//     await project.save();

//     res.json({
//       success: true,
//       message: 'Repository imported, downloaded, validated, and cleaned successfully',
//       project: {
//         id: project._id,
//         name: project.projectName,
//         source: project.source,
//         type: project.projectType,
//         status: project.analysisStatus,
//         validation: {
//           type: processResult.validation.type,
//           warnings: processResult.validation.warnings,
//           structure: processResult.validation.structure,
//           hasSrcDirectory: processResult.validation.hasSrcDirectory,
//           fileTypeAnalysis: processResult.validation.fileTypeAnalysis,
//           packageJsonCount: processResult.validation.packageJsonCount,
//           actualProjectRoot: processResult.validation.actualProjectRoot
//         },
//         cleanup: {
//           itemsRemoved: processResult.cleanup.removed.length,
//           nodeModulesRemoved: processResult.cleanup.nodeModulesRemoved.length,
//           errors: processResult.cleanup.errors.length
//         },
//         githubInfo: project.githubInfo,
//         createdAt: project.createdAt
//       }
//     });

//     console.log(`GitHub project processed successfully: ${repositoryName} (${processResult.validation.type}) by user ${userId}`);
//     console.log(`Removed ${processResult.cleanup.nodeModulesRemoved.length} node_modules directories`);

//   } catch (error) {
//     console.error('Error importing and processing GitHub repository:', error);
    
//     if (project && project._id) {
//       try {
//         await Project.findByIdAndDelete(project._id);
//       } catch (deleteError) {
//         console.error('Error deleting project record:', deleteError);
//       }
//     }
    
//     if (projectDir) {
//       try {
//         await fs.rm(projectDir, { recursive: true, force: true });
//       } catch (cleanupError) {
//         console.error('Error cleaning up download:', cleanupError);
//       }
//     }
    
//     if (error.message.includes('Invalid project structure')) {
//       return res.status(400).json({
//         success: false,
//         message: 'Repository validation failed',
//         error: error.message,
//         requirements: [
//           'Repository must contain at least one package.json file',
//           'Repository must be a valid Node.js/React/MERN project',
//           'Repository must not contain Python, Java, PHP, C#, or other non-JavaScript backend files',
//           'Repository structure should follow standard JavaScript project conventions'
//         ]
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to import and process repository'
//     });
//   }
// });








const downloadFile = async (url, filePath, headers = {}) => {
  return new Promise((resolve, reject) => {
    const file = fsSync.createWriteStream(filePath);
    
    const request = https.get(url, { headers }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        console.log(`Redirecting to: ${response.headers.location}`);
        file.close();
        return downloadFile(response.headers.location, filePath, headers)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        return reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (error) => {
        file.close();
        fsSync.unlink(filePath, () => {});
        reject(error);
      });
    });
    
    request.on('error', (error) => {
      file.close();
      reject(error);
    });
    
    request.setTimeout(300000, () => {
      request.abort();
      file.close();
      reject(new Error('Download timeout'));
    });
  });
};

const moveDirectoryContents = async (sourceDir, targetDir) => {
  try {
    const items = await fs.readdir(sourceDir);
    
    for (const item of items) {
      const sourcePath = path.join(sourceDir, item);
      const targetPath = path.join(targetDir, item);
      
      try {
        await fs.rename(sourcePath, targetPath);
      } catch (error) {
        const stats = await fs.stat(sourcePath);
        if (stats.isDirectory()) {
          await fs.mkdir(targetPath, { recursive: true });
          await moveDirectoryContents(sourcePath, targetPath);
          await fs.rm(sourcePath, { recursive: true, force: true });
        } else {
          await fs.copyFile(sourcePath, targetPath);
          await fs.unlink(sourcePath);
        }
      }
    }
  } catch (error) {
    console.error('Error moving directory contents:', error);
    throw error;
  }
};

// Enhanced function to find package.json files recursively
const findPackageJsonFiles = async (dirPath, maxDepth = 40, currentDepth = 0) => {
  const packageJsonFiles = [];
  
  if (currentDepth > maxDepth) {
    return packageJsonFiles;
  }
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isFile() && item.name === 'package.json') {
        packageJsonFiles.push(fullPath);
      } else if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        const subPackageFiles = await findPackageJsonFiles(fullPath, maxDepth, currentDepth + 1);
        packageJsonFiles.push(...subPackageFiles);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return packageJsonFiles;
};

// Enhanced function to detect non-JavaScript backend files
const detectNonJSBackendFiles = async (dirPath, maxDepth = 30, currentDepth = 0) => {
  const nonJSBackendFiles = [];
  
  if (currentDepth > maxDepth) {
    return nonJSBackendFiles;
  }
  
  // Common non-JavaScript backend file patterns
  const backendPatterns = {
    python: ['.py', 'requirements.txt', 'Pipfile', 'pyproject.toml', 'setup.py'],
    java: ['.java', 'pom.xml', 'build.gradle', 'gradle.properties'],
    php: ['.php', 'composer.json', 'composer.lock'],
    csharp: ['.cs', '.csproj', '.sln', 'packages.config'],
    go: ['.go', 'go.mod', 'go.sum'],
    ruby: ['.rb', 'Gemfile', 'Gemfile.lock'],
    rust: ['.rs', 'Cargo.toml', 'Cargo.lock']
  };
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isFile()) {
        // Check file extensions and specific files
        for (const [language, patterns] of Object.entries(backendPatterns)) {
          for (const pattern of patterns) {
            if (pattern.startsWith('.') && item.name.endsWith(pattern)) {
              nonJSBackendFiles.push({ file: fullPath, language, pattern });
            } else if (!pattern.startsWith('.') && item.name === pattern) {
              nonJSBackendFiles.push({ file: fullPath, language, pattern });
            }
          }
        }
      } else if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        const subBackendFiles = await detectNonJSBackendFiles(fullPath, maxDepth, currentDepth + 1);
        nonJSBackendFiles.push(...subBackendFiles);
      }
    }
  } catch (error) {
    console.error(`Error detecting backend files in ${dirPath}:`, error);
  }
  
  return nonJSBackendFiles;
};

// Function to clean up empty directories recursively
const cleanupEmptyDirectories = async (dirPath) => {
  try {
    const items = await fs.readdir(dirPath);
    
    // First, recursively clean subdirectories
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        await cleanupEmptyDirectories(itemPath);
      }
    }
    
    // Check if directory is now empty
    const updatedItems = await fs.readdir(dirPath);
    if (updatedItems.length === 0) {
      console.log(`Removing empty directory: ${dirPath}`);
      await fs.rmdir(dirPath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error cleaning up directory ${dirPath}:`, error);
    return false;
  }
};

// Enhanced function to find the actual project root
const findProjectRoot = async (extractedPath) => {
  const packageJsonFiles = await findPackageJsonFiles(extractedPath);
  
  if (packageJsonFiles.length === 0) {
    return null;
  }
  
  // Strategy: Find the most likely project root
  // 1. Look for typical MERN structure patterns
  // 2. Prioritize directories with both frontend/backend or client/server
  // 3. Fall back to the shallowest package.json
  
  const projectRoots = new Set();
  const structureAnalysis = {};
  
  for (const packageJsonPath of packageJsonFiles) {
    const dir = path.dirname(packageJsonPath);
    const relativePath = path.relative(extractedPath, dir);
    const depth = relativePath === '' ? 0 : relativePath.split(path.sep).length;
    
    try {
      const packageContent = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      const parentDir = path.dirname(dir);
      const siblingDirs = await fs.readdir(parentDir, { withFileTypes: true });
      const siblingNames = siblingDirs.filter(d => d.isDirectory()).map(d => d.name);
      
      // Analyze directory structure
      const dirName = path.basename(dir);
      const hasTypicalFrontendStructure = siblingNames.some(name => 
        ['backend', 'server', 'api'].includes(name.toLowerCase())
      );
      const hasTypicalBackendStructure = siblingNames.some(name => 
        ['frontend', 'client', 'web', 'ui'].includes(name.toLowerCase())
      );
      
      structureAnalysis[dir] = {
        depth,
        dirName,
        packageJson: packageContent,
        siblings: siblingNames,
        hasTypicalFrontendStructure,
        hasTypicalBackendStructure,
        isMernLike: hasTypicalFrontendStructure || hasTypicalBackendStructure
      };
      
      // If this looks like a MERN structure, consider its parent as project root
      if (hasTypicalFrontendStructure || hasTypicalBackendStructure) {
        projectRoots.add(parentDir);
      } else {
        projectRoots.add(dir);
      }
    } catch (error) {
      console.error(`Error analyzing package.json at ${packageJsonPath}:`, error);
    }
  }
  
  // Choose the best project root
  if (projectRoots.size === 0) {
    return path.dirname(packageJsonFiles[0]); // Fallback to first package.json
  }
  
  // Prefer roots with MERN-like structure, then shallowest
  const rootsArray = Array.from(projectRoots).map(root => ({
    path: root,
    depth: path.relative(extractedPath, root).split(path.sep).length,
    hasMernStructure: Object.values(structureAnalysis).some(analysis => 
      path.dirname(analysis.dirName) === root && analysis.isMernLike
    )
  }));
  
  rootsArray.sort((a, b) => {
    if (a.hasMernStructure && !b.hasMernStructure) return -1;
    if (!a.hasMernStructure && b.hasMernStructure) return 1;
    return a.depth - b.depth;
  });
  
  return rootsArray[0].path;
};

// Enhanced validation function
const validateProject = async (projectPath) => {
  try {
    console.log(`Starting validation of project at: ${projectPath}`);
    
    // Find all package.json files
    const packageJsonFiles = await findPackageJsonFiles(projectPath);
    console.log(`Found ${packageJsonFiles.length} package.json files`);
    

    if (packageJsonFiles.length === 0) {
      throw new Error('Invalid project structure: No package.json files found in the repository');
    }
    
    // Detect non-JavaScript backend files
    const nonJSBackendFiles = await detectNonJSBackendFiles(projectPath);
    console.log(`Found ${nonJSBackendFiles.length} non-JavaScript backend files`);
    
    // Group non-JS files by language
    const backendLanguages = [...new Set(nonJSBackendFiles.map(f => f.language))];
    
    // If we have significant non-JavaScript backend files, reject
    if (nonJSBackendFiles.length > 0) {
      const pythonFiles = nonJSBackendFiles.filter(f => f.language === 'python');
      const javaFiles = nonJSBackendFiles.filter(f => f.language === 'java');
      const phpFiles = nonJSBackendFiles.filter(f => f.language === 'php');
      const csharpFiles = nonJSBackendFiles.filter(f => f.language === 'csharp');
      
      // Be more strict - any backend files in other languages should be rejected
      if (pythonFiles.length > 0 || javaFiles.length > 0 || phpFiles.length > 0 || csharpFiles.length > 0) {
        throw new Error(
          `Invalid project structure: This repository contains ${backendLanguages.join(', ')} backend files. ` +
          `Only MERN stack projects (MongoDB, Express.js, React, Node.js) are supported. ` +
          `Found ${nonJSBackendFiles.length} non-JavaScript backend files.`
        );
      }
    }
    
    // Find the most likely project root
    const actualProjectRoot = await findProjectRoot(projectPath);
    if (!actualProjectRoot) {
      throw new Error('Could not determine project root directory');
    }
    
    console.log(`Determined project root: ${actualProjectRoot}`);
    
    // Move project files to the top level if they're nested
    if (actualProjectRoot !== projectPath) {
      console.log(`Moving project files from ${actualProjectRoot} to ${projectPath}`);
      await moveDirectoryContents(actualProjectRoot, projectPath);
      
      // Clean up empty directories after moving files
      console.log('Cleaning up empty directories...');
      await cleanupEmptyDirectories(projectPath);
    }
    
    // Re-analyze the structure after potential restructuring
    const items = await fs.readdir(projectPath);
    const hasPackageJson = items.includes('package.json');
    const hasSrcDirectory = items.includes('src');
    
    // Analyze project type from the main package.json
    let type = 'unknown';
    let mainPackageJson = null;
    
    if (hasPackageJson) {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      mainPackageJson = JSON.parse(packageJsonContent);
      
      const deps = { ...mainPackageJson.dependencies, ...mainPackageJson.devDependencies };
      
      // More sophisticated type detection
      if (deps.react || deps['@types/react'] || deps['react-dom']) {
        if (deps.express || deps.mongoose || deps['@nestjs/core']) {
          type = 'mern'; // Full-stack
        } else {
          type = 'react'; // Frontend only
        }
      } else if (deps.express) {
        if (deps.mongoose) {
          type = 'mern'; // Backend with MongoDB
        } else {
          type = 'express'; // Express backend
        }
      } else if (deps.next) {
        type = 'nextjs';
      } else if (deps.vue || deps['@vue/core']) {
        type = 'vue';
      } else if (mainPackageJson.scripts && Object.keys(mainPackageJson.scripts).length > 0) {
        type = 'node'; // Generic Node.js project
      }
    }
    
    // Additional validation for MERN projects
    const warnings = [];
    
    // Check for typical MERN structure
    const hasTypicalFolders = items.some(item => 
      ['frontend', 'backend', 'client', 'server', 'api'].includes(item.toLowerCase())
    );
    
    if (type === 'unknown') {
      warnings.push('Could not determine project type from dependencies');
    }
    
    if (!hasSrcDirectory && !hasTypicalFolders && type === 'react') {
      warnings.push('React project found but no src directory detected');
    }
    
    console.log(`Project validation completed - Type: ${type}, Warnings: ${warnings.length}`);
    
    return {
      type: type,
      warnings: warnings,
      structure: items,
      hasSrcDirectory: hasSrcDirectory,
      hasTypicalFolders: hasTypicalFolders,
      actualProjectRoot: actualProjectRoot,
      packageJsonCount: packageJsonFiles.length,
      mainPackageJson: mainPackageJson,
      fileTypeAnalysis: {
        hasPackageJson: hasPackageJson,
        totalFiles: items.length,
        nonJSBackendFiles: nonJSBackendFiles.length,
        backendLanguages: backendLanguages
      }
    };
  } catch (error) {
    console.error('Validation error:', error);
    throw new Error(`Validation failed: ${error.message}`);
  }
};

const downloadGitHubRepository = async (repositoryFullName, targetPath, accessToken = null) => {
  try {
    console.log(`Downloading repository as ZIP to: ${targetPath}`);
    
    await fs.mkdir(targetPath, { recursive: true });
    
    const repoInfoUrl = `https://api.github.com/repos/${repositoryFullName}`;
    console.log(`Getting repository info from: ${repoInfoUrl}`);
    
    const apiHeaders = {
      'User-Agent': 'Smellify-Backend',
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (accessToken) {
      apiHeaders['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const repoInfo = await new Promise((resolve, reject) => {
      https.get(repoInfoUrl, { headers: apiHeaders }, (response) => {
        let data = '';
        
        response.on('data', chunk => {
          data += chunk;
        });
        
        response.on('end', () => {
          if (response.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(new Error(`Failed to parse repository info: ${error.message}`));
            }
          } else {
            reject(new Error(`Failed to get repository info: HTTP ${response.statusCode}`));
          }
        });
      }).on('error', reject);
    });
    
    const defaultBranch = repoInfo.default_branch || 'main';
    console.log(`Repository default branch: ${defaultBranch}`);
    
    const downloadUrl = `https://codeload.github.com/${repositoryFullName}/zip/refs/heads/${defaultBranch}`;
    console.log(`Downloading from: ${downloadUrl}`);
    
    const headers = {
      'User-Agent': 'Smellify-Backend'
    };
    
    const zipPath = path.join(targetPath, 'repo.zip');
    await downloadFile(downloadUrl, zipPath, headers);
    
    console.log(`Repository downloaded as ZIP: ${zipPath}`);
    
    const AdmZip = require('adm-zip');
    
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();
    
    if (entries.length === 0) {
      throw new Error('Downloaded ZIP file is empty');
    }
    
    const tempExtractPath = path.join(targetPath, 'temp-extract');
    await fs.mkdir(tempExtractPath, { recursive: true });
    
    zip.extractAllTo(tempExtractPath, true);
    
    const tempItems = await fs.readdir(tempExtractPath);
    const repoFolder = tempItems.find(item => !item.startsWith('.') && !item.includes('__MACOSX'));
    
    if (!repoFolder) {
      throw new Error('No repository folder found in extracted ZIP');
    }
    
    const repoFolderPath = path.join(tempExtractPath, repoFolder);
    
    await moveDirectoryContents(repoFolderPath, targetPath);
    
    await fs.rm(tempExtractPath, { recursive: true, force: true });
    await fs.unlink(zipPath);
    
    const extractedItems = await fs.readdir(targetPath);
    const validItems = extractedItems.filter(item => 
      !item.startsWith('.') && 
      !item.includes('temp-')
    );
    
    if (validItems.length === 0) {
      throw new Error('No valid files found after extraction');
    }
    
    console.log(`Successfully downloaded and extracted repository with ${validItems.length} items`);
    
    return {
      success: true,
      extractedPath: targetPath,
      itemCount: validItems.length
    };
    
  } catch (error) {
    console.error('GitHub API download error:', error);
    
    try {
      await fs.rm(targetPath, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Error cleaning up download:', cleanupError);
    }
    
    throw new Error(`Failed to download repository: ${error.message}`);
  }
};

// Final fixed import-repository route - Complete cleanup including uploads folder
// router.post('/import-repository', authMiddleware, async (req, res) => {
//   let project = null;
//   let projectDir = null;
  
//   try {
//     const userId = req.user.user_id;
//     const { repositoryId, repositoryName, repositoryFullName, description, cloneUrl } = req.body;

//     if (!repositoryId || !repositoryName || !repositoryFullName) {
//       return res.status(400).json({
//         success: false,
//         message: 'Repository ID, name, and full name are required'
//       });
//     }

//     const githubAuth = await GitHubAuth.findOne({ user: userId });
//     if (!githubAuth) {
//       return res.status(404).json({
//         success: false,
//         message: 'GitHub account not connected'
//       });
//     }

//     console.log(`Starting import process for repository: ${repositoryFullName}`);

//     // Process the repository (download, validate, cleanup)
//     // The updated validateProject function will now throw errors for non-MERN projects
//     const processResult = await processGitHubRepository(
//       repositoryFullName,
//       githubAuth.accessToken,
//       repositoryName,
//       description,
//       userId
//     );

//     projectDir = processResult.downloadedPath;

//     console.log(`Repository processing completed successfully for: ${repositoryFullName}`);
//     console.log(`Validation passed - Project type: ${processResult.validation.type}`);
//     console.log(`MERN Compatible: ${processResult.validation.isMernCompatible}`);

//     // ONLY create and save project record AFTER successful validation and processing
//     project = new Project({
//       user: userId,
//       source: 'github',
//       extractedPath: processResult.downloadedPath,
//       projectName: repositoryName,
//       description: description || `Imported from GitHub: ${repositoryFullName}`,
//       analysisStatus: 'processing',
//       projectType: processResult.validation.type,
//       validationResult: processResult.validation,
//       cleanupResult: processResult.cleanup,
//       githubInfo: {
//         repositoryId: repositoryId,
//         repositoryName: repositoryName,
//         repositoryFullName: repositoryFullName,
//         cloneUrl: cloneUrl,
//         importedAt: new Date()
//       }
//     });

//     await project.save();
//     console.log(`✅ Project saved to database with ID: ${project._id}`);

//     res.json({
//       success: true,
//       message: 'Repository imported, downloaded, validated, and cleaned successfully',
//       project: {
//         id: project._id,
//         name: project.projectName,
//         source: project.source,
//         type: project.projectType,
//         status: project.analysisStatus,
//         validation: {
//           type: processResult.validation.type,
//           warnings: processResult.validation.warnings,
//           structure: processResult.validation.structure,
//           hasSrcDirectory: processResult.validation.hasSrcDirectory,
//           fileTypeAnalysis: processResult.validation.fileTypeAnalysis,
//           packageJsonCount: processResult.validation.packageJsonCount,
//           actualProjectRoot: processResult.validation.actualProjectRoot,
//           isMernCompatible: processResult.validation.isMernCompatible
//         },
//         cleanup: {
//           itemsRemoved: processResult.cleanup.removed.length,
//           nodeModulesRemoved: processResult.cleanup.nodeModulesRemoved.length,
//           errors: processResult.cleanup.errors.length
//         },
//         githubInfo: project.githubInfo,
//         createdAt: project.createdAt
//       }
//     });

//     console.log(`✅ GitHub project processed successfully: ${repositoryName} (${processResult.validation.type}) by user ${userId}`);
//     console.log(`Removed ${processResult.cleanup.nodeModulesRemoved.length} node_modules directories`);

//   } catch (error) {
//     console.error('❌ Error importing and processing GitHub repository:', error);
    
//     // Enhanced cleanup for failed imports
//     // Note: project will be null if validation failed, so no DB cleanup needed for validation failures
//     if (project && project._id) {
//       try {
//         console.log(`🗑️ Deleting project record from database: ${project._id}`);
//         await Project.findByIdAndDelete(project._id);
//         console.log('✅ Project record deleted successfully');
//       } catch (deleteError) {
//         console.error('❌ Error deleting project record:', deleteError);
//       }
//     } else {
//       console.log('ℹ️ No project record to delete (validation failed before DB save)');
//     }
    
//     // Always clean up the project directory on failure
//     // This will be set by processGitHubRepository even if validation fails
//     if (projectDir) {
//       try {
//         console.log(`🗑️ Cleaning up project directory: ${projectDir}`);
//         await fs.rm(projectDir, { recursive: true, force: true });
//         console.log('✅ Project directory cleaned up successfully');
//       } catch (cleanupError) {
//         console.error('❌ Error cleaning up project directory:', cleanupError);
//       }
//     }
    
//     // Handle validation failures specifically
//     if (error.message.includes('Invalid project structure') || error.message.includes('Validation failed')) {
//       console.log(`❌ Repository validation failed for: ${repositoryFullName} - ${error.message}`);
//       return res.status(400).json({
//         success: false,
//         message: 'Repository validation failed - Not a MERN project',
//         error: error.message,
//         requirements: [
//           'Repository must be a MERN stack project (MongoDB, Express.js, React, Node.js)',
//           'Supported frameworks: React, Next.js, Express.js, Node.js',
//           'Repository must contain JavaScript/TypeScript files (.js, .jsx, .ts, .tsx)',
//           'Repository must contain at least one package.json file',
//           'Repository must not contain Python, Java, PHP, C#, Go, Ruby, or Rust backend files',
//           'Repository structure should follow standard JavaScript project conventions'
//         ],
//         supportedProjectTypes: [
//           'React applications',
//           'Next.js applications', 
//           'Express.js backends',
//           'Node.js applications',
//           'Full-stack MERN applications',
//           'JavaScript/TypeScript projects'
//         ]
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to import and process repository'
//     });
//   }
// });

//routes/githubAuth.js docker wali logic
// router.post('/import-repository', authMiddleware, async (req, res) => {
//   let project = null;
//   let projectDir = null;
  
//   try {
//     const userId = req.user.user_id;
//     const { repositoryId, repositoryName, repositoryFullName, description, cloneUrl } = req.body;

//     if (!repositoryId || !repositoryName || !repositoryFullName) {
//       return res.status(400).json({
//         success: false,
//         message: 'Repository ID, name, and full name are required'
//       });
//     }

//     const githubAuth = await GitHubAuth.findOne({ user: userId });
//     if (!githubAuth) {
//       return res.status(404).json({
//         success: false,
//         message: 'GitHub account not connected'
//       });
//     }

//     console.log(`Starting import process for repository: ${repositoryFullName}`);

//     // Process the repository (download, validate, cleanup)
//     // The updated validateProject function will now throw errors for non-MERN projects
//     const processResult = await processGitHubRepository(
//       repositoryFullName,
//       githubAuth.accessToken,
//       repositoryName,
//       description,
//       userId
//     );

//     projectDir = processResult.downloadedPath;

//     console.log(`Repository processing completed successfully for: ${repositoryFullName}`);
//     console.log(`Validation passed - Project type: ${processResult.validation.type}`);
//     console.log(`MERN Compatible: ${processResult.validation.isMernCompatible}`);

//     // ====== SONARQUBE INTEGRATION START ======
//     // Create SonarQube project key
//     const sanitizedRepoName = repositoryName
//       .replace(/[^a-zA-Z0-9-_]/g, '-')
//       .toLowerCase();
//     const sonarProjectKey = `${sanitizedRepoName}-${Date.now()}`;
//     console.log(`Created SonarQube project key: ${sonarProjectKey}`);
//     // ====== SONARQUBE INTEGRATION END ======

//     // ONLY create and save project record AFTER successful validation and processing
//     project = new Project({
//       user: userId,
//       source: 'github',
//       extractedPath: processResult.downloadedPath,
//       projectName: repositoryName,
//       description: description || `Imported from GitHub: ${repositoryFullName}`,
//       analysisStatus: 'processing', // Keep as processing for SonarQube
//       projectType: processResult.validation.type,
//       validationResult: processResult.validation,
//       cleanupResult: processResult.cleanup,
//       sonarQubeProjectKey: sonarProjectKey, // ADD THIS - SonarQube project key
//       githubInfo: {
//         repositoryId: repositoryId,
//         repositoryName: repositoryName,
//         repositoryFullName: repositoryFullName,
//         cloneUrl: cloneUrl,
//         importedAt: new Date()
//       }
//     });

//     await project.save();
//     console.log(`✅ Project saved to database with ID: ${project._id}`);

//     // ====== SONARQUBE INTEGRATION START ======
//     // Create sonar-project.properties file
//     try {
//       console.log('Creating SonarQube configuration for GitHub project...');
//       await createSonarPropertiesFile(processResult.downloadedPath, sonarProjectKey);
//       console.log('✅ SonarQube configuration created successfully');
//     } catch (sonarConfigError) {
//       console.error('❌ Error creating SonarQube configuration:', sonarConfigError);
//       // Don't fail the whole import if SonarQube config fails
//       project.analysisStatus = 'failed';
//       project.sonarQubeResults = {
//         scanCompleted: false,
//         error: `Failed to create SonarQube configuration: ${sonarConfigError.message}`,
//         scanDate: new Date()
//       };
//       await project.save();
//     }
//     // ====== SONARQUBE INTEGRATION END ======

//     // Send response to user
//     res.json({
//       success: true,
//       message: 'Repository imported, downloaded, validated, and cleaned successfully. SonarQube analysis is in progress.',
//       project: {
//         id: project._id,
//         name: project.projectName,
//         source: project.source,
//         type: project.projectType,
//         status: project.analysisStatus,
//         sonarQubeProjectKey: sonarProjectKey, // ADD THIS
//         validation: {
//           type: processResult.validation.type,
//           warnings: processResult.validation.warnings,
//           structure: processResult.validation.structure,
//           hasSrcDirectory: processResult.validation.hasSrcDirectory,
//           fileTypeAnalysis: processResult.validation.fileTypeAnalysis,
//           packageJsonCount: processResult.validation.packageJsonCount,
//           actualProjectRoot: processResult.validation.actualProjectRoot,
//           isMernCompatible: processResult.validation.isMernCompatible
//         },
//         cleanup: {
//           itemsRemoved: processResult.cleanup.removed.length,
//           nodeModulesRemoved: processResult.cleanup.nodeModulesRemoved.length,
//           errors: processResult.cleanup.errors.length
//         },
//         githubInfo: project.githubInfo,
//         createdAt: project.createdAt
//       }
//     });

//     console.log(`✅ GitHub project processed successfully: ${repositoryName} (${processResult.validation.type}) by user ${userId}`);
//     console.log(`Removed ${processResult.cleanup.nodeModulesRemoved.length} node_modules directories`);

//     // ====== SONARQUBE INTEGRATION START ======
//     // Run SonarQube analysis asynchronously (after response is sent)
//     console.log('🚀 Starting SonarQube analysis for GitHub project in background...');
    
//     runSonarQubeAnalysis(processResult.downloadedPath, sonarProjectKey)
//       .then(async (scanResult) => {
//         console.log('✅ SonarQube scan completed for GitHub project, fetching results...');
        
//         // Wait a bit for SonarQube to process the results
//         await new Promise(resolve => setTimeout(resolve, 5000));
        
//         // Fetch analysis results from SonarQube
//         const analysisResults = await fetchSonarQubeResults(sonarProjectKey);
        
//         // Update project with completed status and results
//         const updatedProject = await Project.findById(project._id);
//         if (updatedProject) {
//           updatedProject.analysisStatus = 'completed';
//           updatedProject.sonarQubeResults = {
//             scanCompleted: true,
//             scanDate: new Date(),
//             issues: analysisResults?.issues || [],
//             metrics: analysisResults?.metrics || [],
//             totalIssues: analysisResults?.total || 0
//           };
//           updatedProject.githubInfo.lastSynced = new Date();
//           await updatedProject.save();
          
//           console.log(`✅ GitHub project analysis completed: ${sonarProjectKey} - Found ${analysisResults?.total || 0} issues`);
//         } else {
//           console.warn('⚠️ Project not found when trying to update SonarQube results');
//         }
//       })
//       .catch(async (error) => {
//         console.error('❌ SonarQube analysis failed for GitHub project:', error);
        
//         // Update project with failed status
//         const updatedProject = await Project.findById(project._id);
//         if (updatedProject) {
//           updatedProject.analysisStatus = 'failed';
//           updatedProject.sonarQubeResults = {
//             scanCompleted: false,
//             error: error.message,
//             scanDate: new Date()
//           };
//           await updatedProject.save();
          
//           console.log(`❌ GitHub project analysis failed: ${sonarProjectKey}`);
//         }
//       });
//     // ====== SONARQUBE INTEGRATION END ======

//   } catch (error) {
//     console.error('❌ Error importing and processing GitHub repository:', error);
    
//     // Enhanced cleanup for failed imports
//     // Note: project will be null if validation failed, so no DB cleanup needed for validation failures
//     if (project && project._id) {
//       try {
//         console.log(`🗑️ Deleting project record from database: ${project._id}`);
//         await Project.findByIdAndDelete(project._id);
//         console.log('✅ Project record deleted successfully');
//       } catch (deleteError) {
//         console.error('❌ Error deleting project record:', deleteError);
//       }
//     } else {
//       console.log('ℹ️ No project record to delete (validation failed before DB save)');
//     }
    
//     // Always clean up the project directory on failure
//     // This will be set by processGitHubRepository even if validation fails
//     if (projectDir) {
//       try {
//         console.log(`🗑️ Cleaning up project directory: ${projectDir}`);
//         await fs.rm(projectDir, { recursive: true, force: true });
//         console.log('✅ Project directory cleaned up successfully');
//       } catch (cleanupError) {
//         console.error('❌ Error cleaning up project directory:', cleanupError);
//       }
//     }
    
//     // Handle validation failures specifically
//     if (error.message.includes('Invalid project structure') || error.message.includes('Validation failed')) {
//       console.log(`❌ Repository validation failed for: ${repositoryFullName} - ${error.message}`);
//       return res.status(400).json({
//         success: false,
//         message: 'Repository validation failed - Not a MERN project',
//         error: error.message,
//         requirements: [
//           'Repository must be a MERN stack project (MongoDB, Express.js, React, Node.js)',
//           'Supported frameworks: React, Next.js, Express.js, Node.js',
//           'Repository must contain JavaScript/TypeScript files (.js, .jsx, .ts, .tsx)',
//           'Repository must contain at least one package.json file',
//           'Repository must not contain Python, Java, PHP, C#, Go, Ruby, or Rust backend files',
//           'Repository structure should follow standard JavaScript project conventions'
//         ],
//         supportedProjectTypes: [
//           'React applications',
//           'Next.js applications', 
//           'Express.js backends',
//           'Node.js applications',
//           'Full-stack MERN applications',
//           'JavaScript/TypeScript projects'
//         ]
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to import and process repository'
//     });
//   }
// });

// // Updated processGitHubRepository function to ensure projectDir is always set for cleanup
// const processGitHubRepository = async (repositoryFullName, accessToken, repositoryName, description, userId) => {
//   let projectDir = null;
  
//   try {
//     projectDir = path.join(__dirname, '..', 'uploads/projects/github', `github_${Date.now()}_${repositoryName}`);
    
//     console.log(`📁 Creating project directory: ${projectDir}`);
    
//     const downloadResult = await downloadGitHubRepository(repositoryFullName, projectDir, accessToken);
//     console.log(`✅ Download completed successfully`);
    
//     const validation = await validateProject(projectDir);
//     console.log(`✅ Validation completed successfully - Type: ${validation.type}`);
    
//     const cleanup = await cleanupProject(projectDir);
//     console.log(`✅ Cleanup completed successfully`);
    
//     return {
//       downloadedPath: projectDir,
//       validation: validation,
//       cleanup: cleanup
//     };
//   } catch (error) {
//     console.error('❌ Error processing GitHub repository:', error);
    
//     // Clean up the project directory immediately if validation or other processing fails
//     if (projectDir) {
//       try {
//         console.log(`🗑️ Cleaning up failed project directory: ${projectDir}`);
//         await fs.rm(projectDir, { recursive: true, force: true });
//         console.log('✅ Failed project directory cleaned up successfully');
//       } catch (cleanupError) {
//         console.error('❌ Error cleaning up failed project directory:', cleanupError);
//       }
//     }
    
//     // Re-throw the error with the projectDir information for the calling function
//     const enhancedError = new Error(error.message);
//     enhancedError.projectDir = projectDir; // Attach projectDir to error for cleanup
//     throw enhancedError;
//   }
// };



// //routes/githubAuth.js duplication done
// router.post('/import-repository', authMiddleware, async (req, res) => {
//   let project = null;
//   let projectDir = null;
  
//   try {
//     const userId = req.user.user_id;
//     const { repositoryId, repositoryName, repositoryFullName, description, cloneUrl } = req.body;

//     if (!repositoryId || !repositoryName || !repositoryFullName) {
//       return res.status(400).json({
//         success: false,
//         message: 'Repository ID, name, and full name are required'
//       });
//     }

//     const githubAuth = await GitHubAuth.findOne({ user: userId });
//     if (!githubAuth) {
//       return res.status(404).json({
//         success: false,
//         message: 'GitHub account not connected'
//       });
//     }

//     console.log(`Starting import process for repository: ${repositoryFullName}`);

//     // Process the repository (download, validate, cleanup)
//     const processResult = await processGitHubRepository(
//       repositoryFullName,
//       githubAuth.accessToken,
//       repositoryName,
//       description,
//       userId
//     );

//     projectDir = processResult.downloadedPath;

//     console.log(`Repository processing completed successfully for: ${repositoryFullName}`);
//     console.log(`Validation passed - Project type: ${processResult.validation.type}`);
//     console.log(`MERN Compatible: ${processResult.validation.isMernCompatible}`);

//     // Create and save project record AFTER successful validation and processing
//     project = new Project({
//       user: userId,
//       source: 'github',
//       extractedPath: processResult.downloadedPath,
//       projectName: repositoryName,
//       description: description || `Imported from GitHub: ${repositoryFullName}`,
//       analysisStatus: 'processing',
//       projectType: processResult.validation.type,
//       validationResult: processResult.validation,
//       cleanupResult: processResult.cleanup,
//       githubInfo: {
//         repositoryId: repositoryId,
//         repositoryName: repositoryName,
//         repositoryFullName: repositoryFullName,
//         cloneUrl: cloneUrl,
//         importedAt: new Date()
//       },
//       duplicationAnalysis: {
//         status: 'pending',
//         startedAt: new Date()
//       }
//     });

//     await project.save();
//     console.log(`✅ Project saved to database with ID: ${project._id}`);

//     // Send response to user
//     res.json({
//       success: true,
//       message: 'Repository imported, downloaded, validated, and cleaned successfully. Code duplication analysis is in progress.',
//       project: {
//         id: project._id,
//         name: project.projectName,
//         source: project.source,
//         type: project.projectType,
//         status: project.analysisStatus,
//         validation: {
//           type: processResult.validation.type,
//           warnings: processResult.validation.warnings,
//           structure: processResult.validation.structure,
//           hasSrcDirectory: processResult.validation.hasSrcDirectory,
//           fileTypeAnalysis: processResult.validation.fileTypeAnalysis,
//           packageJsonCount: processResult.validation.packageJsonCount,
//           actualProjectRoot: processResult.validation.actualProjectRoot,
//           isMernCompatible: processResult.validation.isMernCompatible
//         },
//         cleanup: {
//           itemsRemoved: processResult.cleanup.removed.length,
//           nodeModulesRemoved: processResult.cleanup.nodeModulesRemoved.length,
//           errors: processResult.cleanup.errors.length
//         },
//         githubInfo: project.githubInfo,
//         createdAt: project.createdAt
//       }
//     });

//     console.log(`✅ GitHub project processed successfully: ${repositoryName} (${processResult.validation.type}) by user ${userId}`);
//     console.log(`Removed ${processResult.cleanup.nodeModulesRemoved.length} node_modules directories`);

//     // Run duplication analysis asynchronously (after response is sent)
//     console.log('\n🚀 Starting code duplication analysis for GitHub project in background...\n');
    
//     const projectId = project._id;
    
//     analyzeDuplication(processResult.downloadedPath)
//       .then(async (duplicationResults) => {
//         console.log('\n' + '='.repeat(80));
//         console.log('🎉 DUPLICATION ANALYSIS COMPLETED SUCCESSFULLY');
//         console.log('='.repeat(80));
        
//         // Refetch project from database to get latest data
//         const updatedProject = await Project.findById(projectId);
//         if (!updatedProject) {
//           console.error('❌ Project not found during update');
//           return;
//         }
        
//         console.log('\n📊 ANALYSIS STATISTICS:');
//         console.log('─'.repeat(80));
//         console.log(`   Total Files Analyzed:        ${duplicationResults.stats.totalFiles}`);
//         console.log(`   Total Code Units:            ${duplicationResults.stats.totalUnits}`);
//         console.log(`   Exact Clone Groups:          ${duplicationResults.stats.exactCloneGroups}`);
//         console.log(`   Near Clone Groups:           ${duplicationResults.stats.nearCloneGroups}`);
//         console.log(`   Total Duplicated Units:      ${duplicationResults.stats.duplicatedUnits}`);
//         console.log('─'.repeat(80));
        
//         // Display sample of exact clones
//         if (duplicationResults.exactClones.length > 0) {
//           console.log('\n🔍 EXACT CLONES (First 5 groups):');
//           console.log('─'.repeat(80));
//           duplicationResults.exactClones.slice(0, 5).forEach((group) => {
//             console.log(`\n   Group #${group.groupId} - ${group.type.toUpperCase()} (${group.duplicateCount} duplicates)`);
//             group.occurrences.forEach((occ, i) => {
//               console.log(`      ${i + 1}. ${occ.name} in ${occ.file}`);
//               console.log(`         Lines ${occ.startLine}-${occ.endLine} (${occ.lineCount} lines)`);
//             });
//           });
//           if (duplicationResults.exactClones.length > 5) {
//             console.log(`\n   ... and ${duplicationResults.exactClones.length - 5} more groups`);
//           }
//         }
        
//         // Display sample of near clones
//         if (duplicationResults.nearClones.length > 0) {
//           console.log('\n\n🔍 NEAR CLONES (First 5 groups):');
//           console.log('─'.repeat(80));
//           duplicationResults.nearClones.slice(0, 5).forEach((group) => {
//             console.log(`\n   Group #${group.groupId} - ${group.type.toUpperCase()} (Similarity: ${(group.similarity * 100).toFixed(1)}%)`);
//             group.occurrences.forEach((occ, i) => {
//               console.log(`      ${i + 1}. ${occ.name} in ${occ.file}`);
//               console.log(`         Lines ${occ.startLine}-${occ.endLine} (${occ.lineCount} lines)`);
//             });
//           });
//           if (duplicationResults.nearClones.length > 5) {
//             console.log(`\n   ... and ${duplicationResults.nearClones.length - 5} more groups`);
//           }
//         }
        
//         console.log('\n' + '='.repeat(80));
//         console.log('💾 SAVING TO DATABASE...');
//         console.log('='.repeat(80));
        
//         // Update project with completed status and results
//         updatedProject.analysisStatus = 'completed';
//         updatedProject.duplicationAnalysis = {
//           status: 'completed',
//           startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
//           completedAt: new Date(),
//           results: duplicationResults
//         };
//         updatedProject.githubInfo.lastSynced = new Date();
        
//         await updatedProject.save();
        
//         console.log('✅ Successfully saved to database!');
//         console.log(`   Project ID: ${updatedProject._id}`);
//         console.log(`   Project Name: ${updatedProject.projectName}`);
//         console.log(`   Repository: ${updatedProject.githubInfo.repositoryFullName}`);
//         console.log('\n📍 VIEW RESULTS AT:');
//         console.log(`   GET /api/projects/${updatedProject._id}/duplication`);
//         console.log(`   GET /api/projects/${updatedProject._id}/test-data`);
//         console.log('='.repeat(80));
        
//         // Display complete results as JSON
//         console.log('\n📄 COMPLETE RESULTS (JSON):');
//         console.log(JSON.stringify(duplicationResults, null, 2));
//         console.log('\n' + '='.repeat(80) + '\n');
//       })
//       .catch(async (error) => {
//         console.log('\n' + '='.repeat(80));
//         console.error('❌ DUPLICATION ANALYSIS FAILED');
//         console.log('='.repeat(80));
//         console.error('Error:', error.message);
//         console.error('Stack:', error.stack);
        
//         // Refetch project from database to get latest data
//         const updatedProject = await Project.findById(projectId);
//         if (!updatedProject) {
//           console.error('❌ Project not found during error update');
//           return;
//         }
        
//         // Update project with failed status
//         updatedProject.analysisStatus = 'failed';
//         updatedProject.duplicationAnalysis = {
//           status: 'failed',
//           startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
//           completedAt: new Date(),
//           error: error.message
//         };
//         await updatedProject.save();
        
//         console.log('💾 Saved failure status to database');
//         console.log('='.repeat(80) + '\n');
//       });

//   } catch (error) {
//     console.error('❌ Error importing and processing GitHub repository:', error);
    
//     // Enhanced cleanup for failed imports
//     if (project && project._id) {
//       try {
//         console.log(`🗑️ Deleting project record from database: ${project._id}`);
//         await Project.findByIdAndDelete(project._id);
//         console.log('✅ Project record deleted successfully');
//       } catch (deleteError) {
//         console.error('❌ Error deleting project record:', deleteError);
//       }
//     } else {
//       console.log('ℹ️ No project record to delete (validation failed before DB save)');
//     }
    
//     // Always clean up the project directory on failure
//     if (projectDir) {
//       try {
//         console.log(`🗑️ Cleaning up project directory: ${projectDir}`);
//         await fs.rm(projectDir, { recursive: true, force: true });
//         console.log('✅ Project directory cleaned up successfully');
//       } catch (cleanupError) {
//         console.error('❌ Error cleaning up project directory:', cleanupError);
//       }
//     }
    
//     // Handle validation failures specifically
//     if (error.message.includes('Invalid project structure') || error.message.includes('Validation failed')) {
//       console.log(`❌ Repository validation failed for: ${repositoryFullName} - ${error.message}`);
//       return res.status(400).json({
//         success: false,
//         message: 'Repository validation failed - Not a MERN project',
//         error: error.message,
//         requirements: [
//           'Repository must be a MERN stack project (MongoDB, Express.js, React, Node.js)',
//           'Supported frameworks: React, Next.js, Express.js, Node.js',
//           'Repository must contain JavaScript/TypeScript files (.js, .jsx, .ts, .tsx)',
//           'Repository must contain at least one package.json file',
//           'Repository must not contain Python, Java, PHP, C#, Go, Ruby, or Rust backend files',
//           'Repository structure should follow standard JavaScript project conventions'
//         ],
//         supportedProjectTypes: [
//           'React applications',
//           'Next.js applications', 
//           'Express.js backends',
//           'Node.js applications',
//           'Full-stack MERN applications',
//           'JavaScript/TypeScript projects'
//         ]
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to import and process repository'
//     });
//   }
// });


// // Updated processGitHubRepository function to ensure projectDir is always set for cleanup
const processGitHubRepository = async (repositoryFullName, accessToken, repositoryName, description, userId) => {
  let projectDir = null;
  
  try {
    projectDir = path.join(__dirname, '..', 'uploads/projects/github', `github_${Date.now()}_${repositoryName}`);
    
    console.log(`📁 Creating project directory: ${projectDir}`);
    
    const downloadResult = await downloadGitHubRepository(repositoryFullName, projectDir, accessToken);
    console.log(`✅ Download completed successfully`);
    
    const validation = await validateProject(projectDir);
    console.log(`✅ Validation completed successfully - Type: ${validation.type}`);
    
    const cleanup = await cleanupProject(projectDir);
    console.log(`✅ Cleanup completed successfully`);
    
    return {
      downloadedPath: projectDir,
      validation: validation,
      cleanup: cleanup
    };
  } catch (error) {
    console.error('❌ Error processing GitHub repository:', error);
    
    // Clean up the project directory immediately if validation or other processing fails
    if (projectDir) {
      try {
        console.log(`🗑️ Cleaning up failed project directory: ${projectDir}`);
        await fs.rm(projectDir, { recursive: true, force: true });
        console.log('✅ Failed project directory cleaned up successfully');
      } catch (cleanupError) {
        console.error('❌ Error cleaning up failed project directory:', cleanupError);
      }
    }
    
    // Re-throw the error with the projectDir information for the calling function
    const enhancedError = new Error(error.message);
    enhancedError.projectDir = projectDir;
    throw enhancedError;
  }
};

//routes/githubAuth.js

// Add this import at the top of your file (if not already present)
const {
  analyzeCodeQuality,
} = require('../services/smells/codeQualityAnalysis');
const { analyzePropDrilling: analyzePropDrillingService } = require('../services/smells/propDrilling/propDrillingController');

const MainAnalyzer = require('../services/smells/hooks');

// Add this helper function (same as in projects.js)
// const performAllAnalyses = async (extractedPath) => {
//   console.log('\n' + '='.repeat(80));
//   console.log('🔍 STARTING COMBINED CODE ANALYSIS');
//   console.log('='.repeat(80) + '\n');

//   try {
//     // Run both analyses in parallel
//     const [duplicationResults, qualityResults] = await Promise.all([
//       analyzeDuplication(extractedPath),
//       analyzeCodeQuality(extractedPath)
//     ]);

//     const combinedResults = {
//       timestamp: new Date(),
//       analyses: {
//         duplication: duplicationResults,
//         codeQuality: qualityResults
//       },
//       summary: {
//         totalFiles: duplicationResults.stats.totalFiles,
//         totalUnits: duplicationResults.stats.totalUnits,
//         exactClones: duplicationResults.stats.exactCloneGroups,
//         nearClones: duplicationResults.stats.nearCloneGroups,
//         routeIssues: qualityResults.stats.totalIssuesFound,
//         criticalIssues: qualityResults.stats.criticalIssues,
//         highIssues: qualityResults.stats.highIssues,
//         mediumIssues: qualityResults.stats.mediumIssues,
//         lowIssues: qualityResults.stats.lowIssues
//       }
//     };

//     return combinedResults;
//   } catch (error) {
//     console.error('Error in combined analysis:', error);
//     throw error;
//   }
// };

// router.post('/import-repository', authMiddleware, async (req, res) => {
//   let project = null;
//   let projectDir = null;
  
//   try {
//     const userId = req.user.user_id;
//     const { repositoryId, repositoryName, repositoryFullName, description, cloneUrl } = req.body;

//     if (!repositoryId || !repositoryName || !repositoryFullName) {
//       return res.status(400).json({
//         success: false,
//         message: 'Repository ID, name, and full name are required'
//       });
//     }

//     const githubAuth = await GitHubAuth.findOne({ user: userId });
//     if (!githubAuth) {
//       return res.status(404).json({
//         success: false,
//         message: 'GitHub account not connected'
//       });
//     }

//     console.log(`Starting import process for repository: ${repositoryFullName}`);

//     // Process the repository (download, validate, cleanup)
//     const processResult = await processGitHubRepository(
//       repositoryFullName,
//       githubAuth.accessToken,
//       repositoryName,
//       description,
//       userId
//     );

//     projectDir = processResult.downloadedPath;

//     console.log(`Repository processing completed successfully for: ${repositoryFullName}`);
//     console.log(`Validation passed - Project type: ${processResult.validation.type}`);
//     console.log(`MERN Compatible: ${processResult.validation.isMernCompatible}`);

//     // Create and save project record with BOTH analysis fields
//     project = new Project({
//       user: userId,
//       source: 'github',
//       extractedPath: processResult.downloadedPath,
//       projectName: repositoryName,
//       description: description || `Imported from GitHub: ${repositoryFullName}`,
//       analysisStatus: 'processing',
//       projectType: processResult.validation.type,
//       validationResult: processResult.validation,
//       cleanupResult: processResult.cleanup,
//       githubInfo: {
//         repositoryId: repositoryId,
//         repositoryName: repositoryName,
//         repositoryFullName: repositoryFullName,
//         cloneUrl: cloneUrl,
//         importedAt: new Date()
//       },
//       duplicationAnalysis: {
//         status: 'pending',
//         startedAt: new Date()
//       },
//       codeQualityAnalysis: {  // ADD THIS
//         status: 'pending',
//         startedAt: new Date()
//       }
//     });

//     await project.save();
//     console.log(`✅ Project saved to database with ID: ${project._id}`);

//     // Send response to user (UPDATED MESSAGE)
//     res.json({
//       success: true,
//       message: 'Repository imported, downloaded, validated, and cleaned successfully. Code analysis (duplication & quality) is in progress.',
//       project: {
//         id: project._id,
//         name: project.projectName,
//         source: project.source,
//         type: project.projectType,
//         status: project.analysisStatus,
//         validation: {
//           type: processResult.validation.type,
//           warnings: processResult.validation.warnings,
//           structure: processResult.validation.structure,
//           hasSrcDirectory: processResult.validation.hasSrcDirectory,
//           fileTypeAnalysis: processResult.validation.fileTypeAnalysis,
//           packageJsonCount: processResult.validation.packageJsonCount,
//           actualProjectRoot: processResult.validation.actualProjectRoot,
//           isMernCompatible: processResult.validation.isMernCompatible
//         },
//         cleanup: {
//           itemsRemoved: processResult.cleanup.removed.length,
//           nodeModulesRemoved: processResult.cleanup.nodeModulesRemoved.length,
//           errors: processResult.cleanup.errors.length
//         },
//         githubInfo: project.githubInfo,
//         createdAt: project.createdAt
//       }
//     });

//     console.log(`✅ GitHub project processed successfully: ${repositoryName} (${processResult.validation.type}) by user ${userId}`);
//     console.log(`Removed ${processResult.cleanup.nodeModulesRemoved.length} node_modules directories`);

//     // Run COMBINED analysis asynchronously (UPDATED)
//     console.log('\n🚀 Starting combined code analysis for GitHub project in background...\n');
    
//     const projectId = project._id;
    
//     performAllAnalyses(processResult.downloadedPath)
//       .then(async (combinedResults) => {
//         console.log('\n' + '='.repeat(80));
//         console.log('🎉 ALL ANALYSES COMPLETED SUCCESSFULLY (GitHub Import)');
//         console.log('='.repeat(80));
        
//         const updatedProject = await Project.findById(projectId);
//         if (!updatedProject) {
//           console.error('❌ Project not found during update');
//           return;
//         }
        
//         // Display summary
//         console.log('\n📊 ANALYSIS SUMMARY:');
//         console.log('─'.repeat(80));
//         console.log(`Files Analyzed:           ${combinedResults.summary.totalFiles}`);
//         console.log(`Code Units:               ${combinedResults.summary.totalUnits}`);
//         console.log(`Exact Clone Groups:       ${combinedResults.summary.exactClones}`);
//         console.log(`Near Clone Groups:        ${combinedResults.summary.nearClones}`);
//         console.log(`\n🚨 CODE QUALITY ISSUES:`);
//         console.log(`Critical Issues:          ${combinedResults.summary.criticalIssues}`);
//         console.log(`High Issues:              ${combinedResults.summary.highIssues}`);
//         console.log(`Medium Issues:            ${combinedResults.summary.mediumIssues}`);
//         console.log(`Low Issues:               ${combinedResults.summary.lowIssues}`);
//         console.log('─'.repeat(80));
        
//         // Update project with BOTH results
//         updatedProject.analysisStatus = 'completed';
//         updatedProject.duplicationAnalysis = {
//           status: 'completed',
//           startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
//           completedAt: new Date(),
//           results: combinedResults.analyses.duplication
//         };
//         updatedProject.codeQualityAnalysis = {
//           status: 'completed',
//           startedAt: updatedProject.codeQualityAnalysis?.startedAt || new Date(),
//           completedAt: new Date(),
//           results: combinedResults.analyses.codeQuality
//         };
//         updatedProject.githubInfo.lastSynced = new Date();
        
//         await updatedProject.save();
        
//         console.log('\n✅ Successfully saved all analyses to database!');
//         console.log(`   Project ID: ${updatedProject._id}`);
//         console.log(`   Project Name: ${updatedProject.projectName}`);
//         console.log(`   Repository: ${updatedProject.githubInfo.repositoryFullName}`);
//         console.log('\n📍 VIEW RESULTS AT:');
//         console.log(`   GET /api/projects/${updatedProject._id}/analysis`);
//         console.log(`   GET /api/projects/${updatedProject._id}/duplication`);
//         console.log(`   GET /api/projects/${updatedProject._id}/quality`);
//         console.log('='.repeat(80) + '\n');
//       })
//       .catch(async (error) => {
//         console.log('\n' + '='.repeat(80));
//         console.error('❌ ANALYSIS FAILED (GitHub Import)');
//         console.log('='.repeat(80));
//         console.error('Error:', error.message);
        
//         const updatedProject = await Project.findById(projectId);
//         if (!updatedProject) {
//           console.error('❌ Project not found during error update');
//           return;
//         }
        
//         // Update BOTH analyses with failed status
//         updatedProject.analysisStatus = 'failed';
//         updatedProject.duplicationAnalysis = {
//           status: 'failed',
//           startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
//           completedAt: new Date(),
//           error: error.message
//         };
//         updatedProject.codeQualityAnalysis = {
//           status: 'failed',
//           startedAt: updatedProject.codeQualityAnalysis?.startedAt || new Date(),
//           completedAt: new Date(),
//           error: error.message
//         };
//         await updatedProject.save();
        
//         console.log('💾 Saved failure status to database');
//         console.log('='.repeat(80) + '\n');
//       });

//   } catch (error) {
//     console.error('❌ Error importing and processing GitHub repository:', error);
    
//     // Enhanced cleanup for failed imports
//     if (project && project._id) {
//       try {
//         console.log(`🗑️ Deleting project record from database: ${project._id}`);
//         await Project.findByIdAndDelete(project._id);
//         console.log('✅ Project record deleted successfully');
//       } catch (deleteError) {
//         console.error('❌ Error deleting project record:', deleteError);
//       }
//     } else {
//       console.log('ℹ️ No project record to delete (validation failed before DB save)');
//     }
    
//     // Always clean up the project directory on failure
//     if (projectDir) {
//       try {
//         console.log(`🗑️ Cleaning up project directory: ${projectDir}`);
//         await fs.rm(projectDir, { recursive: true, force: true });
//         console.log('✅ Project directory cleaned up successfully');
//       } catch (cleanupError) {
//         console.error('❌ Error cleaning up project directory:', cleanupError);
//       }
//     }
    
//     // Handle validation failures specifically
//     if (error.message.includes('Invalid project structure') || error.message.includes('Validation failed')) {
//       console.log(`❌ Repository validation failed for: ${repositoryFullName} - ${error.message}`);
//       return res.status(400).json({
//         success: false,
//         message: 'Repository validation failed - Not a MERN project',
//         error: error.message,
//         requirements: [
//           'Repository must be a MERN stack project (MongoDB, Express.js, React, Node.js)',
//           'Supported frameworks: React, Next.js, Express.js, Node.js',
//           'Repository must contain JavaScript/TypeScript files (.js, .jsx, .ts, .tsx)',
//           'Repository must contain at least one package.json file',
//           'Repository must not contain Python, Java, PHP, C#, Go, Ruby, or Rust backend files',
//           'Repository structure should follow standard JavaScript project conventions'
//         ],
//         supportedProjectTypes: [
//           'React applications',
//           'Next.js applications', 
//           'Express.js backends',
//           'Node.js applications',
//           'Full-stack MERN applications',
//           'JavaScript/TypeScript projects'
//         ]
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to import and process repository'
//     });
//   }
// });

// const performAllAnalyses = async (extractedPath) => {
//   console.log('\n' + '='.repeat(80));
//   console.log('STARTING COMBINED CODE ANALYSIS (3 ANALYSES)');
//   console.log('='.repeat(80) + '\n');

//   try {
//     // Run all THREE analyses in parallel
//     const [duplicationResults, qualityResults, hooksResults] = await Promise.all([
//       analyzeDuplication(extractedPath),
//       analyzeCodeQuality(extractedPath),
//       (async () => {
//         try {
//           const analyzer = new MainAnalyzer(extractedPath);
//           const result = await analyzer.analyze();
//           return result;
//         } catch (error) {
//           console.error('Hooks analysis error:', error);
//           return {
//             summary: { totalViolations: 0 },
//             violations: [],
//             analyzers: {},
//             metadata: { error: error.message }
//           };
//         }
//       })()
//     ]);

//     const combinedResults = {
//       timestamp: new Date(),
//       analyses: {
//         duplication: duplicationResults,
//         codeQuality: qualityResults,
//         hooks: hooksResults // NEW
//       },
//       summary: {
//         // Duplication stats
//         totalFiles: duplicationResults.stats.totalFiles,
//         totalUnits: duplicationResults.stats.totalUnits,
//         exactClones: duplicationResults.stats.exactCloneGroups,
//         nearClones: duplicationResults.stats.nearCloneGroups,
        
//         // Quality stats
//         routeIssues: qualityResults.stats.totalIssuesFound,
//         criticalIssues: qualityResults.stats.criticalIssues,
//         highIssues: qualityResults.stats.highIssues,
//         mediumIssues: qualityResults.stats.mediumIssues,
//         lowIssues: qualityResults.stats.lowIssues,
        
//         // Hooks stats (NEW)
//         hooksViolations: hooksResults.summary?.totalViolations || 0,
//         criticalHooks: hooksResults.violations?.filter(v => v.severity === 'critical').length || 0,
//         highHooks: hooksResults.violations?.filter(v => v.severity === 'high').length || 0,
//         mediumHooks: hooksResults.violations?.filter(v => v.severity === 'medium').length || 0,
//         lowHooks: hooksResults.violations?.filter(v => v.severity === 'low').length || 0
//       }
//     };

//     return combinedResults;
//   } catch (error) {
//     console.error('Error in combined analysis:', error);
//     throw error;
//   }
// };

//working onesssss
// const performAllAnalyses = async (extractedPath) => {
//   console.log('\n' + '='.repeat(80));
//   console.log('STARTING COMBINED CODE ANALYSIS (4 ANALYSES)');
//   console.log('='.repeat(80) + '\n');

//   try {
//     const [duplicationResults, qualityResults, hooksResults, propDrillingResults] = await Promise.all([
//       analyzeDuplication(extractedPath),
//       analyzeCodeQuality(extractedPath),
//       (async () => {
//         try {
//           const analyzer = new MainAnalyzer(extractedPath);
//           return await analyzer.analyze();
//         } catch (error) {
//           console.error('Hooks analysis error:', error);
//           return {
//             summary: { totalViolations: 0 },
//             violations: [],
//             analyzers: {},
//             metadata: { error: error.message }
//           };
//         }
//       })(),
//       (async () => {
//         try {
//           return await analyzePropDrillingService(extractedPath);
//         } catch (error) {
//           console.error('Prop drilling analysis error:', error);
//           return {
//             summary: { totalIssues: 0, highSeverity: 0, mediumSeverity: 0, lowSeverity: 0 },
//             propDrillingIssues: [],
//             stats: { totalFiles: 0, totalComponents: 0 },
//             error: error.message
//           };
//         }
//       })()
//     ]);

//     return {
//       timestamp: new Date(),
//       analyses: {
//         duplication: duplicationResults,
//         codeQuality: qualityResults,
//         hooks: hooksResults,
//         propDrilling: propDrillingResults
//       },
//       summary: {
//         // Duplication
//         totalFiles: duplicationResults?.stats?.totalFiles || 0,
//         totalUnits: duplicationResults?.stats?.totalUnits || 0,
//         exactClones: duplicationResults?.stats?.exactCloneGroups || 0,
//         nearClones: duplicationResults?.stats?.nearCloneGroups || 0,

//         // Quality
//         routeIssues: qualityResults?.stats?.totalIssuesFound || 0,
//         criticalIssues: qualityResults?.stats?.criticalIssues || 0,
//         highIssues: qualityResults?.stats?.highIssues || 0,
//         mediumIssues: qualityResults?.stats?.mediumIssues || 0,
//         lowIssues: qualityResults?.stats?.lowIssues || 0,

//         // Hooks
//         hooksViolations: hooksResults?.summary?.totalViolations || 0,
//         criticalHooks: (hooksResults?.violations || []).filter(v => v.severity === 'critical').length,
//         highHooks: (hooksResults?.violations || []).filter(v => v.severity === 'high').length,
//         mediumHooks: (hooksResults?.violations || []).filter(v => v.severity === 'medium').length,
//         lowHooks: (hooksResults?.violations || []).filter(v => v.severity === 'low').length,

//         // Prop drilling
//         propDrillingIssues: propDrillingResults?.summary?.totalIssues || 0,
//         highPropDrilling: propDrillingResults?.summary?.highSeverity || 0,
//         mediumPropDrilling: propDrillingResults?.summary?.mediumSeverity || 0,
//         lowPropDrilling: propDrillingResults?.summary?.lowSeverity || 0
//       }
//     };
//   } catch (error) {
//     console.error('Error in combined analysis:', error);
//     throw error;
//   }
// };

// router.post('/import-repository', authMiddleware, async (req, res) => {
//   let project = null;
//   let projectDir = null;
  
//   try {
//     const userId = req.user.user_id;
//     const { repositoryId, repositoryName, repositoryFullName, description, cloneUrl } = req.body;

//     if (!repositoryId || !repositoryName || !repositoryFullName) {
//       return res.status(400).json({
//         success: false,
//         message: 'Repository ID, name, and full name are required'
//       });
//     }

//     const githubAuth = await GitHubAuth.findOne({ user: userId });
//     if (!githubAuth) {
//       return res.status(404).json({
//         success: false,
//         message: 'GitHub account not connected'
//       });
//     }

//     console.log(`Starting import process for repository: ${repositoryFullName}`);

//     // Process the repository (download, validate, cleanup)
//     const processResult = await processGitHubRepository(
//       repositoryFullName,
//       githubAuth.accessToken,
//       repositoryName,
//       description,
//       userId
//     );

//     projectDir = processResult.downloadedPath;

//     console.log(`Repository processing completed successfully for: ${repositoryFullName}`);
//     console.log(`Validation passed - Project type: ${processResult.validation.type}`);
//     console.log(`MERN Compatible: ${processResult.validation.isMernCompatible}`);

//     // Create and save project record with ALL THREE analysis fields
//     project = new Project({
//       user: userId,
//       source: 'github',
//       extractedPath: processResult.downloadedPath,
//       projectName: repositoryName,
//       description: description || `Imported from GitHub: ${repositoryFullName}`,
//       analysisStatus: 'processing',
//       projectType: processResult.validation.type,
//       validationResult: processResult.validation,
//       cleanupResult: processResult.cleanup,
//       githubInfo: {
//         repositoryId: repositoryId,
//         repositoryName: repositoryName,
//         repositoryFullName: repositoryFullName,
//         cloneUrl: cloneUrl,
//         importedAt: new Date()
//       },
//       duplicationAnalysis: {
//         status: 'pending',
//         startedAt: new Date()
//       },
//       codeQualityAnalysis: {
//         status: 'pending',
//         startedAt: new Date()
//       },
//       hooksAnalysis: {  // NEW
//         status: 'pending',
//         startedAt: new Date()
//       }
//     });

//     await project.save();
//     console.log(` Project saved to database with ID: ${project._id}`);

//     // Send response to user (UPDATED MESSAGE)
//     res.json({
//       success: true,
//       message: 'Repository imported successfully. Code analysis (duplication, quality & hooks) is in progress.',
//       project: {
//         id: project._id,
//         name: project.projectName,
//         source: project.source,
//         type: project.projectType,
//         status: project.analysisStatus,
//         validation: {
//           type: processResult.validation.type,
//           warnings: processResult.validation.warnings,
//           structure: processResult.validation.structure,
//           hasSrcDirectory: processResult.validation.hasSrcDirectory,
//           fileTypeAnalysis: processResult.validation.fileTypeAnalysis,
//           packageJsonCount: processResult.validation.packageJsonCount,
//           actualProjectRoot: processResult.validation.actualProjectRoot,
//           isMernCompatible: processResult.validation.isMernCompatible
//         },
//         cleanup: {
//           itemsRemoved: processResult.cleanup.removed.length,
//           nodeModulesRemoved: processResult.cleanup.nodeModulesRemoved.length,
//           errors: processResult.cleanup.errors.length
//         },
//         githubInfo: project.githubInfo,
//         createdAt: project.createdAt
//       }
//     });

//     console.log(` GitHub project processed successfully: ${repositoryName} (${processResult.validation.type}) by user ${userId}`);
//     console.log(`Removed ${processResult.cleanup.nodeModulesRemoved.length} node_modules directories`);

//     // Run COMBINED analysis asynchronously (ALL 3 ANALYSES)
//     console.log('\n Starting combined code analysis (3 analyses) for GitHub project in background...\n');
    
//     const projectId = project._id;
    
//     performAllAnalyses(processResult.downloadedPath)
//       .then(async (combinedResults) => {
//         console.log('\n' + '='.repeat(80));
//         console.log(' ALL 4 ANALYSES COMPLETED SUCCESSFULLY (GitHub Import)');
//         console.log('='.repeat(80));
        
//         const updatedProject = await Project.findById(projectId);
//         if (!updatedProject) {
//           console.error(' Project not found during update');
//           return;
//         }
        
//         // Display summary
//         console.log('\n ANALYSIS SUMMARY:');
//         console.log('─'.repeat(80));
//         console.log(`Files Analyzed:           ${combinedResults.summary.totalFiles}`);
//         console.log(`Code Units:               ${combinedResults.summary.totalUnits}`);
//         console.log(`Exact Clone Groups:       ${combinedResults.summary.exactClones}`);
//         console.log(`Near Clone Groups:        ${combinedResults.summary.nearClones}`);
//         console.log(`\n CODE QUALITY ISSUES:`);
//         console.log(`Critical Issues:          ${combinedResults.summary.criticalIssues}`);
//         console.log(`High Issues:              ${combinedResults.summary.highIssues}`);
//         console.log(`Medium Issues:            ${combinedResults.summary.mediumIssues}`);
//         console.log(`Low Issues:               ${combinedResults.summary.lowIssues}`);
//         console.log(`\n REACT HOOKS VIOLATIONS:`);
//         console.log(`Total Violations:         ${combinedResults.summary.hooksViolations}`);
//         console.log(`Critical:                 ${combinedResults.summary.criticalHooks}`);
//         console.log(`High:                     ${combinedResults.summary.highHooks}`);
//         console.log(`Medium:                   ${combinedResults.summary.mediumHooks}`);
//         console.log(`Low:                      ${combinedResults.summary.lowHooks}`);
//         console.log('─'.repeat(80));
        
//         // Update project with ALL THREE results
//         updatedProject.analysisStatus = 'completed';
        
//         // Duplication
//         updatedProject.duplicationAnalysis = {
//           status: 'completed',
//           startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
//           completedAt: new Date(),
//           results: combinedResults.analyses.duplication
//         };
        
//         // Quality
//         updatedProject.codeQualityAnalysis = {
//           status: 'completed',
//           startedAt: updatedProject.codeQualityAnalysis?.startedAt || new Date(),
//           completedAt: new Date(),
//           results: combinedResults.analyses.codeQuality
//         };
        
//         // Hooks (NEW)
//         updatedProject.hooksAnalysis = {
//           status: 'completed',
//           startedAt: updatedProject.hooksAnalysis?.startedAt || new Date(),
//           completedAt: new Date(),
//           results: combinedResults.analyses.hooks
//         };
        
//         // Also store in analysisReport for backward compatibility
//         updatedProject.analysisReport = {
//           summary: combinedResults.analyses.hooks.summary,
//           violations: combinedResults.analyses.hooks.violations,
//           analyzers: combinedResults.analyses.hooks.analyzers,
//           metadata: combinedResults.analyses.hooks.metadata
//         };
        
//         updatedProject.propDrillingAnalysis = {
//   status: 'completed',
//   startedAt: updatedProject.propDrillingAnalysis?.startedAt || new Date(),
//   completedAt: new Date(),
//   results: combinedResults.analyses.propDrilling
// };


//         updatedProject.githubInfo.lastSynced = new Date();
        
//         await updatedProject.save();
        
//         console.log('\n Successfully saved all 3 analyses to database!');
//         console.log(`   Project ID: ${updatedProject._id}`);
//         console.log(`   Project Name: ${updatedProject.projectName}`);
//         console.log(`   Repository: ${updatedProject.githubInfo.repositoryFullName}`);
//         console.log('\n VIEW RESULTS AT:');
//         console.log(`   GET /api/projects/${updatedProject._id}/analysis`);
//         console.log(`   GET /api/projects/${updatedProject._id}/duplication`);
//         console.log(`   GET /api/projects/${updatedProject._id}/quality`);
//         console.log(`   GET /api/projects/${updatedProject._id}/hooks`);
//         console.log('='.repeat(80) + '\n');
//       })
//       .catch(async (error) => {
//         console.log('\n' + '='.repeat(80));
//         console.error(' ANALYSIS FAILED (GitHub Import)');
//         console.log('='.repeat(80));
//         console.error('Error:', error.message);
        
//         const updatedProject = await Project.findById(projectId);
//         if (!updatedProject) {
//           console.error(' Project not found during error update');
//           return;
//         }
        
//         // Update ALL THREE analyses with failed status
//         updatedProject.analysisStatus = 'failed';
        
//         updatedProject.duplicationAnalysis = {
//           status: 'failed',
//           startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
//           completedAt: new Date(),
//           error: error.message
//         };
        
//         updatedProject.codeQualityAnalysis = {
//           status: 'failed',
//           startedAt: updatedProject.codeQualityAnalysis?.startedAt || new Date(),
//           completedAt: new Date(),
//           error: error.message
//         };
        
//         updatedProject.hooksAnalysis = {
//           status: 'failed',
//           startedAt: updatedProject.hooksAnalysis?.startedAt || new Date(),
//           completedAt: new Date(),
//           error: error.message
//         };
        
//         await updatedProject.save();
        
//         console.log(' Saved failure status to database');
//         console.log('='.repeat(80) + '\n');
//       });

//   } catch (error) {
//     console.error(' Error importing and processing GitHub repository:', error);
    
//     // Enhanced cleanup for failed imports
//     if (project && project._id) {
//       try {
//         console.log(`Deleting project record from database: ${project._id}`);
//         await Project.findByIdAndDelete(project._id);
//         console.log(' Project record deleted successfully');
//       } catch (deleteError) {
//         console.error(' Error deleting project record:', deleteError);
//       }
//     } else {
//       console.log('ℹNo project record to delete (validation failed before DB save)');
//     }
    
//     // Always clean up the project directory on failure
//     if (projectDir) {
//       try {
//         console.log(` Cleaning up project directory: ${projectDir}`);
//         await fs.rm(projectDir, { recursive: true, force: true });
//         console.log(' Project directory cleaned up successfully');
//       } catch (cleanupError) {
//         console.error(' Error cleaning up project directory:', cleanupError);
//       }
//     }
    
//     // Handle validation failures specifically
//     if (error.message.includes('Invalid project structure') || error.message.includes('Validation failed')) {
//       console.log(` Repository validation failed for: ${repositoryFullName} - ${error.message}`);
//       return res.status(400).json({
//         success: false,
//         message: 'Repository validation failed - Not a MERN project',
//         error: error.message,
//         requirements: [
//           'Repository must be a MERN stack project (MongoDB, Express.js, React, Node.js)',
//           'Supported frameworks: React, Next.js, Express.js, Node.js',
//           'Repository must contain JavaScript/TypeScript files (.js, .jsx, .ts, .tsx)',
//           'Repository must contain at least one package.json file',
//           'Repository must not contain Python, Java, PHP, C#, Go, Ruby, or Rust backend files',
//           'Repository structure should follow standard JavaScript project conventions'
//         ],
//         supportedProjectTypes: [
//           'React applications',
//           'Next.js applications', 
//           'Express.js backends',
//           'Node.js applications',
//           'Full-stack MERN applications',
//           'JavaScript/TypeScript projects'
//         ]
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to import and process repository'
//     });
//   }
// });


// ==========================================
// STEP 1: Update performAllAnalyses to accept projectId
// ==========================================

const { generateAISuggestions } = require('../services/aiSuggestionService');

const performAllAnalyses = async (extractedPath, projectId = null, preferences = {
  codeDuplication: true,
  expressMiddleware: true,
  reactHooks: true,
  propDrilling: true,
}) => {
  console.log('\n' + '='.repeat(80));
  console.log('STARTING COMBINED CODE ANALYSIS (4 ANALYSES + AI)');
  console.log('Preferences:', preferences);
  console.log('='.repeat(80) + '\n');

  try {
    const [duplicationResults, qualityResults, hooksResults, propDrillingResults] = await Promise.all([
      // Code Duplication
      preferences.codeDuplication
        ? analyzeDuplication(extractedPath)
        : Promise.resolve({
            stats: { totalFiles: 0, totalUnits: 0, exactCloneGroups: 0, nearCloneGroups: 0, duplicatedUnits: 0 },
            exactClones: [], nearClones: [], skipped: true
          }),

      // Express Middleware (codeQuality)
      preferences.expressMiddleware
        ? analyzeCodeQuality(extractedPath)
        : Promise.resolve({
            stats: { totalIssuesFound: 0, criticalIssues: 0, highIssues: 0, mediumIssues: 0, lowIssues: 0 },
            results: { apiRouteIssues: [], mongooseQueryIssues: [], redundantQueryIssues: [] },
            skipped: true
          }),

      // React Hooks
      preferences.reactHooks
        ? (async () => {
            try {
              const analyzer = new MainAnalyzer(extractedPath);
              return await analyzer.analyze();
            } catch (error) {
              console.error('Hooks analysis error:', error);
              return { summary: { totalViolations: 0 }, violations: [], analyzers: {}, metadata: { error: error.message } };
            }
          })()
        : Promise.resolve({
            summary: { totalViolations: 0 }, violations: [], analyzers: {}, metadata: { skipped: true }
          }),

      // Prop Drilling
      preferences.propDrilling
        ? (async () => {
            try {
              return await analyzePropDrillingService(extractedPath);
            } catch (error) {
              console.error('Prop drilling analysis error:', error);
              return {
                summary: { totalIssues: 0, highSeverity: 0, mediumSeverity: 0, lowSeverity: 0 },
                propDrillingIssues: [], stats: { totalFiles: 0, totalComponents: 0 }, error: error.message
              };
            }
          })()
        : Promise.resolve({
            summary: { totalIssues: 0, highSeverity: 0, mediumSeverity: 0, lowSeverity: 0 },
            propDrillingIssues: [], stats: { totalFiles: 0, totalComponents: 0 }, skipped: true
          }),
    ]);

    const combinedResults = {
      timestamp: new Date(),
      analyses: {
        duplication: duplicationResults,
        codeQuality: qualityResults,
        hooks: hooksResults,
        propDrilling: propDrillingResults
      },
      summary: {
        totalFiles: duplicationResults?.stats?.totalFiles || 0,
        totalUnits: duplicationResults?.stats?.totalUnits || 0,
        exactClones: duplicationResults?.stats?.exactCloneGroups || 0,
        nearClones: duplicationResults?.stats?.nearCloneGroups || 0,
        routeIssues: qualityResults?.stats?.totalIssuesFound || 0,
        criticalIssues: qualityResults?.stats?.criticalIssues || 0,
        highIssues: qualityResults?.stats?.highIssues || 0,
        mediumIssues: qualityResults?.stats?.mediumIssues || 0,
        lowIssues: qualityResults?.stats?.lowIssues || 0,
        apiRouteIssues: qualityResults?.results?.apiRouteIssues?.length || 0,
        mongooseIssues: qualityResults?.results?.mongooseQueryIssues?.length || 0,
        redundantQueries: qualityResults?.results?.redundantQueryIssues?.length || 0,
        hooksViolations: hooksResults?.summary?.totalViolations || 0,
        criticalHooks: (hooksResults?.violations || []).filter(v => v.severity === 'critical').length,
        highHooks: (hooksResults?.violations || []).filter(v => v.severity === 'high').length,
        mediumHooks: (hooksResults?.violations || []).filter(v => v.severity === 'medium').length,
        lowHooks: (hooksResults?.violations || []).filter(v => v.severity === 'low').length,
        propDrillingIssues: propDrillingResults?.summary?.totalIssues || 0,
        highPropDrilling: propDrillingResults?.summary?.highSeverity || 0,
        mediumPropDrilling: propDrillingResults?.summary?.mediumSeverity || 0,
        lowPropDrilling: propDrillingResults?.summary?.lowSeverity || 0,
        skipped: {
          codeDuplication: !preferences.codeDuplication,
          expressMiddleware: !preferences.expressMiddleware,
          reactHooks: !preferences.reactHooks,
          propDrilling: !preferences.propDrilling,
        }
      }
    };

    // Generate AI Suggestions
    console.log('\n Generating AI suggestions...');
    try {
      const aiSuggestions = await generateAISuggestions(combinedResults);

      if (projectId) {
        await Project.findByIdAndUpdate(projectId, {
          $set: {
            aiSuggestions: {
              duplicates: aiSuggestions.duplicates || [],
              hooks: aiSuggestions.hooks || [],
              propDrilling: aiSuggestions.propDrilling || [],
              codeQuality: aiSuggestions.codeQuality || [],
              generatedAt: new Date(),
              status: 'completed'
            }
          }
        });
        console.log('AI suggestions saved to database');
      }
    } catch (aiError) {
      console.error('AI generation failed (non-critical):', aiError.message);
      if (projectId) {
        await Project.findByIdAndUpdate(projectId, {
          $set: {
            'aiSuggestions.status': 'failed',
            'aiSuggestions.error': aiError.message,
            'aiSuggestions.generatedAt': new Date()
          }
        });
      }
    }

    return combinedResults;
  } catch (error) {
    console.error('Error in combined analysis:', error);
    throw error;
  }
};

// ==========================================
// STEP 2: Update GitHub Import Route
// ==========================================

router.post('/import-repository', authMiddleware, async (req, res) => {
  let project = null;
  let projectDir = null;
  
  try {
    const userId = req.user.user_id;
    const { repositoryId, repositoryName, repositoryFullName, description, cloneUrl } = req.body;

    if (!repositoryId || !repositoryName || !repositoryFullName) {
      return res.status(400).json({
        success: false,
        message: 'Repository ID, name, and full name are required'
      });
    }

    const githubAuth = await GitHubAuth.findOne({ user: userId });
    if (!githubAuth) {
      return res.status(404).json({
        success: false,
        message: 'GitHub account not connected'
      });
    }

    console.log(`Starting import process for repository: ${repositoryFullName}`);

    // Process the repository (download, validate, cleanup)
    const processResult = await processGitHubRepository(
      repositoryFullName,
      githubAuth.accessToken,
      repositoryName,
      description,
      userId
    );

    projectDir = processResult.downloadedPath;

    console.log(`Repository processing completed successfully for: ${repositoryFullName}`);
    console.log(`Validation passed - Project type: ${processResult.validation.type}`);
    console.log(`MERN Compatible: ${processResult.validation.isMernCompatible}`);

    // Create and save project record with ALL analysis fields
    project = new Project({
      user: userId,
      source: 'github',
      extractedPath: processResult.downloadedPath,
      projectName: repositoryName,
      description: description || `Imported from GitHub: ${repositoryFullName}`,
      analysisStatus: 'processing',
      projectType: processResult.validation.type,
      validationResult: processResult.validation,
      cleanupResult: processResult.cleanup,
      githubInfo: {
        repositoryId: repositoryId,
        repositoryName: repositoryName,
        repositoryFullName: repositoryFullName,
        cloneUrl: cloneUrl,
        importedAt: new Date()
      },
      duplicationAnalysis: {
        status: 'pending',
        startedAt: new Date()
      },
      codeQualityAnalysis: {
        status: 'pending',
        startedAt: new Date()
      },
      hooksAnalysis: {
        status: 'pending',
        startedAt: new Date()
      },
      propDrillingAnalysis: {
        status: 'pending',
        startedAt: new Date()
      },
      // NEW: Initialize AI suggestions
      aiSuggestions: {
        status: 'pending',
        duplicates: [],
        hooks: [],
        propDrilling: [],
        codeQuality: []
      }
    });

    await project.save();
    console.log(` Project saved to database with ID: ${project._id}`);

    // Send response to user
    res.json({
      success: true,
      message: 'Repository imported successfully. Code analysis (duplication, quality, hooks & AI) is in progress.',
      project: {
        id: project._id,
        name: project.projectName,
        source: project.source,
        type: project.projectType,
        status: project.analysisStatus,
        validation: {
          type: processResult.validation.type,
          warnings: processResult.validation.warnings,
          structure: processResult.validation.structure,
          hasSrcDirectory: processResult.validation.hasSrcDirectory,
          fileTypeAnalysis: processResult.validation.fileTypeAnalysis,
          packageJsonCount: processResult.validation.packageJsonCount,
          actualProjectRoot: processResult.validation.actualProjectRoot,
          isMernCompatible: processResult.validation.isMernCompatible
        },
        cleanup: {
          itemsRemoved: processResult.cleanup.removed.length,
          nodeModulesRemoved: processResult.cleanup.nodeModulesRemoved.length,
          errors: processResult.cleanup.errors.length
        },
        githubInfo: project.githubInfo,
        createdAt: project.createdAt
      }
    });

    console.log(`GitHub project processed successfully: ${repositoryName} (${processResult.validation.type}) by user ${userId}`);
    console.log(`Removed ${processResult.cleanup.nodeModulesRemoved.length} node_modules directories`);

    console.log('\n Starting combined code analysis (4 analyses + AI) for GitHub project in background...\n');

const projectId = project._id;
const userId_for_prefs = userId;

(async () => {
  const User = require('../models/User');
  const user = await User.findById(userId_for_prefs).select('analysisPreferences');
  const preferences = user?.analysisPreferences || {
    codeDuplication: true,
    expressMiddleware: true,
    reactHooks: true,
    propDrilling: true,
  };
  console.log('User preferences fetched for GitHub import:', preferences);
  return performAllAnalyses(processResult.downloadedPath, projectId, preferences);
})()
      .then(async (combinedResults) => {
        console.log('\n' + '='.repeat(80));
        console.log(' ALL 4 ANALYSES + AI COMPLETED SUCCESSFULLY (GitHub Import)');
        console.log('='.repeat(80));
        
        const updatedProject = await Project.findById(projectId);
        if (!updatedProject) {
          console.error(' Project not found during update');
          return;
        }
        
        // Display summary
        console.log('\n ANALYSIS SUMMARY:');
        console.log('─'.repeat(80));
        console.log(`Files Analyzed:           ${combinedResults.summary.totalFiles}`);
        console.log(`Code Units:               ${combinedResults.summary.totalUnits}`);
        console.log(`Exact Clone Groups:       ${combinedResults.summary.exactClones}`);
        console.log(`Near Clone Groups:        ${combinedResults.summary.nearClones}`);
        console.log(`\n  CODE QUALITY ISSUES:`);
        console.log(`Critical Issues:          ${combinedResults.summary.criticalIssues}`);
        console.log(`High Issues:              ${combinedResults.summary.highIssues}`);
        console.log(`Medium Issues:            ${combinedResults.summary.mediumIssues}`);
        console.log(`Low Issues:               ${combinedResults.summary.lowIssues}`);
        console.log(`\n REACT HOOKS VIOLATIONS:`);
        console.log(`Total Violations:         ${combinedResults.summary.hooksViolations}`);
        console.log(`Critical:                 ${combinedResults.summary.criticalHooks}`);
        console.log(`High:                     ${combinedResults.summary.highHooks}`);
        console.log(`Medium:                   ${combinedResults.summary.mediumHooks}`);
        console.log(`Low:                      ${combinedResults.summary.lowHooks}`);
        console.log(`\n PROP DRILLING:`);
        console.log(`Total Issues:             ${combinedResults.summary.propDrillingIssues}`);
        console.log(`High Severity:            ${combinedResults.summary.highPropDrilling}`);
        console.log(`Medium Severity:          ${combinedResults.summary.mediumPropDrilling}`);
        console.log('─'.repeat(80));
        
        // Update project with ALL results
        updatedProject.analysisStatus = 'completed';
        
        // Duplication
        updatedProject.duplicationAnalysis = {
          status: 'completed',
          startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
          completedAt: new Date(),
          results: combinedResults.analyses.duplication
        };
        
        // Quality
        updatedProject.codeQualityAnalysis = {
          status: 'completed',
          startedAt: updatedProject.codeQualityAnalysis?.startedAt || new Date(),
          completedAt: new Date(),
          results: combinedResults.analyses.codeQuality
        };
        
        // Hooks
        updatedProject.hooksAnalysis = {
          status: 'completed',
          startedAt: updatedProject.hooksAnalysis?.startedAt || new Date(),
          completedAt: new Date(),
          results: combinedResults.analyses.hooks
        };
        
        // Backward compatibility
        updatedProject.analysisReport = {
          summary: combinedResults.analyses.hooks.summary,
          violations: combinedResults.analyses.hooks.violations,
          analyzers: combinedResults.analyses.hooks.analyzers,
          metadata: combinedResults.analyses.hooks.metadata
        };
        
        // Prop Drilling
        updatedProject.propDrillingAnalysis = {
          status: 'completed',
          startedAt: updatedProject.propDrillingAnalysis?.startedAt || new Date(),
          completedAt: new Date(),
          results: combinedResults.analyses.propDrilling
        };

        updatedProject.githubInfo.lastSynced = new Date();
        
        await updatedProject.save();
        
        console.log('\n Successfully saved all analyses + AI suggestions to database!');
        console.log(`   Project ID: ${updatedProject._id}`);
        console.log(`   Project Name: ${updatedProject.projectName}`);
        console.log(`   Repository: ${updatedProject.githubInfo.repositoryFullName}`);
        console.log(`   AI Status: ${updatedProject.aiSuggestions?.status}`);
        console.log('\n VIEW RESULTS AT:');
        console.log(`   GET /api/projects/${updatedProject._id}/analysis`);
        console.log(`   GET /api/projects/${updatedProject._id}/duplication`);
        console.log(`   GET /api/projects/${updatedProject._id}/quality`);
        console.log(`   GET /api/projects/${updatedProject._id}/hooks`);
        console.log(`   GET /api/projects/${updatedProject._id}/ai-check`);
        console.log('='.repeat(80) + '\n');
      })
      .catch(async (error) => {
        console.log('\n' + '='.repeat(80));
        console.error(' ANALYSIS FAILED (GitHub Import)');
        console.log('='.repeat(80));
        console.error('Error:', error.message);
        
        const updatedProject = await Project.findById(projectId);
        if (!updatedProject) {
          console.error(' Project not found during error update');
          return;
        }
        
        // Update ALL analyses with failed status
        updatedProject.analysisStatus = 'failed';
        
        updatedProject.duplicationAnalysis = {
          status: 'failed',
          startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
          completedAt: new Date(),
          error: error.message
        };
        
        updatedProject.codeQualityAnalysis = {
          status: 'failed',
          startedAt: updatedProject.codeQualityAnalysis?.startedAt || new Date(),
          completedAt: new Date(),
          error: error.message
        };
        
        updatedProject.hooksAnalysis = {
          status: 'failed',
          startedAt: updatedProject.hooksAnalysis?.startedAt || new Date(),
          completedAt: new Date(),
          error: error.message
        };
        
        updatedProject.propDrillingAnalysis = {
          status: 'failed',
          startedAt: updatedProject.propDrillingAnalysis?.startedAt || new Date(),
          completedAt: new Date(),
          error: error.message
        };
        
        // Mark AI as failed too
        updatedProject.aiSuggestions = {
          status: 'failed',
          error: 'Analysis failed before AI generation',
          generatedAt: new Date()
        };
        
        await updatedProject.save();
        
        console.log(' Saved failure status to database');
        console.log('='.repeat(80) + '\n');
      });

  } catch (error) {
    console.error(' Error importing and processing GitHub repository:', error);
    
    // Enhanced cleanup for failed imports
    if (project && project._id) {
      try {
        console.log(`  Deleting project record from database: ${project._id}`);
        await Project.findByIdAndDelete(project._id);
        console.log(' Project record deleted successfully');
      } catch (deleteError) {
        console.error(' Error deleting project record:', deleteError);
      }
    } else {
      console.log('ℹ  No project record to delete (validation failed before DB save)');
    }
    
    // Always clean up the project directory on failure
    if (projectDir) {
      try {
        console.log(` Cleaning up project directory: ${projectDir}`);
        await fs.rm(projectDir, { recursive: true, force: true });
        console.log(' Project directory cleaned up successfully');
      } catch (cleanupError) {
        console.error(' Error cleaning up project directory:', cleanupError);
      }
    }
    
    // Handle validation failures specifically
    if (error.message.includes('Invalid project structure') || error.message.includes('Validation failed')) {
      console.log(`  Repository validation failed for: ${repositoryFullName} - ${error.message}`);
      return res.status(400).json({
        success: false,
        message: 'Repository validation failed - Not a MERN project',
        error: error.message,
        requirements: [
          'Repository must be a MERN stack project (MongoDB, Express.js, React, Node.js)',
          'Supported frameworks: React, Next.js, Express.js, Node.js',
          'Repository must contain JavaScript/TypeScript files (.js, .jsx, .ts, .tsx)',
          'Repository must contain at least one package.json file',
          'Repository must not contain Python, Java, PHP, C#, Go, Ruby, or Rust backend files',
          'Repository structure should follow standard JavaScript project conventions'
        ],
        supportedProjectTypes: [
          'React applications',
          'Next.js applications', 
          'Express.js backends',
          'Node.js applications',
          'Full-stack MERN applications',
          'JavaScript/TypeScript projects'
        ]
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to import and process repository'
    });
  }
});

module.exports = router;