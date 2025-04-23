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

// Generate a JWT token for a user
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    JWT_SECRET, 
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

module.exports = {
  authenticate,
  generateToken,
  JWT_SECRET
}; 