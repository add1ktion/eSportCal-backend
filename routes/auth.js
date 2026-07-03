// backend/routes/auth.js
const express = require('express');
const { register, verifyEmail, login, forgotPassword, resetPassword } = require('../controllers/authController');

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

module.exports = router;
