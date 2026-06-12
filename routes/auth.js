// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

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

        // 3. Hash du mot de passe (cost factor 10, cohérent avec le seed)
        const password_hash = await bcrypt.hash(password, 10);

        // 4. Insertion en BDD
        const result = await db.query(
            `INSERT INTO users (username, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, username, email, created_at`,
            [username.trim(), email.toLowerCase(), password_hash]
        );

        const newUser = result.rows[0];

        // 5. Génération du JWT
        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            message: 'Account created successfully.',
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
// POST /api/auth/login (Unified Username/Email connection !)
// ─────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { identifier, password } = req.body; // 👈 Accepts the unified 'identifier'

    // 1. Validation des champs
    if (!identifier || !password) {
        return res.status(400).json({ error: 'Username/Email and password are required.' });
    }

    try {
        // 2. Query user by EITHER email OR username (Figma UX standard)
        const result = await db.query(
            'SELECT id, username, email, password_hash FROM users WHERE email = $1 OR username = $2',
            [identifier.toLowerCase(), identifier.trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const user = result.rows[0];

        // 3. Comparer le mot de passe avec le hash
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // 4. Générer le JWT
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
