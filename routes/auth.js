// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto'); // natif Node.js, pas d'install
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendVerificationEmail } = require('../utils/mailer');

const router = express.Router();

// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // 1. Validation des champs
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'username, email and password are required.' });
    }

    if (typeof username !== 'string' || username.trim().length < 3) {
        return res.status(400).json({ error: 'username must be at least 3 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'password must be at least 8 characters.' });
    }

    try {
        // 2. Vérifier unicité email + username
        const existing = await db.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email.toLowerCase(), username.trim()]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'email or username already in use.' });
        }

        // 3. Hash du mot de passe
        const password_hash = await bcrypt.hash(password, 10);

        // 4. Génération du token de vérification (64 hex chars, URL-safe)
        const verification_token = crypto.randomBytes(32).toString('hex');
        const verification_token_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

        // 5. Insertion en BDD (compte vérifié par défaut en dev/test pour simplifier les tests locaux)
        const isVerifiedDefault = process.env.NODE_ENV === 'production' ? false : true;
        const result = await db.query(
            `INSERT INTO users (username, email, password_hash, is_verified, verification_token, verification_token_expires_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, username, email, created_at`,
            [username.trim(), email.toLowerCase(), password_hash, isVerifiedDefault, verification_token, verification_token_expires_at]
        );

        const newUser = result.rows[0];

        // 6. Envoi de l'email de vérification (uniquement si le compte n'est pas déjà vérifié)
        if (!isVerifiedDefault) {
            await sendVerificationEmail(newUser.email, newUser.username, verification_token);
            
            // On retourne un message sans JWT — le compte doit être vérifié d'abord
            return res.status(201).json({
                message: 'Account created successfully. Please check your email to verify your account.',
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                }
            });
        }

        // 7. Si déjà vérifié (dev/test), on génère directement le JWT pour connecter l'utilisateur immédiatement
        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            message: 'Account created successfully and auto-verified.',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
            }
        });

    } catch (err) {
        console.error('❌ [POST /register] Error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

// ─────────────────────────────────────────
// GET /api/auth/verify-email/:token
// ─────────────────────────────────────────
router.get('/verify-email/:token', async (req, res) => {
    const { token } = req.params;

    try {
        // 1. Chercher un user avec ce token non expiré
        const result = await db.query(
            `SELECT id, username, is_verified
             FROM users
             WHERE verification_token = $1
               AND verification_token_expires_at > NOW()`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired verification link.' });
        }

        const user = result.rows[0];

        // 2. Déjà vérifié ?
        if (user.is_verified) {
            return res.status(200).json({ message: 'Email already verified. You can log in.' });
        }

        // 3. Activer le compte + supprimer le token
        await db.query(
            `UPDATE users
             SET is_verified = TRUE,
                 verification_token = NULL,
                 verification_token_expires_at = NULL
             WHERE id = $1`,
            [user.id]
        );

        // 4. Rediriger vers le frontend (à adapter selon ton URL)
        // Option A : redirection directe
        // return res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);

        // Option B : réponse JSON (utile si tu gères la redirect côté React)
        return res.status(200).json({
            message: 'Email verified successfully. You can now log in.',
        });

    } catch (err) {
        console.error('❌ [GET /verify-email] Error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { identifier, password } = req.body;

    // 1. Validation des champs
    if (!identifier || !password) {
        return res.status(400).json({ error: 'Username/Email and password are required.' });
    }

    try {
        // 2. Query user by email OR username
        const result = await db.query(
            'SELECT id, username, email, password_hash, is_verified FROM users WHERE email = $1 OR username = $2',
            [identifier.toLowerCase(), identifier.trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const user = result.rows[0];

        // 3. Comparer le mot de passe
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // 4. Bloquer si email non vérifié
        if (!user.is_verified) {
            return res.status(403).json({
                error: 'Please verify your email before logging in.',
                code: 'EMAIL_NOT_VERIFIED', // utile pour afficher un message spécifique côté React
            });
        }

        // 5. Générer le JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            }
        });

    } catch (err) {
        console.error('❌ [POST /login] Error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
