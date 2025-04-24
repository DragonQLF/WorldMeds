const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');

// User registration
exports.register = async (req, res) => {
  try {
    // Support both formats of field names
    const { first_name, last_name, firstName, lastName, email, password } = req.body;
    
    // Use either format that's available
    const userFirstName = first_name || firstName;
    const userLastName = last_name || lastName;
    
    // Validate required fields
    if (!userFirstName || !userLastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Check if user with this email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }
    
    // Create new user (role will be set to 'user' by default in the database)
    const user = await User.create({
      first_name: userFirstName,
      last_name: userLastName,
      email,
      password
    });
    
    // Generate JWT token
    const token = generateToken(user.id);
    
    // Send response with consistent field names
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        firstName: user.first_name, // Include both formats for compatibility
        lastName: user.last_name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration'
    });
  }
};

// User login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = generateToken(user.id);
    
    // Format user data (remove password) and include both naming conventions
    const userData = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role || 'user'
    };
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
};

// Forgot password (placeholder for future implementation)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      // For security reasons, we return success even if the email doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent'
      });
    }
    
    // In a real implementation, generate a password reset token and send an email
    // For now, just return a success message
    
    res.status(200).json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
}; 