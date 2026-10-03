/**
 * Auth service = business logic.
 * It knows nothing about req/res (that's the controller's job), which makes it
 * easy to test and reuse.
 */
import mongoose from 'mongoose';
import crypto from 'crypto';
import { User } from '../models/user.model.js';
import { hashPassword, comparePassword } from '../../../shared/utils/password.js';
import { signToken } from '../../../shared/utils/token.js';
import { ApiError } from '../../../shared/utils/ApiError.js';
import logger from '../../../shared/utils/logger.js';

const isMongoConnected = () => mongoose.connection.readyState === 1;
const memoryUsers = new Map(); // email -> user

/** Both register and login return the same shape: { user, token } */
const buildAuthResponse = (user) => ({
  user: user.toPublic ? user.toPublic() : { id: user._id.toString(), username: user.username, email: user.email },
  // Username goes into the token so the WebSocket server knows who you are
  // without hitting the database on every event.
  token: signToken({ id: (user._id || user.id).toString(), username: user.username }),
});

export const registerUser = async ({ username, email, password } = {}) => {
  if (!username || !email || !password) {
    throw new ApiError(400, 'Username, email and password are required');
  }
  if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');

  const lowerEmail = email.toLowerCase();

  if (isMongoConnected()) {
    const exists = await User.findOne({ $or: [{ email: lowerEmail }, { username }] });
    if (exists) throw new ApiError(409, 'Username or email is already registered');

    const user = await User.create({ username, email: lowerEmail, password: await hashPassword(password) });
    logger.info(`New user registered: ${user.username}`);
    return buildAuthResponse(user);
  }

  // In-memory fallback
  for (const u of memoryUsers.values()) {
    if (u.email === lowerEmail || u.username === username) {
      throw new ApiError(409, 'Username or email is already registered');
    }
  }

  const memUser = {
    _id: 'user_' + crypto.randomBytes(8).toString('hex'),
    username,
    email: lowerEmail,
    password: await hashPassword(password),
  };
  memoryUsers.set(lowerEmail, memUser);
  logger.info(`New in-memory user registered: ${memUser.username}`);
  return buildAuthResponse(memUser);
};

export const loginUser = async ({ email, password } = {}) => {
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const lowerEmail = email.toLowerCase();

  if (isMongoConnected()) {
    const user = await User.findOne({ email: lowerEmail }).select('+password');
    if (!user || !(await comparePassword(password, user.password))) {
      throw new ApiError(401, 'Invalid email or password');
    }
    return buildAuthResponse(user);
  }

  const memUser = memoryUsers.get(lowerEmail);
  if (!memUser || !(await comparePassword(password, memUser.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  return buildAuthResponse(memUser);
};

export const getUserById = async (id) => {
  if (isMongoConnected()) {
    const user = await User.findById(id);
    if (!user) throw new ApiError(404, 'User not found');
    return user.toPublic();
  }
  for (const u of memoryUsers.values()) {
    if (u._id === id || u.id === id) {
      return { id: u._id.toString(), username: u.username, email: u.email };
    }
  }
  throw new ApiError(404, 'User not found');
};
