const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get the user's role
    const user = await User.findById(req.user.id);
    
    // Check if user is an admin
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // User is an admin, proceed to the next middleware/route handler
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking admin status'
    });
  }
};

module.exports = adminAuth; 