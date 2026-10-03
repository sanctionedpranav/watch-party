/**
 * WebSocket event names - identical copy of backend/src/shared/constants/socketEvents.js
 */
export const EVENTS = Object.freeze({
  // Client -> Server
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  PLAY: 'play',
  PAUSE: 'pause',
  SEEK: 'seek',
  CHANGE_VIDEO: 'change_video',
  ASSIGN_ROLE: 'assign_role',
  REMOVE_PARTICIPANT: 'remove_participant',
  TRANSFER_HOST: 'transfer_host',
  CHAT_MESSAGE: 'chat_message',
  EMOJI_REACTION: 'emoji_reaction',
  REQUEST_ACTION: 'request_action',
  RESPOND_REQUEST: 'respond_request',

  // Server -> Client
  ROOM_JOINED: 'room_joined',
  JOIN_ERROR: 'join_error',
  SYNC_STATE: 'sync_state',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  ROLE_ASSIGNED: 'role_assigned',
  HOST_TRANSFERRED: 'host_transferred',
  PARTICIPANT_REMOVED: 'participant_removed',
  REMOVED_FROM_ROOM: 'removed_from_room',
  ACTION_REQUESTED: 'action_requested',
  PENDING_REQUESTS: 'pending_requests',
  REQUEST_SENT: 'request_sent',
  REQUEST_RESOLVED: 'request_resolved',
  REQUEST_CLOSED: 'request_closed',
  ERROR_MESSAGE: 'error_message',
});
