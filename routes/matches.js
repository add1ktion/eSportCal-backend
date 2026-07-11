// backend/routes/matches.js
const express = require('express');
const { getMatches, getTeamDetails, contactUs, getUniqueTeams } = require('../controllers/matchesController');

const router = express.Router();

// GET /api/matches
router.get('/matches', getMatches);

// GET /api/teams (must be defined BEFORE dynamic :id path to prevent routing collision)
router.get('/teams', getUniqueTeams);

// GET /api/teams/:id
router.get('/teams/:id', getTeamDetails);

// POST /api/contact
router.post('/contact', contactUs);

module.exports = router;
