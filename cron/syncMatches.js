// backend/cron/syncMatches.js
const cron = require('node-cron');
const axios = require('axios');
const db = require('../db');

// Whitelist of leagues we are keeping across all 5 games (case-insensitive checks)
const LEAGUE_WHITELIST = {
    'league-of-legends': ['LEC', 'LCS', 'LCK', 'LPL', 'Worlds', 'First Stand', 'MSI', 'EMEA Masters', 'LFL'],
    'valorant': ['VCT', 'VCT EMEA', 'VCT Americas', 'VCT Pacific', 'VCT CN', 'Valorant Champions', 'VCT Masters'],
    'cs-go': ['PGL', 'IEM', 'Intel Extreme Masters', 'ESL Pro League', 'ESL One', 'ESL', 'Blast'],
    'dota-2': ['The International', 'Dream League', 'ESL One', 'PGL Wallachia'],
    'r6-siege': ['Europe MENA League', 'MENA League', 'North America League', 'NA League', 'Asia Pacific League', 'AP League', 'CN League', 'SA League', 'Six Invitational', 'Six Major']
};

const currentYear = new Date().getFullYear();
const rangeQuery = `range[scheduled_at]=${currentYear}-01-01T00:00:00Z,${currentYear}-12-31T23:59:59Z&per_page=100`;

// Map PandaScore API endpoints for our 5 main games
const GAME_ENDPOINTS = [
    { slug: 'cs-go', name: 'Counter-Strike', url: `https://api.pandascore.co/csgo/matches?${rangeQuery}`, leaguesUrl: `https://api.pandascore.co/csgo/leagues?per_page=100` },
    { slug: 'league-of-legends', name: 'League of Legends', url: `https://api.pandascore.co/lol/matches?${rangeQuery}`, leaguesUrl: `https://api.pandascore.co/lol/leagues?per_page=100` },
    { slug: 'valorant', name: 'Valorant', url: `https://api.pandascore.co/valorant/matches?${rangeQuery}`, leaguesUrl: `https://api.pandascore.co/valorant/leagues?per_page=100` },
    { slug: 'dota-2', name: 'Dota 2', url: `https://api.pandascore.co/dota2/matches?${rangeQuery}`, leaguesUrl: `https://api.pandascore.co/dota2/leagues?per_page=100` },
    { slug: 'r6-siege', name: 'Rainbow 6 Siege', url: `https://api.pandascore.co/r6siege/matches?${rangeQuery}`, leaguesUrl: `https://api.pandascore.co/r6siege/leagues?per_page=100` }
];

const isMatchWhitelisted = (gameSlug, leagueName, serieName) => {
    // Normalize game slug for any CS variant
    let normalizedSlug = gameSlug;
    if (gameSlug === 'cs-2' || gameSlug === 'counter-strike' || gameSlug === 'counter-strike-2') {
        normalizedSlug = 'cs-go';
    }
    const allowedLeagues = LEAGUE_WHITELIST[normalizedSlug];
    if (!allowedLeagues) return false;

    const matchLeague = (leagueName || '').toUpperCase();
    const matchSerie = (serieName || '').toUpperCase();
    const matchText = `${matchLeague} ${matchSerie}`.toUpperCase();

    return allowedLeagues.some(l => {
        const u = l.toUpperCase();
        if (u === 'LFL' && matchLeague === 'LFL') return true;
        if (u === 'LCK' && matchLeague === 'LCK') return true;
        if (u === 'LPL' && matchLeague === 'LPL') return true;
        if (u === 'LEC' && matchLeague === 'LEC') return true;
        if (u === 'LCS' && matchLeague === 'LCS') return true;
        
        if (u === 'MSI' && (matchText.includes('MID-SEASON INVITATIONAL') || matchText.includes('MSI'))) return true;
        if (u === 'WORLDS' && (matchText.includes('WORLD CHAMPIONSHIP') || matchText.includes('WORLDS'))) return true;
        if (u === 'VCT CN' && (matchText.includes('CHINA') || matchText.includes('CN')) && matchText.includes('VCT')) return true;
        if (u === 'VALORANT CHAMPIONS' && (matchText.includes('CHAMPIONS') || matchText.includes('VALORANT CHAMPIONS'))) return true;
        if (u === 'VCT MASTERS' && (matchText.includes('MASTERS') || matchText.includes('VCT MASTERS'))) return true;
        
        if (u !== 'LFL' && u !== 'LCK' && u !== 'LPL' && u !== 'LEC' && u !== 'LCS') {
            return matchText.includes(u);
        }
        return false;
    });
};

