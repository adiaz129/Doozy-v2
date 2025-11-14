import express from 'express';
import { getUser, getUsersFromSearch } from '../controllers/users.js';
import { checkFriendStatus } from '../middleware/friendStatus.js'
import { getPostsByUserId } from '../controllers/posts.js';

const router = express.Router();

router.get('/search', getUsersFromSearch);
router.get('/:user_id/posts', checkFriendStatus, getPostsByUserId);
router.get('/:user_id', checkFriendStatus, getUser);

export default router;