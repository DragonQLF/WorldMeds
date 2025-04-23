const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');

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