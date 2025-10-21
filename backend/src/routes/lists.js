import express from 'express';
import { getAllLists, postList } from '../controllers/lists.js';

const router = express.Router();

router.post('/', postList);
router.get('/', getAllLists);

export default router;