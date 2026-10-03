/**
 * cors.js
 * -------
 * One CORS config shared by Express (REST) and Socket.IO (WebSockets).
 * Frontend (Vercel) and backend (Render) live on different domains,
 * so the backend must explicitly allow the frontend's origin.
 */
import { env } from './env.js';

export const corsOptions = {
  origin(origin, callback) {
    // `origin` is undefined for curl, Postman, server-to-server and Render health checks.
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, '');

    // Allow wildcard or development mode
    if (env.CLIENT_URLS.includes('*') || !env.IS_PROD) {
      return callback(null, true);
    }

    // Automatically allow any Vercel deployment / preview domain (*.vercel.app)
    try {
      const hostname = new URL(cleanOrigin).hostname;
      if (hostname === 'localhost' || hostname.endsWith('.vercel.app')) {
        return callback(null, true);
      }
    } catch {
      // ignore URL parsing error
    }

    if (env.CLIENT_URLS.some((allowed) => allowed === cleanOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};
