/**
 * createSocket - opens a Socket.IO connection authenticated with our JWT.
 * The backend's io.use() middleware reads `auth.token` during the handshake.
 */
import { io } from 'socket.io-client';
import { API_URL } from '../constants/config';

export const createSocket = (token) => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && API_URL.includes('localhost')) {
    console.error(
      `🚨 [WatchParty Config Error] Frontend is deployed at ${window.location.origin}, but API_URL is pointing to ${API_URL}.\n` +
      `➡️ To fix: Go to Vercel -> Your Project -> Settings -> Environment Variables -> Add VITE_API_URL with your Render backend URL (e.g. https://your-app.onrender.com) and REDEPLOY.`
    );
  }

  return io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling'], // try WebSocket first, fall back to long-polling
    reconnectionAttempts: 10,
  });
};
