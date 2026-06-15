// backend/cron/syncMatches.js
const cron = require('node-cron');
const axios = require('axios');
const db = require('../db');

// Map PandaScore API endpoints for our 5 main games
const GAME_ENDPOINTS = [
    { slug: 'cs-go', name: 'Counter-Strike', url: 'https://api.pandascore.co/csgo/matches?per_page=30' },
    { slug: 'league-of-legends', name: 'League of Legends', url: 'https://api.pandascore.co/lol/matches?per_page=500' },
    { slug: 'valorant', name: 'Valorant', url: 'https://api.pandascore.co/valorant/matches?per_page=30' },
    { slug: 'dota-2', name: 'Dota 2', url: 'https://api.pandascore.co/dota2/matches?per_page=30' },
    { slug: 'r6-siege', name: 'Rainbow 6 Siege', url: 'https://api.pandascore.co/r6siege/matches?per_page=30' }
];

const syncMatches = async () => {
    console.log('🔄 [CRON] Starting database synchronization with PandaScore...');
    try {
        // Fetch matches for all 5 games in parallel (DevOps optimization)
        const fetchPromises = GAME_ENDPOINTS.map(game => 
            axios.get(game.url, {
                headers: { Authorization: `Bearer ${process.env.PANDASCORE_API_KEY}` }
            }).catch(err => {
                console.error(`❌ [CRON] Failed to fetch matches for ${game.name}:`, err.message);
                return { data: [] }; // Safe fallback if one game API fails
            })
        );

        const responses = await Promise.all(fetchPromises);
        
        // Merge all games matches into a single flat array
        const allMatches = responses.flatMap(res => res.data);
        console.log(`📥 [CRON] Fetched ${allMatches.length} raw matches from API. Processing database upsert...`);

        // Insert or Update matches in PostgreSQL (UPSERT pattern)
        for (const match of allMatches) {
            // Check if opponents are valid teams
            const validOpponents = match.opponents 
                ? match.opponents.filter(op => op.type === 'Team').map(op => ({
                    id: op.opponent.id,
                    name: op.opponent.name,
                    image_url: op.opponent.image_url
                  }))
                : [];

            const mainStream = match.streams_list ? (match.streams_list.find(s => s.main === true) || match.streams_list[0]) : null;

            const values = [
                match.id,
                match.name,
                match.status,
                match.scheduled_at,
                match.videogame.name,
                match.videogame.slug,
                match.league.name,
                match.league.image_url,
                match.serie?.full_name || null,
                match.tournament?.name || null,
                match.number_of_games,
                match.match_type,
                mainStream ? mainStream.raw_url : null,
                JSON.stringify(validOpponents) // Stringify our teams array for JSONB column
            ];

            // SQL Query using "ON CONFLICT (id) DO UPDATE" to sync status modifications
            await db.query(`
                INSERT INTO matches (id, name, status, scheduled_at, game_name, game_slug, league_name, league_image, serie_name, stage_name, number_of_games, match_type, stream_url, teams)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (id) 
                DO UPDATE SET 
                    status = EXCLUDED.status,
                    scheduled_at = EXCLUDED.scheduled_at,
                    stream_url = EXCLUDED.stream_url,
                    teams = EXCLUDED.teams,
                    updated_at = NOW()
            `, values);
        }

        console.log('✅ [CRON] Database matches cache successfully updated!');

    } catch (error) {
        console.error('❌ [CRON] Fatal synchronization error:', error.message);
    }
};

// ⚙️ SCHEDULE: Run the synchronizer once immediately on server startup...
syncMatches();

// ...and then schedule it to run automatically every 15 minutes
cron.schedule('*/15 * * * *', () => {
    syncMatches();
});

module.exports = { syncMatches };