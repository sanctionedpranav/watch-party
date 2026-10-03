/**
 * Room controller (REST)
 * REST is used for things that are request/response by nature (create, look up).
 * Everything LIVE (sync, roles, chat) happens over WebSockets - see sockets/.
 */
import * as roomService from '../services/room.service.js';
import { asyncHandler } from '../../../shared/utils/asyncHandler.js';

// POST /api/rooms   body: { name, videoUrl? }
export const createRoom = asyncHandler(async (req, res) => {
  const room = await roomService.createRoom({ ...req.body, hostId: req.user.id });
  res.status(201).json({ room });
});

// GET /api/rooms/mine  -> rooms I created (for the home page)
export const getMyRooms = asyncHandler(async (req, res) => {
  const rooms = await roomService.getRoomsByHost(req.user.id);
  res.json({ rooms });
});

// GET /api/rooms/:code -> check a room exists before joining
export const getRoom = asyncHandler(async (req, res) => {
  const room = await roomService.getRoomByCode(req.params.code);
  res.json({ room: roomService.toPublicRoom(room) });
});
