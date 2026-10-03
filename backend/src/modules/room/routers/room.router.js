/**
 * Room routes, mounted at /api/rooms. All of them need a logged-in user.
 */
import { Router } from 'express';
import { createRoom, getMyRooms, getRoom } from '../controllers/room.controller.js';
import { protect } from '../../../shared/middlewares/auth.middleware.js';

const router = Router();

router.use(protect); // applies to every route below

router.post('/', createRoom);
router.get('/mine', getMyRooms); // must be BEFORE '/:code' or "mine" is treated as a code
router.get('/:code', getRoom);

export default router;
