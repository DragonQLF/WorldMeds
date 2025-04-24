const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT secret for signing tokens
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Use environment variable in production

// Middleware to authenticate JWT tokens
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authorization token is required' 
      });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find the user by ID
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Attach the user to the request object
    req.user = user;
    
    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

// Middleware that attempts to authenticate but proceeds even if no token is present
const authenticateOptional = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    // If no auth header, continue without authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    
    try {
      // Extract the token
      const token = authHeader.split(' ')[1];
      
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Find the user by ID
      const user = await User.findById(decoded.userId);
      
      if (user) {
        // Attach the user to the request object
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (error) {
      // If token verification fails, continue without user
      console.log('Token verification failed in authenticateOptional, continuing as guest:', error.message);
      req.user = null;
    }
    
    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    // On any error, continue without user
    console.error('Optional authentication error:', error);
    req.user = null;
    next();
  }
};

// Generate a JWT token for a user
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    JWT_SECRET, 
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find the user by ID
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Attach the user to the request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

module.exports = {
  authenticate,
  authenticateOptional,
  generateToken,
  JWT_SECRET,
  authMiddleware
}; 