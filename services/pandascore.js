// backend/services/pandascore.js
const axios = require('axios');

/**
 * Fetch team details directly from PandaScore API.
 * @param {string|number} teamId 
 * @returns {Promise<Object>}
 */
async function fetchTeamFromApi(teamId) {
    const response = await axios.get(`https://api.pandascore.co/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${process.env.PANDASCORE_API_KEY}` }
    });
    return response.data;
}

module.exports = {
    fetchTeamFromApi
};
