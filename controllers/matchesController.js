// backend/controllers/matchesController.js
const db = require('../db');
const nodemailer = require('nodemailer');
const { fetchTeamFromApi } = require('../services/pandascore');

// GET /api/matches
async function getMatches(req, res) {
    try {
        console.log('Reading matches from local PostgreSQL cache...');
        
        const result = await db.query(
            'SELECT * FROM matches ORDER BY scheduled_at ASC'
        );
        
        res.json(result.rows);

    } catch (error) {
        console.error('Error reading matches from DB:', error.stack);
        res.status(500).json({ error: 'Failed to read matches from database' });
    }
}

// GET /api/teams/:id
async function getTeamDetails(req, res) {
    const teamId = req.params.id;

    try {
        console.log(`Checking teams_cache for team ID: ${teamId}...`);
        
        // 1. Check local cache
        const cacheRes = await db.query(
            'SELECT * FROM teams_cache WHERE id = $1',
            [teamId]
        );

        if (cacheRes.rows.length > 0) {
            console.log(`✅ [CACHE HIT] Found team details for ID: ${teamId}`);
            return res.json(cacheRes.rows[0]);
        }

        console.log(`❌ [CACHE MISS] Fetching team details for ID: ${teamId} from PandaScore...`);

        // 2. Fetch from PandaScore API
        const team = await fetchTeamFromApi(teamId);

        // Clean & keep only necessary player properties
        const players = team.players ? team.players.map(p => ({
            id: p.id,
            name: p.name,
            first_name: p.first_name,
            last_name: p.last_name,
            role: p.role,
            image_url: p.image_url
        })) : [];

        // 3. Upsert into teams_cache
        const insertRes = await db.query(
            `INSERT INTO teams_cache (id, name, image_url, players, updated_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (id) 
             DO UPDATE SET
                 name = EXCLUDED.name,
                 image_url = EXCLUDED.image_url,
                 players = EXCLUDED.players,
                 updated_at = NOW()
             RETURNING *`,
            [team.id, team.name, team.image_url, JSON.stringify(players)]
        );

        console.log(`✅ [CACHE SET] Successfully cached team details for ID: ${teamId}`);
        res.json(insertRes.rows[0]);

    } catch (error) {
        console.error(`❌ Error fetching team details for ID ${teamId}:`, error.message);
        res.status(500).json({ error: 'Failed to fetch team details' });
    }
}

// POST /api/contact
async function contactUs(req, res) {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT === '465',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"${name}" <${process.env.EMAIL_USER}>`,
        replyTo: email,
        to: process.env.EMAIL_TO,
        subject: `[eSportCal Contact] ${subject}`,
        text: `You received a new message from eSportCal:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; background-color: #090a15; color: #f3f4f6; border-radius: 10px;">
                <h2 style="color: #5c3be0; border-bottom: 1px solid #232549; padding-bottom: 10px;">New Contact Message</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Visitor Email:</strong> <a href="mailto:${email}" style="color: #a370f7;">${email}</a></p>
                <p><strong>Subject:</strong> ${subject}</p>
                <div style="background-color: #111226; padding: 15px; border-radius: 8px; border: 1px solid #232549; margin-top: 15px; font-style: italic;">
                    "${message}"
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
        console.error('❌ [POST /api/contact] Nodemailer Error:', error);
        res.status(500).json({ error: 'Failed to send email. Please try again later.' });
    }
}

module.exports = {
    getMatches,
    getTeamDetails,
    contactUs
};
