import express from 'express';
import { validate } from  '../controllers/authValidation.js';
import { register } from '../controllers/auth.js';

const router = express.Router();

router.post('/register', validate, register);
// router.get('/login')

export default router;