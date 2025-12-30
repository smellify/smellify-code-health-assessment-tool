const jwt = require('jsonwebtoken');
const Session = require('../models/Session'); // Add this import

module.exports = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            message: 'No token provided',
            code: 'NO_TOKEN'
        });
    }

    try {
        // Verify JWT token
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if this is a new token format (with sessionId) or old format
        if (payload.sessionId) {
            // New session-based authentication
            
            // Check if session still exists in database
            const session = await Session.findOne({
                userId: payload.userId || payload.user_id, // Support both formats
                sessionId: payload.sessionId
            });
            
            if (!session) {
                return res.status(401).json({ 
                    message: 'Session expired or invalid. Please log in again.',
                    code: 'SESSION_EXPIRED'
                });
            }
            
            // Update last active timestamp
            session.lastActive = new Date();
            await session.save();
            
            // Set user info for request (normalize the format)
            req.user = {
                userId: payload.userId || payload.user_id,
                user_id: payload.userId || payload.user_id, // Keep backward compatibility
                sessionId: payload.sessionId,
                email: payload.email
            };
            
        } else {
            // Legacy token format (no sessionId) - for backward compatibility
            // You can either:
            // 1. Force re-login by rejecting these tokens
            // 2. Support them temporarily
            
            // Option 1: Force re-login (recommended for security)
            return res.status(401).json({ 
                message: 'Please log in again for enhanced security.',
                code: 'LEGACY_TOKEN'
            });
            
            // Option 2: Temporary backward compatibility (uncomment if needed)
            /*
            req.user = {
                userId: payload.user_id,
                user_id: payload.user_id,
                sessionId: null // No session for legacy tokens
            };
            */
        }
        
        next();
        
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token expired. Please log in again.',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid token format.',
                code: 'INVALID_TOKEN'
            });
        }
        
        console.error('Auth middleware error:', err);
        return res.status(401).json({ 
            message: 'Authentication failed.',
            code: 'AUTH_ERROR'
        });
    }
};