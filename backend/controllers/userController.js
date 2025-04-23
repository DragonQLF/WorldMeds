const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);
const mkdirp = require('mkdirp');

// Helper to get absolute URL for uploads
const getUploadUrl = (relativePath) => {
  // This should match your API domain and base path
  const apiBaseUrl = 'http://localhost:3001'; 
  return `${apiBaseUrl}${relativePath}`;
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
      const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'profile-pictures');
      const filePath = path.join(uploadDir, filename);
      
      // Ensure directory exists
      await mkdirp(uploadDir);
      
      // Write the file
      await writeFile(filePath, req.file.buffer);
      
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
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'profile-pictures');
    await mkdirp(uploadDir);
    
    // Create a unique filename based on user ID and timestamp
    const filename = `user_${userId}_${Date.now()}${path.extname(req.file.originalname)}`;
    const filePath = path.join(uploadDir, filename);
    
    // Write the file to disk
    await writeFile(filePath, req.file.buffer);
    
    // Update the user's profile with the new image path - store as relative path
    const profilePicturePath = `/uploads/profile-pictures/${filename}`;
    const updatedUser = await User.updateProfile(userId, { profilePicture: profilePicturePath });
    
    // Return an absolute URL for the frontend to use
    const profilePictureUrl = getUploadUrl(profilePicturePath);
    
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