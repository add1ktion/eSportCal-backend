// backend/app.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
require('./db'); // Connect to PostgreSQL

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.send('eSportCal API is running...');
});

// Proxy route to PandaScore CSGO matches
app.get('/api/matches', async (req, res) => {
    try {
        console.log('Fetching matches from PandaScore...');
        
        const response = await axios.get('https://api.pandascore.co/csgo/matches/upcoming', {
            headers: {
                Authorization: `Bearer ${process.env.PANDASCORE_API_KEY}`
            }
        });

        const cleanMatches = response.data.map(match => {
            return {
                id: match.id,
                name: match.name,
                status: match.status,
                scheduled_at: match.scheduled_at,
                game: match.videogame.name,
                league_name: match.league.name,
                league_image: match.league.image_url,
                teams: match.opponents.map(op => ({
                    id: op.opponent.id,
                    name: op.opponent.name,
                    image_url: op.opponent.image_url
                }))
            };
        });

        res.json(cleanMatches);

    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

module.exports = app; // Export for testing