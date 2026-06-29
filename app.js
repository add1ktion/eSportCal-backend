// backend/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./cron/syncMatches'); // 🤖 Starts background database synchronization (Cron Job)

const app = express();

app.use(cors());
app.use(express.json());

// ─── Routers ───────────────────────────────
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const favoritesRoutes = require('./routes/favorites');
const matchesRoutes = require('./routes/matches');

// ─── Route Declarations ────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user/favorites', favoritesRoutes); // Must register favorites before generic user router
app.use('/api/user', userRoutes);
app.use('/api', matchesRoutes); // Gère /api/matches, /api/teams/:id, /api/contact

// ─── Health check ─────────────────────────
app.get('/', (req, res) => {
    res.send('eSportCal API is running...');
});

module.exports = app;