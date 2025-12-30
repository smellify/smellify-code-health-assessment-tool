const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');
const DeletedAccount = require('../models/DeletedAccounts');
const authMiddleware = require('../middleware/auth');


const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId || req.user.user_id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been banned',
        code: 'ACCOUNT_BANNED'
      });
    }

    if (user.role !== 2) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required',
        code: 'FORBIDDEN'
      });
    }
    req.userDetails = user;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authorization check failed',
      code: 'AUTH_CHECK_ERROR'
    });
  }
};


router.get('/dashboard', authMiddleware, isAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      bannedUsers,
      totalSessions,
      activeSessions,
      deletedAccounts,
      githubLinkedUsers,
      recentUsers,
      recentDeletions
    ] = await Promise.all([
      
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isActive: false }),
      Session.countDocuments(),
    
      Session.countDocuments({
        lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      
      // Total deleted accounts
      DeletedAccount.countDocuments(),
      
      // Users with GitHub linked
      User.countDocuments({ githubId: { $ne: null } }),
      
      // Recent 10 users
      User.find()
        .select('name email createdAt isActive isVerified role')
        .sort({ createdAt: -1 })
        .limit(10),
      
      // Recent deletions
      DeletedAccount.find()
        .select('email deletedAt reason')
        .sort({ deletedAt: -1 })
        .limit(10)
    ]);

    res.json({
      success: true,
      data: {
        statistics: {
          users: {
            total: totalUsers,
            active: activeUsers,
            verified: verifiedUsers,
            banned: bannedUsers,
            githubLinked: githubLinkedUsers
          },
          sessions: {
            total: totalSessions,
            activeLast24Hours: activeSessions
          },
          deletedAccounts: deletedAccounts
        },
        recentActivity: {
          recentUsers,
          recentDeletions
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard data' 
    });
  }
});


router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'banned') {
      query.isActive = false;
    } else if (status === 'verified') {
      query.isVerified = true;
    } else if (status === 'unverified') {
      query.isVerified = false;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('-password -verificationCode -passwordResetCode -emailVerificationToken')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users' 
    });
  }
});


router.get('/users/:userId', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password -verificationCode -passwordResetCode -emailVerificationToken')
      .lean();

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get user's sessions
    const sessions = await Session.find({ userId })
      .sort({ lastActive: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        user,
        sessions
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user details' 
    });
  }
});


router.put('/users/:userId/ban', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Prevent admin from banning themselves
    if (userId === req.userDetails._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot ban yourself' 
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (!user.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is already banned' 
      });
    }

    // Ban the user
    user.isActive = false;
    await user.save();

    // Delete all active sessions for this user
    await Session.deleteMany({ userId });

    res.json({
      success: true,
      message: 'User banned successfully',
      data: {
        userId: user._id,
        email: user.email,
        isActive: user.isActive,
        bannedBy: req.userDetails.email,
        reason: reason || 'No reason provided'
      }
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to ban user' 
    });
  }
});


router.put('/users/:userId/unban', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (user.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is not banned' 
      });
    }

    // Unban the user
    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: 'User unbanned successfully',
      data: {
        userId: user._id,
        email: user.email,
        isActive: user.isActive,
        unbannedBy: req.userDetails.email
      }
    });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to unban user' 
    });
  }
});


router.put('/users/:userId/role', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (![1, 2].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be 1 (user) or 2 (admin)' 
      });
    }

    // Prevent admin from demoting themselves
    if (userId === req.userDetails._id.toString() && role !== 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change your own role' 
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        userId: user._id,
        email: user.email,
        role: user.role,
        roleName: role === 2 ? 'Admin' : 'User',
        updatedBy: req.userDetails.email
      }
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user role' 
    });
  }
});

router.delete('/users/:userId', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Prevent admin from deleting themselves
    if (userId === req.userDetails._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Create deleted account record
    await DeletedAccount.create({
      originalUserId: user._id,
      email: user.email,
      githubIdHistory: user.githubIdHistory,
      deletedAt: new Date(),
      deletedIp: req.ip,
      reason: reason || 'Deleted by admin'
    });

    // Delete all sessions
    await Session.deleteMany({ userId: user._id });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User account deleted successfully',
      data: {
        deletedEmail: user.email,
        deletedBy: req.userDetails.email,
        reason: reason || 'Deleted by admin'
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete user' 
    });
  }
});


router.put('/users/:userId/scans', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { scans, operation = 'set' } = req.body; // operation: 'set', 'add', 'subtract'

    if (typeof scans !== 'number' || scans < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid scan count' 
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const oldScans = user.remainingScans;

    switch (operation) {
      case 'add':
        user.remainingScans += scans;
        break;
      case 'subtract':
        user.remainingScans = Math.max(0, user.remainingScans - scans);
        break;
      case 'set':
      default:
        user.remainingScans = scans;
        break;
    }

    await user.save();

    res.json({
      success: true,
      message: 'User scans updated successfully',
      data: {
        userId: user._id,
        email: user.email,
        oldScans,
        newScans: user.remainingScans,
        operation,
        updatedBy: req.userDetails.email
      }
    });
  } catch (error) {
    console.error('Update scans error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user scans' 
    });
  }
});


router.get('/sessions', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, userId } = req.query;

    const query = userId ? { userId } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sessions, totalCount] = await Promise.all([
      Session.find(query)
        .populate('userId', 'email name role isActive')
        .sort({ lastActive: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      
      Session.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch sessions' 
    });
  }
});


router.delete('/sessions/:sessionId', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    await Session.deleteOne({ sessionId });

    res.json({
      success: true,
      message: 'Session deleted successfully',
      data: {
        sessionId,
        deletedBy: req.userDetails.email
      }
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete session' 
    });
  }
});


router.delete('/users/:userId/sessions', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Session.deleteMany({ userId });

    res.json({
      success: true,
      message: 'All user sessions deleted successfully',
      data: {
        userId,
        sessionsDeleted: result.deletedCount,
        deletedBy: req.userDetails.email
      }
    });
  } catch (error) {
    console.error('Delete user sessions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete user sessions' 
    });
  }
});


router.get('/deleted-accounts', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    const query = {};
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [deletedAccounts, totalCount] = await Promise.all([
      DeletedAccount.find(query)
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      
      DeletedAccount.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        deletedAccounts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get deleted accounts error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch deleted accounts' 
    });
  }
});


router.get('/github-history/:githubId', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { githubId } = req.params;

    const [currentUser, deletedAccount] = await Promise.all([
      User.findOne({ 'githubIdHistory.githubId': githubId })
        .select('email githubIdHistory')
        .lean(),
      
      DeletedAccount.findOne({ 'githubIdHistory.githubId': githubId })
        .select('email githubIdHistory deletedAt')
        .lean()
    ]);

    const history = {
      githubId,
      isUsed: !!(currentUser || deletedAccount),
      currentUser: currentUser ? {
        email: currentUser.email,
        userId: currentUser._id,
        history: currentUser.githubIdHistory.filter(h => h.githubId === githubId)
      } : null,
      deletedAccount: deletedAccount ? {
        email: deletedAccount.email,
        deletedAt: deletedAccount.deletedAt,
        history: deletedAccount.githubIdHistory.filter(h => h.githubId === githubId)
      } : null
    };

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('GitHub history check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check GitHub history' 
    });
  }
});

router.get('/statistics/growth', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y

    const periodMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };

    const days = periodMap[period] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        growth: users
      }
    });
  } catch (error) {
    console.error('Growth statistics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch growth statistics' 
    });
  }
});

module.exports = router;