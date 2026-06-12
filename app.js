// backend/app.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer'); // 👈 1. Imported nodemailer at the top!
require('dotenv').config();
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// --- Authentication token ---
const authenticateToken = require('./middleware/auth');

app.get('/api/user/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// Route pour ajouter une équipe favorite
app.post('/api/user/favorites', authenticateToken, async (req, res) => {
    const { pandascore_team_id } = req.body;
    const userId = req.user.userId;

    try {
        // Ajouter l'équipe aux favoris (ignorer si déjà présente)
        const result = await db.query(
            'INSERT INTO favorite_teams (user_id, pandascore_team_id) VALUES ($1, $2) ON CONFLICT (user_id, pandascore_team_id) DO NOTHING RETURNING *',
            [userId, pandascore_team_id]
        );

        res.status(201).json({ 
            message: "Équipe favorite ajoutée avec succès.",
            favorite: result.rows[0] || { user_id: userId, pandascore_team_id }
        });
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({ error: "Erreur lors de l'ajout de l'équipe aux favoris." });
    }
});

// Route pour supprimer une équipe des favoris
app.delete('/api/user/favorites/:pandascore_team_id', authenticateToken, async (req, res) => {
    const { pandascore_team_id } = req.params;
    const userId = req.user.userId;

    try {
        const result = await db.query(
            'DELETE FROM favorite_teams WHERE user_id = $1 AND pandascore_team_id = $2 RETURNING *',
            [userId, pandascore_team_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Équipe favorie non trouvée." });
        }

        res.status(200).json({ message: "Équipe supprimée des favoris avec succès." });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ error: "Erreur lors de la suppression de l'équipe des favoris." });
    }
});

// Route pour récupérer les équipes favorites de l'utilisateur
app.get('/api/user/favorites', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await db.query(
            'SELECT * FROM favorite_teams WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        res.status(200).json({ favorites: result.rows });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ error: "Erreur lors de la récupération des équipes favorites." });
    }
});

// ─── Health check ─────────────────────────
app.get('/', (req, res) => {
    res.send('eSportCal API is running...');
});

// ─── Contact Us (Nodemailer SMTP Proxy) ───
app.post('/api/contact', async (req, res) => { // 👈 2. Added the real-time contact endpoint!
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
});

// ─── Matches (PandaScore proxy) ───────────
app.get('/api/matches', async (req, res) => {
    try {
        console.log('Fetching matches from PandaScore...');
        
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        const formattedDate = twoMonthsAgo.toISOString().split('T')[0];

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
                game_name: match.videogame.name,
                game_slug: match.videogame.slug,
                league_name: match.league.name,
                league_image: match.league.image_url,
                serie_name: match.serie.full_name,
                stage_name: match.tournament.name,
                number_of_games: match.number_of_games,
                match_type: match.match_type,
                stream_url: mainStream ? mainStream.raw_url : null,
                teams: match.opponents.map(op => ({
                    id: op.opponent.id,
                    name: op.opponent.name,
                    image_url: op.opponent.image_url
                }))
            };
        });

        cleanMatches.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

        res.json(cleanMatches);

    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

module.exports = app;