// backend/routes/auth.js
const express = require('express');
const { register, verifyEmail, login } = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// GET /api/auth/verify-email/:token
router.get('/verify-email/:token', verifyEmail);

// POST /api/auth/login
router.post('/login', login);

module.exports = router;
