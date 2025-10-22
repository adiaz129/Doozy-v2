import express from 'express';
import { postTask, getTasks } from '../controllers/tasks.js';

const router = express.Router();

router.post('/', postTask);
router.get('/', getTasks);
// router.get('/', function);

export default router;