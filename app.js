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

        // Map and clean PandaScore payload to match our Figma requirements perfectly
        const cleanMatches = response.data.map(match => {
            // 📺 Find the main stream (Twitch/Kick) or fallback to first available
            const mainStream = match.streams_list.find(s => s.main === true) || match.streams_list[0];

            return {
                id: match.id,
                name: match.name,
                status: match.status,
                scheduled_at: match.scheduled_at,
                
                // 🎮 Game details (CSGO, LoL, etc.)
                game_name: match.videogame.name, // "Counter-Strike"
                game_slug: match.videogame.slug, // "cs-go" (Used for local icon mapping)
                
                // 🏆 League & Tournament details (ex: LEC / Spring Split / Playoffs)
                league_name: match.league.name,      // "CCT Europe"
                league_image: match.league.image_url, // Official league logo
                serie_name: match.serie.full_name,    // "Series 3 2026" / "Spring Split 2026"
                stage_name: match.tournament.name,    // "Playoffs" / "Group Stage"
                
                // ⚙️ Match details (BO3 / BO5)
                number_of_games: match.number_of_games, // 3 or 5 (Used for BO3/BO5 display)
                match_type: match.match_type,           // "best_of"
                
                // 📺 Live Stream Link
                stream_url: mainStream ? mainStream.raw_url : null, // Twitch or Kick raw URL
                
                // 👥 Team Details (Names and Logos)
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