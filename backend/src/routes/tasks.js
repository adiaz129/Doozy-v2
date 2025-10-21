import express from 'express';
import { postTask, getAllTasks, getTaskById, getTasksByListId } from '../controllers/tasks.js';

const router = express.Router();

router.post('/', postTask);
router.get('/', getAllTasks);
router.get('/:task_id', getTaskById);
router.get('/:list_id', getTasksByListId);
// router.get('/', function);

export default router;