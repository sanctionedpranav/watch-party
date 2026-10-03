/**
 * Participant
 * -----------
 * One connected user inside one room.
 * socketId is private server data (never sent to clients) - we use it to send
 * a message to just this user (e.g. "you were removed").
 */
export class Participant {
  constructor({ userId, username, socketId, role }) {
    this.userId = userId;
    this.username = username;
    this.socketId = socketId;
    this.role = role;
    this.joinedAt = Date.now();
  }

  /** What other clients are allowed to see */
  toJSON() {
    return { userId: this.userId, username: this.username, role: this.role, joinedAt: this.joinedAt };
  }
}
