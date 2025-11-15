import express from 'express';
import { getAllPosts } from '../controllers/posts.js';
import { toggleLike, getLikes } from '../controllers/likes.js';
import { checkFriendStatusByPost } from '../middleware/friendStatus.js';

const router = express.Router();

router.post('/:post_id/like', checkFriendStatusByPost, toggleLike);
router.get('/:post_id/likes', checkFriendStatusByPost, getLikes);
router.get('/', getAllPosts);

export default router;