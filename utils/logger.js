const winston = require('winston');
const LokiTransport = require('winston-loki');

const transports = [
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    })
];

// If Grafana Loki URL is provided, push logs to the cloud logger
if (process.env.GRAFANA_LOKI_URL) {
    transports.push(new LokiTransport({
        host: process.env.GRAFANA_LOKI_URL,
        basicAuth: process.env.GRAFANA_LOKI_USER && process.env.GRAFANA_LOKI_PASSWORD 
            ? `${process.env.GRAFANA_LOKI_USER}:${process.env.GRAFANA_LOKI_PASSWORD}`
            : undefined,
        labels: { service_name: 'esportcal-backend', app: 'esportcal-backend', env: process.env.NODE_ENV || 'development' },
        json: true,
        batching: false,
        replaceTimestamp: true,
        onConnectionError: (err) => process.stderr.write('Loki Connection Error: ' + err.message + '\n')
    }));
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports
});

// Handle internal transport errors (like Loki auth issues) to prevent silent failures
logger.on('error', (err) => {
    process.stderr.write('Winston Logger Transport Error: ' + err.message + '\n');
});

module.exports = logger;
