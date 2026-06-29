// backend/cron/syncMatches.js
const cron = require('node-cron');
const axios = require('axios');
const db = require('../db');

// Whitelist of leagues we are keeping across all 5 games (case-insensitive checks)
const LEAGUE_WHITELIST = {
    'league-of-legends': ['LEC', 'LCS', 'LCK', 'LPL', 'Worlds', 'First Stand', 'MSI', 'EMEA Masters', 'LFL'],
    'valorant': ['VCT EMEA', 'VCT Americas', 'VCT Pacific', 'VCT CN', 'Valorant Champions', 'VCT Masters'],
    'cs-go': ['PGL', 'IEM', 'ESL', 'Blast'],
    'dota-2': ['The International', 'Dream League', 'ESL One', 'PGL Wallachia'],
    'r6-siege': ['Europe MENA League', 'MENA League', 'North America League', 'NA League', 'Asia Pacific League', 'AP League', 'CN League', 'SA League', 'Six Invitational', 'Six Major']
};

const currentYear = new Date().getFullYear();
const rangeQuery = `range[scheduled_at]=${currentYear}-01-01T00:00:00Z,${currentYear}-12-31T23:59:59Z&per_page=100`;

// Map PandaScore API endpoints for our 5 main games
const GAME_ENDPOINTS = [
    { slug: 'cs-go', name: 'Counter-Strike', url: `https://api.pandascore.co/csgo/matches?${rangeQuery}` },
    { slug: 'league-of-legends', name: 'League of Legends', url: `https://api.pandascore.co/lol/matches?${rangeQuery}` },
    { slug: 'valorant', name: 'Valorant', url: `https://api.pandascore.co/valorant/matches?${rangeQuery}` },
    { slug: 'dota-2', name: 'Dota 2', url: `https://api.pandascore.co/dota2/matches?${rangeQuery}` },
    { slug: 'r6-siege', name: 'Rainbow 6 Siege', url: `https://api.pandascore.co/r6siege/matches?${rangeQuery}` }
];

const isMatchWhitelisted = (gameSlug, leagueName, serieName) => {
    const allowedLeagues = LEAGUE_WHITELIST[gameSlug];
    if (!allowedLeagues) return false;

    const matchLeague = (leagueName || '').toUpperCase();
    const matchSerie = (serieName || '').toUpperCase();
    const matchText = `${matchLeague} ${matchSerie}`.toUpperCase();

    return allowedLeagues.some(l => {
        const u = l.toUpperCase();
        if (u === 'MSI' && (matchText.includes('MID-SEASON INVITATIONAL') || matchText.includes('MSI'))) return true;
        if (u === 'WORLDS' && (matchText.includes('WORLD CHAMPIONSHIP') || matchText.includes('WORLDS'))) return true;
        if (u === 'VCT CN' && (matchText.includes('CHINA') || matchText.includes('CN')) && matchText.includes('VCT')) return true;
        if (u === 'VALORANT CHAMPIONS' && (matchText.includes('CHAMPIONS') || matchText.includes('VALORANT CHAMPIONS'))) return true;
        if (u === 'VCT MASTERS' && (matchText.includes('MASTERS') || matchText.includes('VCT MASTERS'))) return true;
        return matchText.includes(u);
    });
};

const syncMatches = async () => {
    console.log('🔄 [CRON] Starting database synchronization with PandaScore...');
    try {
        const allMatches = [];
        
        // Fetch matches for all 5 games in parallel with pagination (up to 5 pages per game)
        const fetchGameMatches = async (game) => {
            let page = 1;
            let hasMore = true;
            const gameMatches = [];
            while (hasMore && page <= 5) {
                const url = `${game.url}&page=${page}`;
                try {
                    const res = await axios.get(url, {
                        headers: { Authorization: `Bearer ${process.env.PANDASCORE_API_KEY}` }
                    });
                    if (res.data && res.data.length > 0) {
                        gameMatches.push(...res.data);
                        if (res.data.length < 100) {
                            hasMore = false;
                        } else {
                            page++;
                        }
                    } else {
                        hasMore = false;
                    }
                } catch (err) {
                    console.error(`❌ [CRON] Failed to fetch page ${page} for ${game.name}:`, err.message);
                    hasMore = false;
                }
            }
            console.log(`📥 [CRON] Fetched ${gameMatches.length} raw matches for ${game.name} across ${page - 1} page(s).`);
            return gameMatches;
        };

        const fetchPromises = GAME_ENDPOINTS.map(game => fetchGameMatches(game));
        const results = await Promise.all(fetchPromises);
        
        // Merge all matches
        allMatches.push(...results.flat());
        console.log(`📥 [CRON] Total matches fetched: ${allMatches.length}. Filtering against whitelist...`);

        // Filter matches based on the whitelist
        const whitelistedMatches = allMatches.filter(match => {
            if (!match.videogame || !match.league) return false;
            return isMatchWhitelisted(match.videogame.slug, match.league.name, match.serie ? match.serie.name : '');
        });

        console.log(`🎯 [CRON] ${whitelistedMatches.length}/${allMatches.length} matches matched the whitelist. Processing database upsert...`);

        // Insert or Update matches in PostgreSQL (UPSERT pattern)
        for (const match of whitelistedMatches) {
            // Check if opponents are valid teams
            const validOpponents = match.opponents 
                ? match.opponents.filter(op => op.type === 'Team').map(op => {
                    const resultObj = match.results ? match.results.find(r => r.team_id === op.opponent.id) : null;
                    return {
                        id: op.opponent.id,
                        name: op.opponent.name,
                        image_url: op.opponent.image_url,
                        score: resultObj ? resultObj.score : 0
                    };
                  })
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

        // Cleanup database of non-whitelisted matches
        await cleanUpDatabase();

    } catch (error) {
        console.error('❌ [CRON] Fatal synchronization error:', error.message);
    }
};

const cleanUpDatabase = async () => {
    console.log('🧹 [CRON] Cleaning up database: removing matches not in the whitelist...');
    try {
        const allDbMatches = await db.query('SELECT id, game_slug, league_name, serie_name FROM matches');
        let deletedCount = 0;
        for (const row of allDbMatches.rows) {
            const isWhitelisted = isMatchWhitelisted(row.game_slug, row.league_name, row.serie_name);
            if (!isWhitelisted) {
                await db.query('DELETE FROM matches WHERE id = $1', [row.id]);
                deletedCount++;
            }
        }
        console.log(`🧹 [CRON] Cleaned up ${deletedCount} non-whitelisted matches from database.`);
    } catch (err) {
        console.error('❌ [CRON] Error during database cleanup:', err.message);
    }
};

// ⚙️ SCHEDULE: Run the synchronizer once immediately on server startup...
if (process.env.NODE_ENV !== 'test') {
    syncMatches();

    // ...and then schedule it to run automatically every 15 minutes
    cron.schedule('*/15 * * * *', () => {
        syncMatches();
    });
}

module.exports = { syncMatches, LEAGUE_WHITELIST };