// backend/config.js
// This file validates that all required environment variables are defined on startup.
// Prevents silent crashes and config issues in production.

const requiredEnvVariables = [
    'PORT',
    'PANDASCORE_API_KEY',
    'DB_USER',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'JWT_SECRET'
];

const missingVariables = [];

// Check each required variable in process.env
requiredEnvVariables.forEach((variable) => {
    if (!process.env[variable] || process.env[variable].trim() === '') {
        missingVariables.push(variable);
    }
});

// If any variables are missing, print a highly visible fatal error and crash the server
if (missingVariables.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', '==================================================');
    console.error('\x1b[31m%s\x1b[0m', '🚨 [FATAL CONFIG ERROR] Server cannot start!');
    console.error('\x1b[31m%s\x1b[0m', '==================================================');
    console.error('\x1b[31m%s\x1b[0m', 'The following required .env variables are missing or empty:');
    
    missingVariables.forEach((variable) => {
        console.error('\x1b[33m%s\x1b[0m', `  - ${variable}`); // Prints missing keys in yellow
    });
    
    console.error('\x1b[31m%s\x1b[0m', '==================================================');
    console.error('\x1b[31m%s\x1b[0m', 'Please check your local .env file or copy .env.example');
    console.error('\x1b[31m%s\x1b[0m', '==================================================');
    
    process.exit(1); // Exits the Node process with a failure status (DevOps Standard)
}

module.exports = {};