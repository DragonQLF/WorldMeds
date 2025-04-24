const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'profile-pictures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created directory for uploads: ${uploadDir}`);
}

// Configure multer for memory storage (we'll process the files manually)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Protected routes (require authentication)
router.use(authenticate);

// Get user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.put('/profile', upload.single('profilePicture'), userController.updateProfile);

// Upload profile picture
router.post('/upload-profile-picture', upload.single('profilePicture'), userController.uploadProfilePicture);

// Change password
router.put('/change-password', userController.changePassword);

module.exports = router; 