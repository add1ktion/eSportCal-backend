// backend/dbInit.js
const fs = require('fs');
const path = require('path');
const db = require('./db');

async function initDatabase() {
    console.log('⚡ Starting database initialization...');
    try {
        // 1. Run the base schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            console.log('🔄 Executing schema.sql to ensure tables exist...');
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            await db.query(schemaSql);
            console.log('✅ Base schema setup completed.');
        } else {
            console.warn('⚠️ schema.sql not found at:', schemaPath);
        }

        // 2. Check if the email verification columns already exist
        const checkColumnResult = await db.query(
            `SELECT column_name 
             FROM information_schema.columns 
             WHERE table_name = 'users' 
               AND column_name = 'is_verified'`
        );

        const columnExists = checkColumnResult.rows.length > 0;

        if (!columnExists) {
            console.log('🔄 Column "is_verified" not detected. Running email verification migration...');
            const migrationPath = path.join(__dirname, 'migrations', 'add_email_verification.sql');
            
            if (fs.existsSync(migrationPath)) {
                const migrationSql = fs.readFileSync(migrationPath, 'utf8');
                await db.query(migrationSql);
                console.log('✅ Migration add_email_verification.sql executed.');

                // Verify all existing users so they aren't locked out of their accounts
                console.log('🔄 Auto-verifying existing users...');
                const updateRes = await db.query('UPDATE users SET is_verified = TRUE');
                console.log(`✅ Auto-verified ${updateRes.rowCount} existing users successfully.`);
            } else {
                console.error('❌ Migration file not found at:', migrationPath);
            }
        } else {
            console.log('ℹ️ Column "is_verified" already exists. Skipping migration.');
        }

        console.log('🎉 Database initialization completed successfully!');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

module.exports = { initDatabase };
