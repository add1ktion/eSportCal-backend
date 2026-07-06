// backend/controllers/authController.js
const axios = require('axios');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');

// POST /api/auth/register
async function register(req, res) {
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
            try {
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
            } catch (mailErr) {
                console.warn('⚠️ [POST /register] Failed to send verification email (Resend Sandbox limit). Auto-verifying account for demo compatibility:', mailErr.message);
                
                // Force verification status to TRUE in the database to prevent user lockout
                await db.query(
                    `UPDATE users 
                     SET is_verified = TRUE, 
                         verification_token = NULL, 
                         verification_token_expires_at = NULL 
                     WHERE id = $1`, 
                    [newUser.id]
                );

                const token = jwt.sign(
                    { userId: newUser.id, username: newUser.username },
                    process.env.JWT_SECRET,
                    { expiresIn: '7d' }
                );

                return res.status(201).json({
                    message: 'Account created successfully (Auto-verified due to email delivery sandbox limits).',
                    token,
                    user: {
                        id: newUser.id,
                        username: newUser.username,
                        email: newUser.email,
                    }
                });
            }
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
}

// GET /api/auth/verify-email/:token
async function verifyEmail(req, res) {
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

        const clientUrl = process.env.CLIENT_URL || 'http://localhost';

        if (result.rows.length === 0) {
            return res.redirect(`${clientUrl}/?verified=error`);
        }

        const user = result.rows[0];

        // 2. Déjà vérifié ?
        if (user.is_verified) {
            return res.redirect(`${clientUrl}/?verified=already`);
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

        return res.redirect(`${clientUrl}/?verified=true`);

    } catch (err) {
        console.error('❌ [GET /verify-email] Error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}

// POST /api/auth/login
async function login(req, res) {
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
                code: 'EMAIL_NOT_VERIFIED',
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
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    try {
        // Find user by email
        const result = await db.query(
            'SELECT id, username, email FROM users WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (result.rows.length === 0) {
            // Secure response: do not leak if email exists or not, but for testing or typical flows we can return success
            return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
        }

        const user = result.rows[0];

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

        // Update user
        await db.query(
            `UPDATE users 
             SET reset_token = $1, reset_token_expires_at = $2 
             WHERE id = $3`,
            [resetToken, resetExpires, user.id]
        );

        // Send email (skip in test mode to avoid missing credentials error in CI)
        if (process.env.NODE_ENV !== 'test') {
            await sendPasswordResetEmail(user.email, user.username, resetToken);
        }

        return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });

    } catch (err) {
        console.error('❌ [POST /forgot-password] Error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'password must be at least 8 characters.' });
    }

    try {
        // Find user with valid token
        const result = await db.query(
            `SELECT id FROM users 
             WHERE reset_token = $1 
               AND reset_token_expires_at > NOW()`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired password reset token.' });
        }

        const user = result.rows[0];

        // Hash new password
        const passwordHash = await bcrypt.hash(password, 10);

        // Update user
        await db.query(
            `UPDATE users 
             SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL 
             WHERE id = $2`,
            [passwordHash, user.id]
        );

        return res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });

    } catch (err) {
        console.error('❌ [POST /reset-password] Error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}

// GET /api/auth/google/callback
async function googleCallback(req, res) {
    const { code } = req.query;
    if (!code) {
        return res.status(400).send('OAuth authorization code is missing.');
    }

    try {
        // 1. Exchange code for access token
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code'
        });

        const { access_token } = tokenResponse.data;

        // 2. Fetch user information
        const userResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const { email, name } = userResponse.data;
        if (!email) {
            return res.status(400).send('Google account does not provide an email address.');
        }

        // 3. Find or create user in DB
        let userResult = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        let user;

        if (userResult.rows.length === 0) {
            // Generate unique username
            let baseUsername = (name || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '');
            if (baseUsername.length < 3) baseUsername = 'GoogleUser';
            let uniqueUsername = baseUsername;
            let count = 0;
            while (true) {
                const check = await db.query('SELECT id FROM users WHERE username = $1', [uniqueUsername]);
                if (check.rows.length === 0) break;
                count++;
                uniqueUsername = `${baseUsername}${count}`;
            }

            const randomPassword = crypto.randomBytes(16).toString('hex');
            const passwordHash = await bcrypt.hash(randomPassword, 10);

            const insertResult = await db.query(
                `INSERT INTO users (username, email, password_hash, is_verified)
                 VALUES ($1, $2, $3, TRUE)
                 RETURNING *`,
                [uniqueUsername, email.toLowerCase().trim(), passwordHash]
            );
            user = insertResult.rows[0];
        } else {
            user = userResult.rows[0];
        }

        // 4. Generate JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Fetch user favorites
        const favResult = await db.query(
            `SELECT pandascore_team_id FROM user_favorites WHERE user_id = $1 LIMIT 1`,
            [user.id]
        );
        const favoriteTeamId = favResult.rows[0]?.pandascore_team_id || null;

        const userJson = encodeURIComponent(JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email,
            favoriteTeamId
        }));

        const clientUrl = process.env.CLIENT_URL || 'http://localhost';
        return res.redirect(`${clientUrl}/?token=${token}&user=${userJson}`);

    } catch (err) {
        console.error('❌ [Google Callback] Error:', err.message);
        return res.status(500).send('Authentication failed.');
    }
}

