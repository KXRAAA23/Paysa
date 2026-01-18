import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Add to .env
        pass: process.env.EMAIL_PASS, // Add to .env
    },
});

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        if (userExists.isVerified) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        // If user exists but not verified, resend OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        userExists.name = name;
        userExists.password = password; // Will be hashed by pre-save
        userExists.otp = otp;
        userExists.otpExpiry = otpExpiry;

        await userExists.save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Paysa Verification OTP',
            text: `Your OTP is ${otp}. It expires in 5 minutes.`,
        });

        res.status(200).json({ message: 'OTP sent to email' });
        return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    const user = await User.create({
        name,
        email,
        password,
        otp,
        otpExpiry,
    });

    if (user) {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Paysa Verification OTP',
            text: `Your OTP is ${otp}. It expires in 5 minutes.`,
        });

        res.status(201).json({ message: 'OTP sent to email' });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Verify OTP
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        res.status(400).json({ message: 'User not found' });
        return;
    }

    if (user.isVerified) {
        res.status(400).json({ message: 'User already verified' });
        return;
    }

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
        res.status(400).json({ message: 'Invalid or expired OTP' });
        return;
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
    });
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (!user.isVerified) {
            res.status(401).json({ message: 'Please verify your email first' });
            return;
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            dob: user.dob,
            occupation: user.occupation,
            bio: user.bio,
            isVerified: user.isVerified,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.dob = req.body.dob || user.dob;
        user.occupation = req.body.occupation || user.occupation;
        user.bio = req.body.bio || user.bio;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            dob: updatedUser.dob,
            occupation: updatedUser.occupation,
            bio: updatedUser.bio,
            isVerified: updatedUser.isVerified,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Google Auth Callback
// @route   GET /api/users/google/callback
// @access  Public
const googleAuthCallback = (req, res) => {
    const token = generateToken(req.user._id);
    // Redirect to frontend with token
    res.redirect(`http://localhost:3000/oauth-success?token=${token}`);
};

export {
    registerUser,
    loginUser,
    googleAuthCallback,
    verifyOtp,
    getUserProfile,
    updateUserProfile
};
