// backend/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

// Handle unexpected errors on idle clients in the pool (like ECONNRESET from pooler timeouts)
pool.on('error', (err, client) => {
    console.error('⚠️ Unexpected error on idle client in PostgreSQL pool:', err.message);
});

if (process.env.NODE_ENV !== 'test') {
    // Run a simple query to verify connection (automatically checks out and releases client)
    pool.query('SELECT NOW()')
        .then(async () => {
            console.log('📦 Connected to PostgreSQL successfully!');
            try {
                const { initDatabase } = require('./dbInit');
                await initDatabase();
            } catch (err) {
                console.error('❌ Database initialization error during startup:', err);
            }
        })
        .catch(err => console.error('❌ Database connection error:', err.stack));
}

module.exports = {
    query: (text, params) => pool.query(text, params),
};