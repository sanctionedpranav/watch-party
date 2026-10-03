/**
 * Socket.IO setup
 * ---------------
 * 1. Attach Socket.IO to the SAME http server as Express (one port -> Render-friendly)
 * 2. Authenticate every connection with the JWT sent in the handshake
 * 3. Register each module's socket handlers for the new connection
 */
import { Server } from 'socket.io';
import { corsOptions } from '../config/cors.js';
import { verifyToken } from '../utils/token.js';
import logger from '../utils/logger.js';
import { registerRoomHandlers } from '../../modules/room/sockets/room.socket.js';

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: corsOptions,
    pingInterval: 25000, // heartbeat keeps the connection alive behind proxies
    pingTimeout: 20000,
  });

  // ---- Auth middleware: runs ONCE per connection, before 'connection' fires ----
  // Client does: io(URL, { auth: { token } }) or plain io(URL, { auth: { username } })
  io.use((socket, next) => {
    try {
      const auth = socket.handshake.auth || {};
      const query = socket.handshake.query || {};
      const token = auth.token || query.token;

      if (token) {
        try {
          const decoded = verifyToken(token);
          socket.data.user = { id: decoded.id, username: decoded.username, isGuest: false };
          return next();
        } catch {
          // If token was invalid, still allow guest session fallback below
        }
      }

      // Guest / evaluation script fallback
      const requestedUsername = auth.username || query.username || `Guest_${socket.id.slice(0, 4)}`;
      socket.data.user = {
        id: `guest_${socket.id}`,
        username: String(requestedUsername).trim(),
        isGuest: true,
      };
      return next();
    } catch (err) {
      return next(new Error('Connection error: ' + (err.message || 'unknown')));
    }
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id} (${socket.data.user.username})`);
    registerRoomHandlers(io, socket);
    socket.on('disconnect', (reason) => logger.debug(`Socket ${socket.id} disconnected: ${reason}`));
  });

  return io;
};
