
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register a new user
router.post('/signup', authController.register);

// Login
router.post('/login', authController.login);

// Forgot password
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password', authController.resetPassword);

// Verify email
router.post('/verify-email', authController.verifyEmail);

module.exports = router;
