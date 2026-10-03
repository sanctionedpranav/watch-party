/**
 * roomManager (singleton)
 * -----------------------
 * Keeps every ACTIVE room in memory:  Map<roomCode, Room>
 * - A room is loaded from MongoDB when the first person joins.
 * - It is removed from memory when the last person leaves
 *   (its code/name/video stay in MongoDB, so it can be re-opened later).
 *
 * Scaling note: memory is per server instance. With multiple instances you
 * would move this state to Redis and use the Socket.IO Redis adapter.
 */
import { Room } from './Room.js';
import * as roomService from '../services/room.service.js';
import logger from '../../../shared/utils/logger.js';

const rooms = new Map(); // code -> Room
const loading = new Map(); // code -> Promise<Room> (avoids double-loading)

export const roomManager = {
  get(code) {
    return rooms.get(code);
  },

  async getOrLoad(code, fallbackCreator = null) {
    if (rooms.has(code)) return rooms.get(code);

    // If two users join at the same moment, both wait for the same DB query
    if (!loading.has(code)) {
      const promise = roomService
        .getRoomByCode(code)
        .then((doc) => {
          const room = new Room({
            code: doc.code,
            name: doc.name,
            hostId: (doc.host?._id ?? doc.host).toString(),
            videoId: doc.videoId,
          });
          rooms.set(code, room);
          logger.info(`Room ${code} loaded into memory`);
          return room;
        })
        .catch((err) => {
          if (fallbackCreator) {
            const room = new Room({
              code,
              name: `${fallbackCreator.username || 'Watch Party'}'s Room`,
              hostId: fallbackCreator.id,
              videoId: '',
            });
            rooms.set(code, room);
            logger.info(`Room ${code} created in-memory for ${fallbackCreator.username}`);
            return room;
          }
          throw err;
        })
        .finally(() => loading.delete(code));
      loading.set(code, promise);
    }
    return loading.get(code);
  },

  remove(code) {
    rooms.delete(code);
    logger.info(`Room ${code} is empty - removed from memory`);
  },

  // Handy for a health/metrics endpoint
  stats() {
    let users = 0;
    rooms.forEach((room) => { users += room.participants.size; });
    return { activeRooms: rooms.size, connectedUsers: users };
  },
};
