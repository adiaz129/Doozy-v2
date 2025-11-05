import express from 'express';
import { getUser } from '../controllers/users.js';
import { checkFriendStatus } from '../middleware/friendStatus.js'
import { getPostsByUserId } from '../controllers/posts.js';

const router = express.Router();

router.get('/:user_id', getUser);
router.get('/:user_id/posts', checkFriendStatus, getPostsByUserId);

export default router;