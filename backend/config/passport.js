import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/users/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user exists
                let user = await User.findOne({ email: profile.emails[0].value });

                if (user) {
                    return done(null, user);
                }

                // If not, create new user
                const salt = await bcrypt.genSalt(10);
                const hasedPassword = await bcrypt.hash(
                    Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
                    salt
                );

                user = await User.create({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    password: hasedPassword, // Dummy password for Google users
                    isVerified: true,
                });

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

export default passport;
