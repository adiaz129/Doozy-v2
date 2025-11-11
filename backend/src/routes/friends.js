import express from 'express';
import { checkFriendStatus } from '../middleware/friendStatus.js';
import { requestFriend, deleteOutgoingFriendRequest, deleteIncomingFriendRequest, addFriend, deleteFriend, getIncomingFriendRequests } from '../controllers/friends.js';

const router = express.Router();

router.post('/request/:user_id', checkFriendStatus, requestFriend);
router.get('/request/incoming', getIncomingFriendRequests);
router.delete('/request/outgoing/:user_id', checkFriendStatus, deleteOutgoingFriendRequest);
router.delete('/request/incoming/:user_id', checkFriendStatus, deleteIncomingFriendRequest);
router.post('/:user_id', checkFriendStatus, addFriend);
router.delete('/:user_id', checkFriendStatus, deleteFriend);

export default router;