/**
 * logger.js (Winston)
 * -------------------
 * Why not console.log? Winston gives us log LEVELS (error > warn > info > debug),
 * timestamps, and different formats per environment:
 *   - development: colourful, human-readable one-liners
 *   - production : JSON lines (Render's log viewer can search/filter them)
 *
 * Note: we read process.env directly here (not env.js) so the logger can be
 * used even while the config itself is loading.
 */
import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;
const isProd = process.env.NODE_ENV === 'production';

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }), // print stack traces for Error objects
  printf(({ level, message, timestamp: time, stack }) => `${time} ${level}: ${stack || message}`)
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  format: isProd ? prodFormat : devFormat,
  // Render's disk is ephemeral, so we log to stdout only (Render captures it).
  transports: [new winston.transports.Console()],
});

export default logger;
