
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./auth');

const adminAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Admin auth failed - No authorization header');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find the user by ID
    const user = await User.findById(decoded.userId);
    
    // Log for debugging
    console.log('Admin auth check - User:', user ? { id: user.id, role: user.role } : 'User not found');
    
    // Check if user is an admin (accept both 'admin' string and admin property)
    if (!user || (user.role !== 'admin' && !user.isAdmin)) {
      console.log('Admin access denied for user:', decoded.userId, 'Role:', user?.role);
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    console.log('Admin access granted for user:', decoded.userId, 'Role:', user.role);
    // Attach user to the request object
    req.user = user;
    // User is an admin, proceed to the next middleware/route handler
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = adminAuth;
