/**
 * Room model (persistent part of a room)
 * --------------------------------------
 * MongoDB stores what must survive a server restart: code, name, host, video.
 * Fast-changing LIVE state (who is online, play/pause, current time) lives in
 * memory inside the Room class (core/Room.js) - writing that to the DB on every
 * seek would be slow and unnecessary.
 */
import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true }, // e.g. "K7P2QX"
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      maxlength: [60, 'Room name must be at most 60 characters'],
    },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    videoId: { type: String, default: '' }, // last video played in the room
  },
  { timestamps: true }
);

export const RoomModel = mongoose.model('Room', roomSchema);
