// backend/app.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('eSportCal API is running...');
});

// Proxy route fetching upcoming and past matches for ALL games (Global API)
app.get('/api/matches', async (req, res) => {
    try {
        console.log('Fetching matches from PandaScore...');
        
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        const formattedDate = twoMonthsAgo.toISOString().split('T')[0];

        // Fetch from global endpoints to get CS2, LoL, Valorant, Dota2 and R6
        const [upcomingResponse, pastResponse] = await Promise.all([
            axios.get('https://api.pandascore.co/matches/upcoming?per_page=100', {
                headers: { Authorization: `Bearer ${process.env.PANDASCORE_API_KEY}` }
            }),
            axios.get(`https://api.pandascore.co/matches/past?range[scheduled_at]=${formattedDate},2030-01-01&per_page=50`, {
                headers: { Authorization: `Bearer ${process.env.PANDASCORE_API_KEY}` }
            })
        ]);

        const allRawMatches = [...upcomingResponse.data, ...pastResponse.data];

        const cleanMatches = allRawMatches.map(match => {
            const mainStream = match.streams_list.find(s => s.main === true) || match.streams_list[0];

            return {
                id: match.id,
                name: match.name,
                status: match.status,
                scheduled_at: match.scheduled_at,
                
                // Game details
                game_name: match.videogame.name,
                game_slug: match.videogame.slug, // e.g. "league-of-legends"
                
                // Tournament & League details
                league_name: match.league.name,
                league_image: match.league.image_url,
                serie_name: match.serie.full_name,
                stage_name: match.tournament.name,
                
                // Match format
                number_of_games: match.number_of_games,
                match_type: match.match_type,
                
                // Live Stream URL
                stream_url: mainStream ? mainStream.raw_url : null,
                
                // Teams
                teams: match.opponents.map(op => ({
                    id: op.opponent.id,
                    name: op.opponent.name,
                    image_url: op.opponent.image_url
                }))
            };
        });

        // Sort chronologically
        cleanMatches.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

        res.json(cleanMatches);

    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

module.exports = app;