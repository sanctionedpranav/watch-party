/**
 * protect (REST auth middleware)
 * ------------------------------
 * Reads "Authorization: Bearer <token>", verifies it and puts the user on req.user.
 * Any route placed after `protect` can trust req.user.
 */
import { verifyToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';

export const protect = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next(new ApiError(401, 'Please log in to continue'));

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, username: decoded.username };
    return next();
  } catch {
    return next(new ApiError(401, 'Session expired. Please log in again'));
  }
};
