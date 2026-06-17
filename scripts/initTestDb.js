// backend/scripts/initTestDb.js
// Script to programmatically initialize the test database in CI pipelines

const { initDatabase } = require('../dbInit');

async function run() {
    try {
        console.log('🧪 PROGRAMMATIC DB INITIALIZATION FOR TESTING...');
        await initDatabase();
        console.log('🧪 Programmatic DB initialization completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Programmatic DB initialization failed:', err);
        process.exit(1);
    }
}

run();
