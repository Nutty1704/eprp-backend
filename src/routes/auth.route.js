import express from 'express';
import {
    login, logout, register,
    googleAuth, googleCallback,
    loginFailed, getAuthStatus
} from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/status', getAuthStatus);

// Register and Login (Expect role in req.body)
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Google Authentication
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Login Status
router.get('/login/failed', loginFailed);

export default router;
