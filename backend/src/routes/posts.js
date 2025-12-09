import express from 'express';
import { getAllPosts, deletePost } from '../controllers/posts.js';
import { toggleLike, getLikes } from '../controllers/likes.js';
import { getComments, postComment, deleteComment } from '../controllers/comments.js';
import { checkFriendStatusByPost } from '../middleware/friendStatus.js';

const router = express.Router();

router.post('/:post_id/like', checkFriendStatusByPost, toggleLike);
router.post('/:post_id/comment', checkFriendStatusByPost, postComment)
router.delete('/:post_id/comment/:comment_id', checkFriendStatusByPost, deleteComment);
router.get('/:post_id/comments', checkFriendStatusByPost, getComments);
router.get('/:post_id/likes', checkFriendStatusByPost, getLikes);
router.get('/', getAllPosts);
router.delete('/:post_id', deletePost);

export default router;