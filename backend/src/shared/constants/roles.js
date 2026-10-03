/**
 * roles.js
 * --------
 * Single source of truth for Role-Based Access Control (RBAC).
 *
 * Instead of writing `if (role === 'host' || role === 'moderator')` everywhere,
 * we map each ROLE -> list of PERMISSIONS and ask `hasPermission(role, permission)`.
 * Adding a new role later = editing only this file.
 */

export const ROLES = Object.freeze({
  HOST: 'host', // room creator, full control
  MODERATOR: 'moderator', // controls playback + approves requests
  PARTICIPANT: 'participant', // watches, chats and can REQUEST changes
  VIEWER: 'viewer', // watches + chats only
});

// Roles the host can hand out (the host role itself is *transferred*, not assigned)
export const ASSIGNABLE_ROLES = [ROLES.MODERATOR, ROLES.PARTICIPANT, ROLES.VIEWER];

export const PERMISSIONS = Object.freeze({
  CONTROL_PLAYBACK: 'control_playback', // play / pause / seek / change video
  APPROVE_REQUESTS: 'approve_requests', // approve a participant's request
  REQUEST_ACTIONS: 'request_actions', // ask host/mod to do a playback action
  MANAGE_ROLES: 'manage_roles',
  REMOVE_PARTICIPANT: 'remove_participant',
  TRANSFER_HOST: 'transfer_host',
});

const ROLE_PERMISSIONS = {
  [ROLES.HOST]: [
    PERMISSIONS.CONTROL_PLAYBACK,
    PERMISSIONS.APPROVE_REQUESTS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.REMOVE_PARTICIPANT,
    PERMISSIONS.TRANSFER_HOST,
  ],
  [ROLES.MODERATOR]: [PERMISSIONS.CONTROL_PLAYBACK, PERMISSIONS.APPROVE_REQUESTS],
  [ROLES.PARTICIPANT]: [PERMISSIONS.REQUEST_ACTIONS],
  [ROLES.VIEWER]: [],
};

/** true if `role` is allowed to perform `permission` */
export const hasPermission = (role, permission) =>
  ROLE_PERMISSIONS[role]?.includes(permission) ?? false;

// Used to sort the participant list: host first, viewers last.
export const ROLE_RANK = { host: 0, moderator: 1, participant: 2, viewer: 3 };
