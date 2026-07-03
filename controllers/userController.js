// backend/controllers/userController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// GET /api/user/me
async function getUserProfile(req, res) {
    res.json({ user: req.user });
}

// PUT /api/user/me
async function updateUserProfile(req, res) {
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
            const { currentPassword } = req.body;
            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password is required to change password.' });
            }
            const isMatch = await bcrypt.compare(currentPassword, currentUser.password_hash);
            if (!isMatch) {
                return res.status(401).json({ error: 'Incorrect current password.' });
            }
            if (password.length < 8) {
                return res.status(400).json({ error: 'New password must be at least 8 characters.' });
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
}

// DELETE /api/user/me
async function deleteUserProfile(req, res) {
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
}

module.exports = {
    getUserProfile,
    updateUserProfile,
    deleteUserProfile
};
