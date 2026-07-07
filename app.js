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

// ─── Health check & Monitoring ─────────────────────────
const client = require('prom-client');
client.collectDefaultMetrics({ register: client.register });

app.get('/metrics', async (req, res) => {
    if (process.env.METRICS_TOKEN) {
        const authHeader = req.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${process.env.METRICS_TOKEN}`) {
            return res.status(401).send('Unauthorized');
        }
    }
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

app.get('/', (req, res) => {
    res.send('eSportCal API is running...');
});

const db = require('./db');
app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        return res.status(200).json({
            status: 'UP',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: 'CONNECTED'
        });
    } catch (err) {
        console.error('❌ Health check database connection failure:', err.message);
        return res.status(503).json({
            status: 'DOWN',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: 'DISCONNECTED',
            error: err.message
        });
    }
});

const Sentry = require("@sentry/node");
Sentry.setupExpressErrorHandler(app);

module.exports = app;