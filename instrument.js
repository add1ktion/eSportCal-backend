// Import Sentry at the very start of the app
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN, // Will pull from Render/Koyeb environment variables
  tracesSampleRate: 1.0,
});

// Override console logging globally to route through Winston and Grafana Loki
const logger = require('./utils/logger');
console.log = (...args) => logger.info(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
console.warn = (...args) => logger.warn(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
console.error = (...args) => logger.error(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
