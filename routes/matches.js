// backend/routes/matches.js
const express = require('express');
const { getMatches, getTeamDetails, contactUs } = require('../controllers/matchesController');

const router = express.Router();

// GET /api/matches
router.get('/matches', getMatches);

// GET /api/teams/:id
router.get('/teams/:id', getTeamDetails);

// POST /api/contact
router.post('/contact', contactUs);

module.exports = router;
