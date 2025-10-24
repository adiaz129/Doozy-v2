import express from 'express';
import { postTask, getTasks, updateTask, deleteTask } from '../controllers/tasks.js';

const router = express.Router();

router.post('/', postTask);
router.get('/', getTasks);
router.patch('/:task_id', updateTask);
router.delete('/:task_id', deleteTask);
// router.get('/', function);

export default router;