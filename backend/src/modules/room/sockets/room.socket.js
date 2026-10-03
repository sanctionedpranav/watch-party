/**
 * room.socket.js - all real-time events for a watch party
 * =======================================================
 *
 * FLOW (example: host presses pause)
 *   1. Client emits  'pause'
 *   2. `guard()` checks: is this socket in a room? does its ROLE allow it?
 *   3. room.pause() updates the in-memory state
 *   4. Server broadcasts 'sync_state' to EVERYONE in the room (sender included)
 *   5. Every client applies the same state to its YouTube player
 *
 * The server is the single source of truth. Clients never sync with each
 * other directly - they only render what the server says.
 *
 * registerRoomHandlers() runs once PER CONNECTED SOCKET (see shared/socket).
 */
import { roomManager } from '../core/roomManager.js';
import * as roomService from '../services/room.service.js';
import { EVENTS, PLAYBACK_ACTIONS } from '../../../shared/constants/socketEvents.js';
import { ROLES, ASSIGNABLE_ROLES, PERMISSIONS, hasPermission } from '../../../shared/constants/roles.js';
import { extractVideoId } from '../../../shared/utils/youtube.js';
import logger from '../../../shared/utils/logger.js';

const MAX_CHAT_LENGTH = 500;

export const registerRoomHandlers = (io, socket) => {
  // Set by the auth middleware from the JWT: { id, username }
  const user = socket.data.user;

  // ------------------------------------------------------------- helpers

  /** Send an error only to this user (shown as a toast in the UI) */
  const sendError = (message) => socket.emit(EVENTS.ERROR_MESSAGE, { message });

  /** The room this socket is in + this user's Participant object */
  const getContext = () => {
    const room = roomManager.get(socket.data.roomCode);
    return { room, me: room?.getParticipant(user.id) };
  };

  /** Send an event to host + moderators only */
  const emitToApprovers = (room, event, data) => {
    room.getApprovers().forEach((p) => io.to(p.socketId).emit(event, data));
  };

  /**
   * guard(permission, handler)
   * Wraps a handler with the 3 checks every event needs:
   *   - the user must be inside a room
   *   - the user's role must have `permission` (RBAC enforced on the SERVER)
   *   - any thrown error becomes an error_message instead of crashing
   */
  const guard = (permission, handler) => async (payload = {}) => {
    try {
      const { room, me } = getContext();
      if (!room || !me) return sendError('You are not in a room');
      if (permission && !hasPermission(me.role, permission)) {
        logger.warn(`Blocked: ${me.username} (${me.role}) lacks ${permission}`);
        return sendError('You do not have permission to do that');
      }
      return await handler({ room, me, payload });
    } catch (err) {
      logger.error(err);
      return sendError(err.message || 'Something went wrong');
    }
  };

  /** Validates input and returns a clean payload for a playback action */
  const normalizeAction = (type, payload = {}) => {
    if (type === EVENTS.SEEK) {
      const time = Number(payload.time);
      if (!Number.isFinite(time) || time < 0) throw new Error('Invalid seek time');
      return { time };
    }
    if (type === EVENTS.CHANGE_VIDEO) {
      const videoId = extractVideoId(payload.videoId);
      if (!videoId) throw new Error('That does not look like a YouTube link');
      return { videoId };
    }
    return {};
  };

  /**
   * Applies play / pause / seek / change_video to the room and broadcasts
   * the new state. Used by direct controls AND by approved requests.
   */
  const runPlaybackAction = (room, type, payload, byUsername) => {
    const clean = normalizeAction(type, payload);

    if (type === EVENTS.PLAY) room.play();
    if (type === EVENTS.PAUSE) room.pause();
    if (type === EVENTS.SEEK) room.seek(clean.time);
    if (type === EVENTS.CHANGE_VIDEO) {
      room.changeVideo(clean.videoId);
      // Persist so the room re-opens on the same video. Fire-and-forget:
      // the live sync must not wait for the database.
      roomService.updateRoomVideo(room.code, clean.videoId).catch((err) => logger.error(err));
    }

    // `action` + `by` let the UI show "alice paused the video"
    io.to(room.code).emit(EVENTS.SYNC_STATE, { ...room.getSyncState(), action: type, by: byUsername });
  };

  /** Leaves the current room (on leave_room, on disconnect, or before joining another) */
  const leaveCurrentRoom = () => {
    const code = socket.data.roomCode;
    if (!code) return;
    const { room, me } = getContext();

    socket.leave(code);
    socket.data.roomCode = null;

    // If the same user has a newer tab open, that tab owns the participant entry
    if (!room || !me || me.socketId !== socket.id) return;

    room.leave(user.id);
    io.to(code).emit(EVENTS.USER_LEFT, {
      userId: user.id,
      username: user.username,
      participants: room.getParticipantsList(),
    });
    logger.info(`${user.username} left room ${code}`);

    if (room.isEmpty()) roomManager.remove(code);
  };

  // ------------------------------------------------------------- join / leave

  socket.on(EVENTS.JOIN_ROOM, async (payload = {}) => {
    try {
      const code = String(payload.roomCode || payload.roomId || '').trim().toUpperCase();
      if (!code) {
        return socket.emit(EVENTS.JOIN_ERROR, { message: 'Room code or roomId is required' });
      }

      if (payload.username && (!user.username || user.username.startsWith('Guest_') || user.isGuest)) {
        user.username = String(payload.username).trim();
      }

      const room = await roomManager.getOrLoad(code, user); // loads from DB, or creates in memory for test runners

      if (room.isRemoved(user.id)) {
        return socket.emit(EVENTS.JOIN_ERROR, { message: 'The host removed you from this room' });
      }

      if (socket.data.roomCode && socket.data.roomCode !== code) leaveCurrentRoom();

      const me = room.addParticipant({ userId: user.id, username: user.username, socketId: socket.id });
      socket.join(code); // Socket.IO "room" = broadcast channel
      socket.data.roomCode = code;
      const participants = room.getParticipantsList();

      // 1) Full snapshot ONLY for the person joining
      socket.emit(EVENTS.ROOM_JOINED, {
        room: room.getInfo(),
        me: me.toJSON(),
        participants,
        state: room.getSyncState(),
        pendingRequests: hasPermission(me.role, PERMISSIONS.APPROVE_REQUESTS) ? room.getPendingRequests() : [],
      });

      // 2) Tell everyone else someone arrived
      socket.to(code).emit(EVENTS.USER_JOINED, {
        userId: me.userId,
        username: me.username,
        role: me.role,
        participants,
      });

      logger.info(`${user.username} joined room ${code} as ${me.role}`);
    } catch (err) {
      socket.emit(EVENTS.JOIN_ERROR, { message: err.message || 'Could not join room' });
    }
  });

  socket.on(EVENTS.LEAVE_ROOM, () => leaveCurrentRoom());
  socket.on('disconnect', leaveCurrentRoom); // closing the tab = leaving

  // ------------------------------------------------------------- playback (host + moderator)

  // One handler for play, pause, seek and change_video
  PLAYBACK_ACTIONS.forEach((type) => {
    socket.on(
      type,
      guard(PERMISSIONS.CONTROL_PLAYBACK, ({ room, me, payload }) =>
        runPlaybackAction(room, type, payload, me.username)
      )
    );
  });

  // ------------------------------------------------------------- requests (participant -> host/mod)

  socket.on(
    EVENTS.REQUEST_ACTION,
    guard(PERMISSIONS.REQUEST_ACTIONS, ({ room, me, payload }) => {
      const { type } = payload;
      if (!PLAYBACK_ACTIONS.includes(type)) return sendError('Unknown request type');

      const request = room.createRequest(me, type, normalizeAction(type, payload.payload));
      emitToApprovers(room, EVENTS.ACTION_REQUESTED, request);
      socket.emit(EVENTS.REQUEST_SENT, { requestId: request.id, type });
      return undefined;
    })
  );

  socket.on(
    EVENTS.RESPOND_REQUEST,
    guard(PERMISSIONS.APPROVE_REQUESTS, ({ room, me, payload }) => {
      const request = room.takeRequest(payload.requestId);
      if (!request) return sendError('This request was already handled');

      if (payload.approve) {
        runPlaybackAction(room, request.type, request.payload, `${me.username} (asked by ${request.username})`);
      }

      // Tell the requester the result, and clear the request from every approver's list
      const requester = room.getParticipant(request.userId);
      if (requester) {
        io.to(requester.socketId).emit(EVENTS.REQUEST_RESOLVED, {
          requestId: request.id,
          type: request.type,
          approved: Boolean(payload.approve),
          by: me.username,
        });
      }
      emitToApprovers(room, EVENTS.REQUEST_CLOSED, { requestId: request.id });
      return undefined;
    })
  );

  // ------------------------------------------------------------- host-only management

  socket.on(
    EVENTS.ASSIGN_ROLE,
    guard(PERMISSIONS.MANAGE_ROLES, ({ room, me, payload }) => {
      const { userId, role } = payload;
      if (!ASSIGNABLE_ROLES.includes(role)) return sendError('Invalid role');
      if (userId === me.userId) return sendError('You cannot change your own role');

      const target = room.getParticipant(userId);
      if (!target) return sendError('User is not in the room');

      room.assignRole(userId, role);
      io.to(room.code).emit(EVENTS.ROLE_ASSIGNED, {
        userId,
        username: target.username,
        role,
        participants: room.getParticipantsList(),
      });

      // A new moderator needs to see requests that are already waiting
      if (hasPermission(role, PERMISSIONS.APPROVE_REQUESTS)) {
        io.to(target.socketId).emit(EVENTS.PENDING_REQUESTS, room.getPendingRequests());
      }
      return undefined;
    })
  );

  socket.on(
    EVENTS.REMOVE_PARTICIPANT,
    guard(PERMISSIONS.REMOVE_PARTICIPANT, ({ room, me, payload }) => {
      const target = room.getParticipant(payload.userId);
      if (!target) return sendError('User is not in the room');
      if (target.userId === me.userId) return sendError('You cannot remove yourself');

      room.removeParticipant(target.userId);

      // Notify the kicked user, then pull their socket out of the broadcast channel
      io.to(target.socketId).emit(EVENTS.REMOVED_FROM_ROOM, { by: me.username });
      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.leave(room.code);
        targetSocket.data.roomCode = null;
      }

      io.to(room.code).emit(EVENTS.PARTICIPANT_REMOVED, {
        userId: target.userId,
        username: target.username,
        participants: room.getParticipantsList(),
      });
      return undefined;
    })
  );

  socket.on(
    EVENTS.TRANSFER_HOST,
    guard(PERMISSIONS.TRANSFER_HOST, ({ room, me, payload }) => {
      if (payload.userId === me.userId) return sendError('You are already the host');
      if (!room.getParticipant(payload.userId)) return sendError('User is not in the room');

      const newHost = room.transferHost(payload.userId);
      roomService.updateRoomHost(room.code, newHost.userId).catch((err) => logger.error(err));

      const updatedParticipants = room.getParticipantsList();

      io.to(room.code).emit(EVENTS.HOST_TRANSFERRED, {
        userId: newHost.userId,
        username: newHost.username,
        previousHost: me.username,
        participants: updatedParticipants,
      });

      // Also emit role_assigned for both participants so all UIs update instantly
      io.to(room.code).emit(EVENTS.ROLE_ASSIGNED, {
        userId: newHost.userId,
        username: newHost.username,
        role: ROLES.HOST,
        participants: updatedParticipants,
      });

      io.to(room.code).emit(EVENTS.ROLE_ASSIGNED, {
        userId: me.userId,
        username: me.username,
        role: ROLES.MODERATOR,
        participants: updatedParticipants,
      });

      // Both are now approvers (old host = moderator) -> give the new host the queue
      io.to(newHost.socketId).emit(EVENTS.PENDING_REQUESTS, room.getPendingRequests());
      return undefined;
    })
  );

  // ------------------------------------------------------------- chat (everyone)

  socket.on(
    EVENTS.CHAT_MESSAGE,
    guard(null, ({ room, me, payload }) => {
      const text = String(payload.text || '').trim().slice(0, MAX_CHAT_LENGTH);
      if (!text) return undefined;

      io.to(room.code).emit(EVENTS.CHAT_MESSAGE, {
        id: `${Date.now()}-${me.userId}`,
        userId: me.userId,
        username: me.username,
        role: me.role,
        text,
        sentAt: Date.now(),
      });
      return undefined;
    })
  );

  // ------------------------------------------------------------- emoji reactions (everyone)

  socket.on(
    EVENTS.EMOJI_REACTION,
    guard(null, ({ room, me, payload }) => {
      const emoji = String(payload.emoji || '').slice(0, 10);
      if (!emoji) return undefined;

      io.to(room.code).emit(EVENTS.EMOJI_REACTION, {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: me.userId,
        username: me.username,
        role: me.role,
        emoji,
        sentAt: Date.now(),
      });
      return undefined;
    })
  );
};
