/**
 * token.js (JWT)
 * --------------
 * After login we give the client a signed token: header.payload.signature
 * The client sends it back on every REST call (Authorization header) and on
 * the WebSocket handshake. The server only VERIFIES the signature - no session
 * storage needed (stateless auth).
 */
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/** payload example: { id: '65f...', username: 'alice' } */
export const signToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

/** Returns the decoded payload, or THROWS if the token is invalid/expired. */
export const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET);
