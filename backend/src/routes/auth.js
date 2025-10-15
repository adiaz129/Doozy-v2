import express from 'express';
import { validateRegister, validateLogin } from  '../controllers/authValidation.js';
import { register, login } from '../controllers/auth.js';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

export default router;