import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import { connectDB } from './lib/mongodb.js'
import { connectCloudinary } from './lib/cloudinary.js';
import passport from './lib/passport.js';

// Router imports
import authRouter from './routes/auth.route.js';
import mongoose from 'mongoose';


dotenv.config(); // Load environment variables from .env file
connectDB(); // Connect to MongoDB
connectCloudinary(); // Connect to Cloudinary

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 3, // 3 days
        },
        store: MongoStore.create({
            client: mongoose.connection.getClient()
        })
    })
);


// Initialize passport js
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRouter);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});