// backend/routes/favorites.js
const express = require('express');
const authenticateToken = require('../middleware/auth');
const { addFavoriteTeam, removeFavoriteTeam, getUserFavorites } = require('../controllers/favoritesController');

const router = express.Router();

// POST /api/user/favorites
router.post('/', authenticateToken, addFavoriteTeam);

// DELETE /api/user/favorites/:pandascore_team_id
router.delete('/:pandascore_team_id', authenticateToken, removeFavoriteTeam);

// GET /api/user/favorites
router.get('/', authenticateToken, getUserFavorites);

module.exports = router;
