// backend/routes/auth.js
const express = require('express');
const { register, verifyEmail, login, forgotPassword, resetPassword, googleCallback, twitchCallback, googleAuthRedirect, twitchAuthRedirect } = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// GET /api/auth/verify-email/:token
router.get('/verify-email/:token', verifyEmail);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// GET /api/auth/google/callback
router.get('/google/callback', googleCallback);

// GET /api/auth/twitch/callback
router.get('/twitch/callback', twitchCallback);

// GET /api/auth/google (redirects user to Google OAuth page)
router.get('/google', googleAuthRedirect);

// GET /api/auth/twitch (redirects user to Twitch OAuth page)
router.get('/twitch', twitchAuthRedirect);

module.exports = router;
