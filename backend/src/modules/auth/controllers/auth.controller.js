/**
 * Auth controller = HTTP layer only.
 * Read input from req -> call the service -> send the response.
 */
import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../../../shared/utils/asyncHandler.js';

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(result);
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  res.json(result);
});

// GET /api/auth/me  (protected) - used by the frontend to restore a session
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user.id);
  res.json({ user });
});
