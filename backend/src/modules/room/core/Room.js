/**
 * Room (in-memory, OOP)
 * ---------------------
 * Holds the LIVE state of one watch party:
 *   - participants (Map userId -> Participant)
 *   - playback state (videoId, isPlaying, position)
 *   - pending requests from participants
 *
 * The socket handlers never touch these fields directly; they call methods
 * like room.play() / room.assignRole(). That keeps the rules in one place.
 *
 * KEY IDEA - how we know the current time without the clients telling us:
 *   we store `position` (seconds) + `updatedAt` (timestamp) at the last change.
 *   If the video is playing:  currentTime = position + (now - updatedAt) / 1000
 *   So a late joiner always gets the correct second.
 */
import crypto from 'crypto';
import { Participant } from './Participant.js';
import { ROLES, ROLE_RANK, hasPermission, PERMISSIONS } from '../../../shared/constants/roles.js';

export class Room {
  constructor({ code, name, hostId, videoId = '' }) {
    this.code = code;
    this.name = name;
    this.hostId = hostId;

    this.participants = new Map(); // userId -> Participant
    this.savedRoles = new Map(); // userId -> role (so a refresh doesn't lose your role)
    this.removedUserIds = new Set(); // kicked users cannot re-join
    this.pendingRequests = new Map(); // requestId -> request

    this.playback = { videoId, isPlaying: false, position: 0, updatedAt: Date.now() };
  }

  // ------------------------------------------------------------------ people

  addParticipant({ userId, username, socketId }) {
    // Same user opened a second tab / reconnected -> just update the socket
    const existing = this.participants.get(userId);
    if (existing) {
      existing.socketId = socketId;
      return existing;
    }

    const isFirstInRoom = this.participants.size === 0 && !this.hostId;
    if (isFirstInRoom) {
      this.hostId = userId;
    }

    const role = (userId === this.hostId)
      ? ROLES.HOST
      : this.savedRoles.get(userId) || ROLES.PARTICIPANT; // default for joiners

    const participant = new Participant({ userId, username, socketId, role });
    this.participants.set(userId, participant);
    return participant;
  }

  /** User left / disconnected (they may come back) */
  leave(userId) {
    this.participants.delete(userId);
    this.dropRequestsFrom(userId);
  }

  /** Host kicked the user (they may NOT come back) */
  removeParticipant(userId) {
    this.leave(userId);
    this.removedUserIds.add(userId);
  }

  isRemoved(userId) {
    return this.removedUserIds.has(userId);
  }

  getParticipant(userId) {
    return this.participants.get(userId);
  }

  assignRole(userId, role) {
    const participant = this.participants.get(userId);
    participant.role = role;
    this.savedRoles.set(userId, role);
    return participant;
  }

  /** Old host becomes moderator, new user becomes host */
  transferHost(newHostId) {
    const targetUserId = String(newHostId);

    // 1. Locate the current host participant
    const oldHost =
      [...this.participants.values()].find((p) => p.role === ROLES.HOST) ||
      this.participants.get(this.hostId);

    if (oldHost) {
      oldHost.role = ROLES.MODERATOR;
      this.savedRoles.set(oldHost.userId, ROLES.MODERATOR);
    } else if (this.hostId) {
      this.savedRoles.set(this.hostId, ROLES.MODERATOR);
    }

    // 2. Assign Host role to the new host
    this.hostId = targetUserId;
    this.savedRoles.set(targetUserId, ROLES.HOST);

    const newHost = this.participants.get(targetUserId);
    if (newHost) {
      newHost.role = ROLES.HOST;
    }

    return newHost || { userId: targetUserId, username: 'Host', role: ROLES.HOST };
  }

  /** Host & moderators - they receive participant requests */
  getApprovers() {
    return [...this.participants.values()].filter((p) =>
      hasPermission(p.role, PERMISSIONS.APPROVE_REQUESTS)
    );
  }

  /** Sorted list for the UI: host, moderators, participants, viewers */
  getParticipantsList() {
    return [...this.participants.values()]
      .map((p) => p.toJSON())
      .sort((a, b) => ROLE_RANK[a.role] - ROLE_RANK[b.role] || a.joinedAt - b.joinedAt);
  }

  isEmpty() {
    return this.participants.size === 0;
  }

  // ---------------------------------------------------------------- playback

  /** Where the video SHOULD be right now (see KEY IDEA above) */
  getCurrentTime() {
    const { isPlaying, position, updatedAt } = this.playback;
    return isPlaying ? position + (Date.now() - updatedAt) / 1000 : position;
  }

  /** Every playback change goes through here so `updatedAt` is always correct */
  updatePlayback(changes) {
    this.playback = {
      ...this.playback,
      position: this.getCurrentTime(), // freeze current time first
      ...changes,
      updatedAt: Date.now(),
    };
  }

  play() {
    this.updatePlayback({ isPlaying: true });
  }

  pause() {
    this.updatePlayback({ isPlaying: false });
  }

  seek(seconds) {
    this.updatePlayback({ position: seconds });
  }

  changeVideo(videoId) {
    this.updatePlayback({ videoId, position: 0, isPlaying: true });
  }

  /** Payload of the `sync_state` event */
  getSyncState() {
    return {
      videoId: this.playback.videoId,
      isPlaying: this.playback.isPlaying,
      playState: this.playback.isPlaying ? 'playing' : 'paused',
      currentTime: this.getCurrentTime(),
    };
  }

  // ---------------------------------------------------------------- requests

  createRequest(participant, type, payload) {
    const request = {
      id: crypto.randomUUID(),
      userId: participant.userId,
      username: participant.username,
      type, // 'play' | 'pause' | 'seek' | 'change_video'
      payload, // e.g. { time: 42 } or { videoId: 'abc' }
      createdAt: Date.now(),
    };
    this.pendingRequests.set(request.id, request);
    return request;
  }

  /** Removes and returns the request (so it can only be handled once) */
  takeRequest(requestId) {
    const request = this.pendingRequests.get(requestId);
    this.pendingRequests.delete(requestId);
    return request;
  }

  dropRequestsFrom(userId) {
    for (const [id, request] of this.pendingRequests) {
      if (request.userId === userId) this.pendingRequests.delete(id);
    }
  }

  getPendingRequests() {
    return [...this.pendingRequests.values()];
  }

  /** Basic room info sent on join */
  getInfo() {
    return { code: this.code, name: this.name, hostId: this.hostId };
  }
}