// Dynamically resolve matching league IDs from PandaScore for a given game
const resolveWhitelistedLeagueIds = async (game) => {
    const allowed = LEAGUE_WHITELIST[game.slug];
    if (!allowed) return [];

    let page = 1;
    let hasMore = true;
    const matchedIds = [];

    while (hasMore && page <= 5) {
        try {
            const res = await axios.get(`${game.leaguesUrl}&page=${page}`, {
                headers: { Authorization: `Bearer ${process.env.PANDASCORE_API_KEY}` }
            });
            if (res.data && res.data.length > 0) {
                res.data.forEach(l => {
                    const u = l.name.toUpperCase();
                    const matchesWhitelist = allowed.some(wl => {
                        const uwl = wl.toUpperCase();
                        if (uwl === 'LFL' && u === 'LFL') return true;
                        if (uwl === 'LCK' && u === 'LCK') return true;
                        if (uwl === 'LPL' && u === 'LPL') return true;
                        if (uwl === 'LEC' && u === 'LEC') return true;
                        if (uwl === 'LCS' && u === 'LCS') return true;
                        
                        if (uwl === 'MSI' && (u.includes('MID-SEASON INVITATIONAL') || u.includes('MSI'))) return true;
                        if (uwl === 'WORLDS' && (u.includes('WORLD CHAMPIONSHIP') || u.includes('WORLDS'))) return true;
                        if (uwl === 'VCT CN' && (u.includes('CHINA') || u.includes('CN')) && u.includes('VCT')) return true;
                        if (uwl === 'VALORANT CHAMPIONS' && (u.includes('CHAMPIONS') || u.includes('VALORANT CHAMPIONS'))) return true;
                        if (uwl === 'VCT MASTERS' && (u.includes('MASTERS') || u.includes('VCT MASTERS'))) return true;
                        
                        if (uwl !== 'LFL' && uwl !== 'LCK' && uwl !== 'LPL' && uwl !== 'LEC' && uwl !== 'LCS') {
                            return u.includes(uwl);
                        }
                        return false;
                    });
                    if (matchesWhitelist) {
                        matchedIds.push(l.id);
                    }
                });
                if (res.data.length < 100) hasMore = false;
                else page++;
            } else {
                hasMore = false;
            }
        } catch (err) {
            console.error(`❌ [CRON] Failed to fetch leagues page ${page} for ${game.name}:`, err.message);
            hasMore = false;
        }
    }
    return matchedIds;
};

const syncMatches = async () => {
    console.log('🔄 [CRON] Starting database synchronization with PandaScore...');
    try {
        const allMatches = [];
        
        // Fetch matches for all 5 games in parallel with pagination (up to 5 pages per game)
        const fetchGameMatches = async (game) => {
            console.log(`🔍 [CRON] Resolving whitelisted league IDs for ${game.name}...`);
            const matchedLeagueIds = await resolveWhitelistedLeagueIds(game);
            console.log(`🎯 [CRON] Found ${matchedLeagueIds.length} matching league IDs for ${game.name}:`, matchedLeagueIds);

            let page = 1;
            let hasMore = true;
            const gameMatches = [];

            // If we resolved league IDs, filter the matches API call by those IDs to bypass ERL noise
            const baseUrl = matchedLeagueIds.length > 0
                ? `${game.url}&filter[league_id]=${matchedLeagueIds.join(',')}`
                : game.url;

            while (hasMore && page <= 5) {
                const url = `${baseUrl}&page=${page}`;
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
        await cleanUpUnverifiedUsers();

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

const cleanUpUnverifiedUsers = async () => {
    console.log('🧹 [CRON] Cleaning up unverified user accounts older than 24 hours...');
    try {
        const result = await db.query(
            `DELETE FROM users 
             WHERE is_verified = FALSE 
               AND created_at < NOW() - INTERVAL '24 hours'`
        );
        console.log(`🧹 [CRON] Successfully purged ${result.rowCount} unverified accounts.`);
    } catch (err) {
        console.error('❌ [CRON] Error during unverified users cleanup:', err.message);
    }
};

// ⚙️ SCHEDULE: Run the synchronizer once immediately on server startup...
if (process.env.NODE_ENV !== 'test') {
    // Delay the initial sync by 5 seconds to ensure database schemas and tables are fully initialized
    setTimeout(() => {
        syncMatches();
    }, 5000);

    // ...and then schedule it to run automatically every 15 minutes
    cron.schedule('*/15 * * * *', () => {
        syncMatches();
    });
}

module.exports = { syncMatches, LEAGUE_WHITELIST };