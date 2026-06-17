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

if (process.env.NODE_ENV !== 'test') {
    pool.connect()
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