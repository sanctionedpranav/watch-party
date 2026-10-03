/**
 * server.js - entry point
 * -----------------------
 * Connect DB -> create ONE http server -> attach Express + Socket.IO -> listen.
 * REST and WebSockets share the same port, which is exactly what Render expects.
 */
import http from 'http';
import { env } from './shared/config/env.js';
import { connectDB } from './shared/db/connect.js';
import { initSocket } from './shared/socket/index.js';
import logger from './shared/utils/logger.js';
import app from './app.js';

const start = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
      logger.info(`Allowed origins: ${env.CLIENT_URLS.join(', ')}`);
    });

    // Render sends SIGTERM on redeploy -> close connections cleanly
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down');
      server.close(() => process.exit(0));
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

start();
