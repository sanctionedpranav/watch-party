/**
 * Role helpers for the UI.
 * IMPORTANT: these only decide what to SHOW/DISABLE. The backend re-checks
 * every action, so a user editing this file in DevTools gains nothing.
 */
export const ROLES = {
  HOST: 'host',
  MODERATOR: 'moderator',
  PARTICIPANT: 'participant',
  VIEWER: 'viewer',
};

export const ASSIGNABLE_ROLES = [ROLES.MODERATOR, ROLES.PARTICIPANT, ROLES.VIEWER];

export const canControlPlayback = (role) => role === ROLES.HOST || role === ROLES.MODERATOR;
export const canApproveRequests = (role) => role === ROLES.HOST || role === ROLES.MODERATOR;
export const canRequestActions = (role) => role === ROLES.PARTICIPANT;
export const isHost = (role) => role === ROLES.HOST;
