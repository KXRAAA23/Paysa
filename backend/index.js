import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import passport from 'passport';

import './config/passport.js'; // Import passport config

import userRoutes from './routes/userRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize()); // Initialize Passport
app.use('/uploads', express.static('uploads'));

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB();

app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/expenses', expenseRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
