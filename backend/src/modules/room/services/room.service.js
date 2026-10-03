/**
 * Room service - database operations for rooms.
 * Used by the REST controller AND by the socket layer (to load/persist rooms).
 */
import crypto from 'crypto';
import mongoose from 'mongoose';
import { RoomModel } from '../models/room.model.js';
import { ApiError } from '../../../shared/utils/ApiError.js';
import { extractVideoId } from '../../../shared/utils/youtube.js';

// In-memory store fallback when MongoDB is not connected
const memoryRooms = new Map();

// No 0/O or 1/I -> codes are easy to read out loud
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateRoomCode = (length = 6) =>
  Array.from(crypto.randomBytes(length), (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');

const isMongoConnected = () => mongoose.connection.readyState === 1;

/** Converts a Mongo document or memory object into the JSON we send to clients. */
export const toPublicRoom = (room) => ({
  code: room.code,
  name: room.name,
  videoId: room.videoId,
  // host may be populated ({ _id, username }) or just an ObjectId or string
  hostId: (room.host?._id ?? room.host).toString(),
  hostName: room.host?.username || room.hostName || 'Host',
  createdAt: room.createdAt || new Date(),
});

export const createRoom = async ({ name, videoUrl, hostId }) => {
  if (!name?.trim()) throw new ApiError(400, 'Room name is required');

  let videoId = '';
  if (videoUrl?.trim()) {
    videoId = extractVideoId(videoUrl);
    if (!videoId) throw new ApiError(400, 'That does not look like a YouTube link');
  }

  // Generate codes until we find an unused one (collisions are very rare)
  let code;
  do {
    code = generateRoomCode();
  } while (isMongoConnected() ? await RoomModel.exists({ code }) : memoryRooms.has(code));

  if (isMongoConnected()) {
    const room = await RoomModel.create({ code, name: name.trim(), host: hostId, videoId });
    return toPublicRoom(room);
  }

  // In-memory fallback
  const memRoom = {
    code,
    name: name.trim(),
    host: hostId,
    videoId,
    createdAt: new Date(),
  };
  memoryRooms.set(code, memRoom);
  return toPublicRoom(memRoom);
};

export const getRoomByCode = async (code) => {
  const upperCode = String(code).toUpperCase();
  if (isMongoConnected()) {
    const room = await RoomModel.findOne({ code: upperCode }).populate('host', 'username');
    if (!room) throw new ApiError(404, 'Room not found. Check the code and try again');
    return room;
  }

  const memRoom = memoryRooms.get(upperCode);
  if (!memRoom) throw new ApiError(404, 'Room not found. Check the code and try again');
  return memRoom;
};

export const getRoomsByHost = async (hostId) => {
  if (isMongoConnected()) {
    const rooms = await RoomModel.find({ host: hostId }).sort({ updatedAt: -1 }).limit(10);
    return rooms.map(toPublicRoom);
  }
  return [...memoryRooms.values()].filter((r) => r.host === hostId).map(toPublicRoom);
};

// Called from the socket layer so the room remembers its video/host after restarts
export const updateRoomVideo = (code, videoId) => {
  const upperCode = String(code).toUpperCase();
  if (isMongoConnected()) return RoomModel.updateOne({ code: upperCode }, { videoId });
  const mem = memoryRooms.get(upperCode);
  if (mem) mem.videoId = videoId;
};

export const updateRoomHost = (code, hostId) => {
  const upperCode = String(code).toUpperCase();
  if (isMongoConnected()) return RoomModel.updateOne({ code: upperCode }, { host: hostId });
  const mem = memoryRooms.get(upperCode);
  if (mem) mem.host = hostId;
};