// GET /api/auth/twitch/callback
async function twitchCallback(req, res) {
    const { code } = req.query;
    if (!code) {
        return res.status(400).send('OAuth authorization code is missing.');
    }

    try {
        // 1. Exchange code for access token
        const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: process.env.TWITCH_REDIRECT_URI
            }
        });

        const { access_token } = tokenResponse.data;

        // 2. Fetch user information
        const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Client-Id': process.env.TWITCH_CLIENT_ID
            }
        });

        const twitchUser = userResponse.data.data[0];
        if (!twitchUser) {
            return res.status(400).send('Unable to retrieve Twitch profile info.');
        }

        const { email, display_name, login } = twitchUser;
        if (!email) {
            return res.status(400).send('Twitch account does not provide an email address.');
        }

        // 3. Find or create user in DB
        let userResult = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        let user;

        if (userResult.rows.length === 0) {
            // Generate unique username
            let baseUsername = (display_name || login || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '');
            if (baseUsername.length < 3) baseUsername = 'TwitchUser';
            let uniqueUsername = baseUsername;
            let count = 0;
            while (true) {
                const check = await db.query('SELECT id FROM users WHERE username = $1', [uniqueUsername]);
                if (check.rows.length === 0) break;
                count++;
                uniqueUsername = `${baseUsername}${count}`;
            }

            const randomPassword = crypto.randomBytes(16).toString('hex');
            const passwordHash = await bcrypt.hash(randomPassword, 10);

            const insertResult = await db.query(
                `INSERT INTO users (username, email, password_hash, is_verified)
                 VALUES ($1, $2, $3, TRUE)
                 RETURNING *`,
                [uniqueUsername, email.toLowerCase().trim(), passwordHash]
            );
            user = insertResult.rows[0];
        } else {
            user = userResult.rows[0];
        }

        // 4. Generate JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Fetch user favorites
        const favResult = await db.query(
            `SELECT pandascore_team_id FROM user_favorites WHERE user_id = $1 LIMIT 1`,
            [user.id]
        );
        const favoriteTeamId = favResult.rows[0]?.pandascore_team_id || null;

        const userJson = encodeURIComponent(JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email,
            favoriteTeamId
        }));

        const clientUrl = process.env.CLIENT_URL || 'http://localhost';
        return res.redirect(`${clientUrl}/?token=${token}&user=${userJson}`);

    } catch (err) {
        console.error('❌ [Twitch Callback] Error:', err.message);
        return res.status(500).send('Authentication failed.');
    }
}

// GET /api/auth/google
async function googleAuthRedirect(req, res) {
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}&response_type=code&scope=email%20profile`;
    return res.redirect(googleUrl);
}

// GET /api/auth/twitch
async function twitchAuthRedirect(req, res) {
    const twitchUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.TWITCH_REDIRECT_URI)}&response_type=code&scope=user:read:email`;
    return res.redirect(twitchUrl);
}

module.exports = {
    register,
    verifyEmail,
    login,
    forgotPassword,
    resetPassword,
    googleCallback,
    twitchCallback,
    googleAuthRedirect,
    twitchAuthRedirect
};
