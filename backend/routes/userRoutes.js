import express from 'express';
import passport from 'passport';
import {
    registerUser,
    loginUser,
    googleAuthCallback,
    verifyOtp,
    getUserProfile,
    updateUserProfile,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// Google Auth Routes
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    googleAuthCallback
);

export default router;
