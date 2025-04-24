const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);
const mkdirp = require('mkdirp');

// Helper to get absolute URL for uploads
const getUploadUrl = (relativePath) => {
  // This should match your API domain and base path
  const apiBaseUrl = process.env.API_URL || 'http://localhost:3001'; 
  // Make sure the path starts with a slash
  const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${apiBaseUrl}${normalizedPath}`;
};

// Get uploads directory path that works in both dev and Docker environments
const getUploadsDir = () => {
  // Check if we're in a Docker environment
  const basePath = fs.existsSync('/usr/src/app') ? '/usr/src/app' : path.join(__dirname, '..');
  return path.join(basePath, 'public', 'uploads', 'profile-pictures');
};

// Get the current user's profile
exports.getProfile = async (req, res) => {
  try {
    // User is already attached to the request by the auth middleware
    const user = req.user;
    
    // Convert relative profile picture path to absolute URL if it exists
    if (user && user.profilePicture) {
      user.profilePicture = getUploadUrl(user.profilePicture);
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user profile'
    });
  }
};

// Update the current user's profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email } = req.body;
    
    // Create an object with the fields to update
    const updateData = {};
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    
    // Check if we have a file upload
    if (req.file) {
      // Save the file path relative to the uploads directory
      const filename = `user_${userId}_${Date.now()}${path.extname(req.file.originalname)}`;
      const uploadDir = getUploadsDir();
      const filePath = path.join(uploadDir, filename);
      
      console.log('Update profile - Upload directory:', uploadDir);
      console.log('File path:', filePath);
      
      // Ensure directory exists using mkdirp
      await mkdirp(uploadDir);
      console.log(`Created/Verified directory: ${uploadDir}`);
      
      // Write the file using the promisified writeFile
      await writeFile(filePath, req.file.buffer);
      console.log(`File saved to: ${filePath}`);
      
      // Store relative path in database
      updateData.profilePicture = `/uploads/profile-pictures/${filename}`;
    }
    
    // Update the user
    const updatedUser = await User.updateProfile(userId, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Convert profile picture to full URL if it exists
    if (updatedUser.profilePicture) {
      updatedUser.profilePicture = getUploadUrl(updatedUser.profilePicture);
    }
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// Upload a profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Create uploads directory if it doesn't exist
    const uploadDir = getUploadsDir();
    
    console.log('Upload directory path:', uploadDir);
    console.log('Directory exists before mkdirp:', fs.existsSync(uploadDir));
    
    // Ensure directory exists using mkdirp
    await mkdirp(uploadDir);
    console.log('Directory exists after mkdirp:', fs.existsSync(uploadDir));
    console.log(`Created/Verified directory: ${uploadDir}`);
    
    // Create a unique filename based on user ID and timestamp
    const filename = `user_${userId}_${Date.now()}${path.extname(req.file.originalname)}`;
    const filePath = path.join(uploadDir, filename);
    
    console.log('File will be saved to:', filePath);
    
    // Write the file to disk using promisified writeFile
    await writeFile(filePath, req.file.buffer);
    console.log('File exists after writing:', fs.existsSync(filePath));
    console.log(`File saved to: ${filePath}`);
    
    // Update the user's profile with the new image path - store as relative path
    const profilePicturePath = `/uploads/profile-pictures/${filename}`;
    const updatedUser = await User.updateProfile(userId, { profilePicture: profilePicturePath });
    
    // Return an absolute URL for the frontend to use
    const profilePictureUrl = getUploadUrl(profilePicturePath);
    
    console.log(`Profile picture updated for user ${userId}: ${profilePictureUrl}`);
    
    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePictureUrl
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading profile picture'
    });
  }
};

// Change the current user's password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    // Change the password
    await User.changePassword(userId, currentPassword, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    
    // If current password is incorrect
    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
}; 