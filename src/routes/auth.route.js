import express from 'express';
import { login, logout, register } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register/:role', register);
router.post('/login/:role', login);
router.get('/logout', logout);

export default router;