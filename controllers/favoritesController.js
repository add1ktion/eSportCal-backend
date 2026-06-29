// backend/controllers/favoritesController.js
const db = require('../db');

// POST /api/user/favorites
async function addFavoriteTeam(req, res) {
    const { pandascore_team_id } = req.body;
    const userId = req.user.userId;

    try {
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
}

// DELETE /api/user/favorites/:pandascore_team_id
async function removeFavoriteTeam(req, res) {
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
}

// GET /api/user/favorites
async function getUserFavorites(req, res) {
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
}

module.exports = {
    addFavoriteTeam,
    removeFavoriteTeam,
    getUserFavorites
};
