/**
 * app.js - the Express application (REST API)
 * Kept separate from server.js so the app can be imported in tests without
 * starting a server.
 */
import express from 'express';
import cors from 'cors';
import { corsOptions } from './shared/config/cors.js';
import { requestLogger } from './shared/middlewares/requestLogger.middleware.js';
import { notFound, errorHandler } from './shared/middlewares/error.middleware.js';
import authRouter from './modules/auth/routers/auth.router.js';
import roomRouter from './modules/room/routers/room.router.js';
import { roomManager } from './modules/room/core/roomManager.js';

const app = express();

// ---- Global middlewares ----
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' })); // parse JSON bodies, reject huge payloads
app.use(requestLogger);

// ---- Health check (Render pings this; also wakes up a sleeping free instance) ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()), ...roomManager.stats() });
});

// ---- Feature modules ----
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomRouter);

// ---- Errors (must be LAST) ----
app.use(notFound);
app.use(errorHandler);

export default app;
