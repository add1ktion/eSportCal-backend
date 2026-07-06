// Import Sentry at the very start of the app
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN, // Will pull from Render/Koyeb environment variables
  tracesSampleRate: 1.0,
});
