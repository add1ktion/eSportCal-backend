// backend/routes/user.js
const express = require('express');
const authenticateToken = require('../middleware/auth');
const { getUserProfile, updateUserProfile, deleteUserProfile } = require('../controllers/userController');

const router = express.Router();

// GET /api/user/me
router.get('/me', authenticateToken, getUserProfile);

// PUT /api/user/me
router.put('/me', authenticateToken, updateUserProfile);

// DELETE /api/user/me
router.delete('/me', authenticateToken, deleteUserProfile);

module.exports = router;
