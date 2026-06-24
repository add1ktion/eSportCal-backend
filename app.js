// backend/app.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');
require('./cron/syncMatches'); // 🤖 Starts background database synchronization (Cron Job)

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

// Route pour modifier le profil utilisateur (Mot de passe, email, username)
app.put('/api/user/me', authenticateToken, async (req, res) => {
    const { username, email, password } = req.body;
    const userId = req.user.userId;

    try {
        // 1. Récupérer l'utilisateur actuel
        const userRes = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const currentUser = userRes.rows[0];

        let updatedUsername = currentUser.username;
        let updatedEmail = currentUser.email;
        let updatedPasswordHash = currentUser.password_hash;

        // 2. Valider et préparer les changements
        if (username !== undefined) {
            const trimmedUsername = username.trim();
            if (typeof trimmedUsername !== 'string' || trimmedUsername.length < 3) {
                return res.status(400).json({ error: 'username must be at least 3 characters.' });
            }
            if (trimmedUsername.toLowerCase() !== currentUser.username.toLowerCase()) {
                // Vérifier l'unicité de l'username
                const uniqueCheck = await db.query('SELECT id FROM users WHERE username = $1', [trimmedUsername]);
                if (uniqueCheck.rows.length > 0) {
                    return res.status(409).json({ error: 'username already in use.' });
                }
            }
            updatedUsername = trimmedUsername;
        }

        if (email !== undefined) {
            const trimmedEmail = email.toLowerCase().trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedEmail)) {
                return res.status(400).json({ error: 'Invalid email format.' });
            }
            if (trimmedEmail !== currentUser.email) {
                // Vérifier l'unicité de l'email
                const uniqueCheck = await db.query('SELECT id FROM users WHERE email = $1', [trimmedEmail]);
                if (uniqueCheck.rows.length > 0) {
                    return res.status(409).json({ error: 'email already in use.' });
                }
            }
            updatedEmail = trimmedEmail;
        }

        if (password !== undefined && password !== '') {
            if (password.length < 8) {
                return res.status(400).json({ error: 'password must be at least 8 characters.' });
            }
            updatedPasswordHash = await bcrypt.hash(password, 10);
        }

        // 3. Mettre à jour l'utilisateur en BDD
        const updateRes = await db.query(
            `UPDATE users 
             SET username = $1, email = $2, password_hash = $3
             WHERE id = $4
             RETURNING id, username, email, created_at`,
            [updatedUsername, updatedEmail, updatedPasswordHash, userId]
        );

        const updatedUser = updateRes.rows[0];

        // 4. Régénérer un nouveau token JWT si l'username a changé
        let token = null;
        if (updatedUsername !== currentUser.username) {
            token = jwt.sign(
                { userId: updatedUser.id, username: updatedUser.username },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
        }

        res.status(200).json({
            message: 'Profile updated successfully.',
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
            },
            ...(token && { token })
        });

    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Route pour supprimer le compte utilisateur (RGPD)
app.delete('/api/user/me', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await db.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.status(200).json({ message: 'Account deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user account:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
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
        res.status(500).json({ error: "Erreur lors de l'accumulation des équipes favorites." });
    }
});

// ─── Health check ─────────────────────────
app.get('/', (req, res) => {
    res.send('eSportCal API is running...');
});

// ─── Contact Us (Nodemailer SMTP Proxy) ───
app.post('/api/contact', async (req, res) => {
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

// ─── Matches (PostgreSQL Local Cache - No API limits!) ───
app.get('/api/matches', async (req, res) => { // 👈 3. Optimized route reading directly from cache!
    try {
        console.log('Reading matches from local PostgreSQL cache...');
        
        // Query our local database cache
        const result = await db.query(
            'SELECT * FROM matches ORDER BY scheduled_at ASC'
        );
        
        res.json(result.rows);

    } catch (error) {
        console.error('Error reading matches from DB:', error.stack);
        res.status(500).json({ error: 'Failed to read matches from database' });
    }
});

// ─── Teams (PandaScore Proxy with lazy PostgreSQL Caching) ───
app.get('/api/teams/:id', async (req, res) => {
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
        const response = await axios.get(`https://api.pandascore.co/teams/${teamId}`, {
            headers: { Authorization: `Bearer ${process.env.PANDASCORE_API_KEY}` }
        });

        const team = response.data;

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
});

module.exports = app;