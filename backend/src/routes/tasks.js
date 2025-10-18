import express from 'express';
import { postTask } from '../controllers/tasks.js';

const router = express.Router();

router.post('/', postTask);
// router.get('/', function);

export default router;