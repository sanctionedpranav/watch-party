/**
 * socketEvents.js
 * ---------------
 * Every WebSocket event name in one place (the frontend keeps an identical copy).
 * Constants instead of raw strings prevent silent typos like 'chnage_video'.
 */
export const EVENTS = Object.freeze({
  // ---------- Client -> Server ----------
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  PLAY: 'play',
  PAUSE: 'pause',
  SEEK: 'seek',
  CHANGE_VIDEO: 'change_video',
  ASSIGN_ROLE: 'assign_role',
  REMOVE_PARTICIPANT: 'remove_participant',
  TRANSFER_HOST: 'transfer_host',
  CHAT_MESSAGE: 'chat_message', // (also Server -> Clients)
  EMOJI_REACTION: 'emoji_reaction', // (also Server -> Clients)
  REQUEST_ACTION: 'request_action', // participant asks for play/pause/seek/change
  RESPOND_REQUEST: 'respond_request', // host/mod approves or rejects it

  // ---------- Server -> Client(s) ----------
  ROOM_JOINED: 'room_joined', // full snapshot, only to the user who joined
  JOIN_ERROR: 'join_error',
  SYNC_STATE: 'sync_state', // { videoId, isPlaying, currentTime }
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  ROLE_ASSIGNED: 'role_assigned',
  HOST_TRANSFERRED: 'host_transferred',
  PARTICIPANT_REMOVED: 'participant_removed', // to everyone still in the room
  REMOVED_FROM_ROOM: 'removed_from_room', // only to the kicked user
  ACTION_REQUESTED: 'action_requested', // to host + moderators
  PENDING_REQUESTS: 'pending_requests', // full list (e.g. right after promotion)
  REQUEST_SENT: 'request_sent', // ack to the requester
  REQUEST_RESOLVED: 'request_resolved', // approved/rejected -> requester
  REQUEST_CLOSED: 'request_closed', // remove request from every approver's list
  ERROR_MESSAGE: 'error_message',
});

// Events that change the video state (need CONTROL_PLAYBACK permission)
export const PLAYBACK_ACTIONS = [EVENTS.PLAY, EVENTS.PAUSE, EVENTS.SEEK, EVENTS.CHANGE_VIDEO];
