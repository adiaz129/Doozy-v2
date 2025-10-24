import express from 'express';
import { postTask, getTasks, completeTask, deleteTask } from '../controllers/tasks.js';

const router = express.Router();

router.post('/', postTask);
router.get('/', getTasks);
router.patch('/:task_id/complete', completeTask);
router.delete('/:task_id', deleteTask);
// router.get('/', function);

export default router;