import express from 'express';
import { getAllLists, postList, deleteList, updateList } from '../controllers/lists.js';

const router = express.Router();

router.post('/', postList);
router.get('/', getAllLists);
router.delete('/:list_id', deleteList);
router.patch('/:list_id', updateList);

export default router;